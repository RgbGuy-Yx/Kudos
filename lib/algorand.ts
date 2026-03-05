import algosdk from 'algosdk';
import contractSpec from '@/contracts/artifacts/KudosEscrowContract.arc56.json';

// Initialize Algod client
export function getAlgodClient() {
  const server = (process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud').replace(/\/+$/, '');
  const port = process.env.NEXT_PUBLIC_ALGOD_PORT || '';
  return new algosdk.Algodv2(
    process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
    server,
    port
  );
}

// Contract state interface
export interface ContractState {
  escrowBalance: number;
  currentMilestone: number;
  totalAmount: number;
  totalMilestones: number;
  sponsorAddress: string;
  studentAddress: string;
  isActive: boolean;
  lastUpdated: number;
}

function toBigInt(value: unknown, fallback: bigint = BigInt(0)): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.floor(value));
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      return BigInt(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function toSafeNumber(value: bigint): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  if (value > max) return Number.MAX_SAFE_INTEGER;
  if (value < BigInt(0)) return 0;
  return Number(value);
}

// Fetch global state from app
export async function getContractGlobalState(appId: number): Promise<ContractState | null> {
  // Validate app ID
  if (!appId || appId <= 0) {
    throw new Error('Invalid application ID. Please enter a valid App ID.');
  }

  try {
    const algodClient = getAlgodClient();
    const appInfo = await algodClient.getApplicationByID(appId).do();
    
    const globalState = appInfo.params?.globalState;
    
    if (!globalState || globalState.length === 0) {
      throw new Error('Application has no global state. This may not be a Kudos grant contract.');
    }
    
    // Parse global state
    const state: any = {};
    globalState.forEach((item: any) => {
      const keyRaw = item.key;
      const key = typeof keyRaw === 'string'
        ? Buffer.from(keyRaw, 'base64').toString()
        : Buffer.from(keyRaw as Uint8Array).toString();
      const value = item.value;
      
      if (value.type === 1) {
        // bytes
        const bytesRaw = value.bytes;
        state[key] = typeof bytesRaw === 'string'
          ? Buffer.from(bytesRaw, 'base64').toString()
          : Buffer.from(bytesRaw as Uint8Array).toString();
      } else if (value.type === 2) {
        // uint
        state[key] = value.uint;
      }
    });

    // Compute remaining escrow: funded_amount - (total_amount / milestone_count) * milestone_index
    const fundedAmount = toBigInt(state.funded_amount, BigInt(0));
    const totalAmount = toBigInt(state.total_amount, BigInt(0));
    const milestoneCount = toBigInt(state.milestone_count, BigInt(1)) || BigInt(1);
    const milestoneIndex = toBigInt(state.milestone_index, BigInt(0));
    const basePayout = totalAmount / milestoneCount;
    const paidOutSoFar = basePayout * milestoneIndex;
    const remainingEscrow = fundedAmount > paidOutSoFar ? fundedAmount - paidOutSoFar : BigInt(0);

    return {
      escrowBalance: toSafeNumber(remainingEscrow),
      currentMilestone: toSafeNumber(milestoneIndex),
      totalAmount: toSafeNumber(totalAmount),
      totalMilestones: toSafeNumber(milestoneCount),
      sponsorAddress: state.sponsor || '',
      studentAddress: state.student || '',
      isActive: toBigInt(state.status, BigInt(0)) === BigInt(1),
      lastUpdated: Date.now(),
    };
  } catch (error: any) {
    console.error('Error fetching contract state:', error);
    
    // Handle specific error cases
    if (error.status === 404 || error.response?.status === 404) {
      throw new Error(`Application ${appId} does not exist on the blockchain. Please check the App ID.`);
    }
    
    if (error.message?.includes('application does not exist')) {
      throw new Error(`Application ${appId} does not exist on the blockchain. Please check the App ID.`);
    }
    
    if (error.name === 'TypeError' || error.message?.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Algorand node. Please check your connection.');
    }
    
    // Re-throw with original message if it's already a custom error
    if (error.message?.includes('Application has no global state') || 
        error.message?.includes('Invalid application ID')) {
      throw error;
    }
    
    // Generic error
    throw new Error(`Failed to load contract: ${error.message || 'Unknown error'}`);
  }
}

// ─── Server-side verification utilities ────────────────────────────────

/**
 * Verify an on-chain application exists and the sponsor address matches.
 * Used by API routes to prevent spoofed appIds.
 */
export async function verifyAppOnChain(
  appId: number,
  expectedSponsorWallet: string
): Promise<{ valid: boolean; error?: string }> {
  if (!appId || appId <= 0) {
    return { valid: false, error: 'Invalid application ID' };
  }

  // Reject demo/fake appIds on the server
  if (appId >= 900000000) {
    return { valid: false, error: 'Demo application IDs are not accepted' };
  }

  try {
    const algodClient = getAlgodClient();
    const appInfo = await algodClient.getApplicationByID(appId).do();

    const globalState = appInfo.params?.globalState;
    if (!globalState || globalState.length === 0) {
      return { valid: false, error: 'Application has no global state' };
    }

    // Parse sponsor from global state (32-byte public key stored as bytes)
    let onChainSponsor = '';
    for (const item of globalState) {
      const keyRaw = item.key;
      const key = typeof keyRaw === 'string'
        ? Buffer.from(keyRaw, 'base64').toString()
        : Buffer.from(keyRaw as Uint8Array).toString();
      if (key === 'sponsor' && item.value.type === 1) {
        // Algorand address = base32 encoding of the 32-byte public key + checksum
        const bytesRaw = item.value.bytes;
        const pubKeyBytes = typeof bytesRaw === 'string'
          ? Buffer.from(bytesRaw, 'base64')
          : Buffer.from(bytesRaw as Uint8Array);
        if (pubKeyBytes.length === 32) {
          onChainSponsor = algosdk.encodeAddress(new Uint8Array(pubKeyBytes));
        }
      }
    }

    if (!onChainSponsor) {
      return { valid: false, error: 'Could not read sponsor from on-chain state' };
    }

    if (onChainSponsor !== expectedSponsorWallet) {
      return { valid: false, error: 'On-chain sponsor does not match your wallet' };
    }

    return { valid: true };
  } catch (error: any) {
    if (error.status === 404 || error.message?.includes('does not exist')) {
      return { valid: false, error: `Application ${appId} does not exist on-chain` };
    }
    return { valid: false, error: `On-chain verification failed: ${error.message}` };
  }
}

/**
 * Verify a transaction ID exists on Algorand (confirmed or pending).
 */
export async function verifyTransactionOnChain(txId: string): Promise<boolean> {
  if (!txId || txId.startsWith('DEMO-')) {
    return false;
  }

  try {
    const algodClient = getAlgodClient();
    const txInfo = await algodClient.pendingTransactionInformation(txId).do();
    // If we get a response without error, the tx exists
    return !!txInfo;
  } catch {
    // Transaction may already be confirmed and no longer pending — try indexer-style check
    // For testnet without indexer, accept the tx if it was at least submitted
    return false;
  }
}

// Get account balance
export async function getAccountBalance(address: string): Promise<number> {
  try {
    const algodClient = getAlgodClient();
    const accountInfo = await algodClient.accountInformation(address).do();
    const amount = Number(accountInfo.amount);
    return Number.isFinite(amount) ? amount : 0;
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return 0;
  }
}

async function ensureSpendableBalance(
  address: string,
  requiredSpendMicroalgos: number,
  action: string
): Promise<void> {
  const algodClient = getAlgodClient();
  try {
    const accountInfo: any = await algodClient.accountInformation(address).do();
    const amount = Number(accountInfo.amount ?? 0);
    const minBalance = Number(accountInfo['min-balance'] ?? accountInfo.minBalance ?? 100000);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        `${action} failed: wallet ${address} has 0 ALGO balance on testnet. Fund this exact wallet and retry.`
      );
    }

    if (!Number.isFinite(minBalance) || minBalance < 0) {
      throw new Error(`${action} failed: could not determine account minimum balance.`);
    }

    const spendable = amount - minBalance;
    if (spendable < requiredSpendMicroalgos) {
      throw new Error(
        `${action} failed: insufficient spendable balance. ` +
        `Balance=${amount} µALGO, MinBalance=${minBalance} µALGO, Spendable=${Math.max(0, spendable)} µALGO, Required=${requiredSpendMicroalgos} µALGO.`
      );
    }
  } catch (error: any) {
    if (error?.message) {
      throw error;
    }
    throw new Error(`${action} failed: unable to read account balance from Algorand node.`);
  }
}

// Create application call transaction
export async function createAppCallTxn(
  from: string,
  appId: number,
  appArgs: Uint8Array[],
  accounts?: string[],
  foreignApps?: number[],
  foreignAssets?: number[],
  innerTxnCount: number = 0
) {
  const algodClient = getAlgodClient();
  const suggestedParams = await algodClient.getTransactionParams().do();

  const minFee = Number(suggestedParams.minFee || 1000);
  const feeMultiplier = 1 + Math.max(0, innerTxnCount);
  const adjustedSuggestedParams = {
    ...suggestedParams,
    fee: minFee * feeMultiplier,
    flatFee: true,
  };

  return algosdk.makeApplicationCallTxnFromObject({
    sender: from,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs,
    accounts,
    foreignApps,
    foreignAssets,
    suggestedParams: adjustedSuggestedParams,
  });
}

// Create payment transaction
export async function createPaymentTxn(
  from: string,
  to: string,
  amount: number,
  note?: string
) {
  const algodClient = getAlgodClient();
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: from,
    receiver: to,
    amount,
    note: note ? new Uint8Array(Buffer.from(note)) : undefined,
    suggestedParams,
  });
}

// Wait for transaction confirmation
export async function waitForConfirmation(txId: string): Promise<any> {
  const algodClient = getAlgodClient();
  return await algosdk.waitForConfirmation(algodClient, txId, 4);
}

// Format microalgos to ALGO
export function microalgosToAlgo(microalgos: number): string {
  return (microalgos / 1_000_000).toFixed(6);
}

// Format ALGO to microalgos
export function algoToMicroalgos(algo: number): number {
  return Math.floor(algo * 1_000_000);
}

// Encode method arguments
export function encodeString(text: string): Uint8Array {
  return new Uint8Array(Buffer.from(text));
}

export function encodeUint64(num: number): Uint8Array {
  return algosdk.encodeUint64(num);
}

function decodeBase64Program(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function decodeHex(hex: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(hex, 'hex'));
  }

  const clean = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let index = 0; index < clean.length; index += 2) {
    bytes[index / 2] = parseInt(clean.slice(index, index + 2), 16);
  }
  return bytes;
}

function normalizeAlgodError(error: any, action: string): Error {
  const responseBody = error?.response?.body;
  const rawMessage =
    responseBody?.message ||
    responseBody?.data?.message ||
    responseBody?.data?.['pool-error'] ||
    error?.response?.text ||
    error?.message ||
    'Unknown Algorand error';

  const message = String(rawMessage);

  if (message.includes('below min 100000')) {
    return new Error(
      `${action} failed: connected wallet balance is below Algorand minimum (0.1 ALGO). Fund the sponsor wallet and retry.`
    );
  }

  if (message.includes('fee too small')) {
    return new Error(`${action} failed: transaction fee is too small for this operation. Please retry.`);
  }

  if (message.includes('logic eval error')) {
    return new Error(`${action} failed: smart contract rejected the transaction. Details: ${message}`);
  }

  if (message.includes('overspend')) {
    return new Error(`${action} failed: insufficient balance to pay amount + network fees.`);
  }

  if (message.includes('transaction dead') || message.includes('expired')) {
    return new Error(`${action} failed: transaction expired before submission. Please retry and approve promptly in wallet.`);
  }

  if (message.includes('invalid') && message.includes('group')) {
    return new Error(`${action} failed: transaction group is invalid or incomplete. Please retry.`);
  }

  if (message.includes('amount mismatch')) {
    return new Error(`${action} failed: funding amount must exactly match the grant amount in contract.`);
  }

  return new Error(`${action} failed: ${message}`);
}

function concatSignedTransactions(blobs: Uint8Array[]): Uint8Array {
  const totalLength = blobs.reduce((sum, blob) => sum + blob.length, 0);
  const joined = new Uint8Array(totalLength);
  let offset = 0;

  for (const blob of blobs) {
    joined.set(blob, offset);
    offset += blob.length;
  }

  return joined;
}

function normalizeSignedInput(signed: Uint8Array[] | Uint8Array): Uint8Array {
  if (signed instanceof Uint8Array) {
    if (signed.length === 0) {
      throw new Error('Signed transaction payload is empty');
    }
    return signed;
  }

  if (!Array.isArray(signed) || signed.length === 0) {
    throw new Error('No signed transaction data returned by wallet');
  }

  const blobs = signed.filter((blob): blob is Uint8Array => blob instanceof Uint8Array && blob.length > 0);
  if (blobs.length === 0) {
    throw new Error('Wallet returned invalid signed transaction data');
  }

  return blobs.length === 1 ? blobs[0] : concatSignedTransactions(blobs);
}

async function sendSignedTransaction(
  signed: Uint8Array[] | Uint8Array,
  action: string
): Promise<string> {
  const algodClient = getAlgodClient();
  try {
    const payload = normalizeSignedInput(signed);
    const result = await algodClient.sendRawTransaction(payload).do();
    return result.txid;
  } catch (error: any) {
    throw normalizeAlgodError(error, action);
  }
}

export async function createApplication(
  sponsorAddress: string,
  studentWallet: string,
  proposedBudgetMicroalgos: number,
  totalMilestones: number,
  signTransaction: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>
): Promise<{ txId: string; appId: number }> {
  const approvalProgramB64 =
    process.env.NEXT_PUBLIC_APPROVAL_PROGRAM_B64 ||
    (contractSpec as any)?.byteCode?.approval ||
    '';
  const clearProgramB64 =
    process.env.NEXT_PUBLIC_CLEAR_PROGRAM_B64 ||
    (contractSpec as any)?.byteCode?.clear ||
    '';

  if (!approvalProgramB64 || !clearProgramB64) {
    throw new Error('Contract bytecode not configured for app creation');
  }

  const approvalProgram = decodeBase64Program(approvalProgramB64);
  const clearProgram = decodeBase64Program(clearProgramB64);

  // ARC-4 selector for: create_application(address,uint64,uint64)void
  const createApplicationSelector = decodeHex('669e5100');

  const algodClient = getAlgodClient();
  const suggestedParams = await algodClient.getTransactionParams().do();

  const createTxn = algosdk.makeApplicationCreateTxnFromObject({
    sender: sponsorAddress,
    suggestedParams,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram,
    clearProgram,
    numLocalInts: 0,
    numLocalByteSlices: 0,
    numGlobalInts: 5,
    numGlobalByteSlices: 2,
    appArgs: [
      createApplicationSelector,
      new Uint8Array(algosdk.decodeAddress(studentWallet).publicKey),
      encodeUint64(proposedBudgetMicroalgos),
      encodeUint64(totalMilestones),
    ],
  });

  await ensureSpendableBalance(sponsorAddress, Number(createTxn.fee || 1000), 'Create application');

  const signedTxns = await signTransaction([createTxn]);
  
  // Pera returns flat array of Uint8Array, send as single blob if only one txn
  const txnBlob = signedTxns.length === 1 ? signedTxns[0] : signedTxns;
  const txId = await sendSignedTransaction(txnBlob, 'Create application');
  await waitForConfirmation(txId);

  const pendingTxn = await algodClient.pendingTransactionInformation(txId).do();
  const appId = Number(pendingTxn.applicationIndex);

  if (!appId || Number.isNaN(appId)) {
    throw new Error('Application creation failed');
  }

  return {
    txId,
    appId,
  };
}

export async function fundContract(
  sponsorAddress: string,
  appId: number,
  amountMicroalgos: number,
  signTransaction: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>
): Promise<string> {
  if (appId >= 900000000) {
    return `DEMO-FUND-${Date.now()}`;
  }

  const algodClient = getAlgodClient();
  const appAddress = algosdk.getApplicationAddress(appId).toString();

  // ARC-4 selector for: fund_contract()void
  const fundContractSelector = decodeHex('d072f6e1');

  const paymentTxn = await createPaymentTxn(
    sponsorAddress,
    appAddress,
    amountMicroalgos,
    'Fund escrow'
  );
  const appCallTxn = await createAppCallTxn(sponsorAddress, appId, [fundContractSelector]);

  const requiredSpend = amountMicroalgos + Number(paymentTxn.fee || 1000) + Number(appCallTxn.fee || 1000);
  await ensureSpendableBalance(sponsorAddress, requiredSpend, 'Fund escrow');

  const grouped = [paymentTxn, appCallTxn];
  algosdk.assignGroupID(grouped);

  const signedTxns = await signTransaction(grouped);
  const txId = await sendSignedTransaction(signedTxns, 'Fund escrow');
  await waitForConfirmation(txId);

  return txId;
}

export async function approveMilestone(
  sponsorAddress: string,
  appId: number,
  signTransaction: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>
): Promise<string> {
  if (appId >= 900000000) {
    return `DEMO-APPROVE-${Date.now()}`;
  }

  // ARC-4 selector for: approve_milestone()void
  const approveMilestoneSelector = decodeHex('a9a0077f');

  const txn = await createAppCallTxn(
    sponsorAddress,
    appId,
    [approveMilestoneSelector],
    undefined,
    undefined,
    undefined,
    1
  );

  await ensureSpendableBalance(sponsorAddress, Number(txn.fee || 2000), 'Approve milestone');

  const signedTxn = await signTransaction([txn]);
  const txnBlob = signedTxn.length === 1 ? signedTxn[0] : signedTxn;
  const txId = await sendSignedTransaction(txnBlob, 'Approve milestone');
  await waitForConfirmation(txId);

  return txId;
}

export async function emergencyClawback(
  sponsorAddress: string,
  appId: number,
  signTransaction: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>
): Promise<string> {
  if (appId >= 900000000) {
    return `DEMO-CLAWBACK-${Date.now()}`;
  }

  // ARC-4 selector for: emergency_clawback()void
  const emergencyClawbackSelector = decodeHex('6bd81849');

  // Ensure escrow account keeps minimum balance after clawback payout.
  // Contract sends remaining escrow out; if app account would drop below min-balance,
  // proactively top it up from sponsor so the clawback call can pass.
  const algodClient = getAlgodClient();
  const appAddress = algosdk.getApplicationAddress(appId).toString();
  const appAccountInfo: any = await algodClient.accountInformation(appAddress).do();
  const appBalance = Number(appAccountInfo.amount ?? 0);
  const appMinBalance = Number(appAccountInfo['min-balance'] ?? appAccountInfo.minBalance ?? 100000);

  const state = await getContractGlobalState(appId);
  const clawbackAmount = Number(state?.escrowBalance ?? 0);

  // Post-clawback app balance = appBalance - clawbackAmount.
  // We need post-clawback >= appMinBalance.
  const requiredTopUp = Math.max(0, appMinBalance - (appBalance - clawbackAmount));

  if (requiredTopUp > 0) {
    const topUpTxn = await createPaymentTxn(
      sponsorAddress,
      appAddress,
      requiredTopUp,
      'Top up app min-balance before clawback'
    );

    await ensureSpendableBalance(
      sponsorAddress,
      requiredTopUp + Number(topUpTxn.fee || 1000),
      'Cancel & clawback (reserve top-up)'
    );

    const signedTopUpTxn = await signTransaction([topUpTxn]);
    const topUpBlob = signedTopUpTxn.length === 1 ? signedTopUpTxn[0] : signedTopUpTxn;
    const topUpTxId = await sendSignedTransaction(topUpBlob, 'Escrow reserve top-up');
    await waitForConfirmation(topUpTxId);
  }

  const txn = await createAppCallTxn(
    sponsorAddress,
    appId,
    [emergencyClawbackSelector],
    undefined,
    undefined,
    undefined,
    1
  );

  await ensureSpendableBalance(sponsorAddress, Number(txn.fee || 2000), 'Cancel & clawback');

  const signedTxn = await signTransaction([txn]);
  const txnBlob = signedTxn.length === 1 ? signedTxn[0] : signedTxn;
  const txId = await sendSignedTransaction(txnBlob, 'Cancel & clawback');
  await waitForConfirmation(txId);

  return txId;
}

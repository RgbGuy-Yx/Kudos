import algosdk from 'algosdk';
import contractSpec from '@/contracts/artifacts/KudosEscrowContract.arc56.json';

// Initialize Algod client
export function getAlgodClient() {
  return new algosdk.Algodv2(
    process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
    process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
    process.env.NEXT_PUBLIC_ALGOD_PORT || '443'
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
      const key = Buffer.from(item.key, 'base64').toString();
      const value = item.value;
      
      if (value.type === 1) {
        // bytes
        state[key] = Buffer.from(value.bytes, 'base64').toString();
      } else if (value.type === 2) {
        // uint
        state[key] = value.uint;
      }
    });

    return {
      escrowBalance: state.escrow_balance || 0,
      currentMilestone: state.current_milestone || 0,
      totalAmount: state.total_amount || 0,
      totalMilestones: state.total_milestones || 0,
      sponsorAddress: state.sponsor || '',
      studentAddress: state.student || '',
      isActive: state.is_active === 1,
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

// Get account balance
export async function getAccountBalance(address: string): Promise<number> {
  try {
    const algodClient = getAlgodClient();
    const accountInfo = await algodClient.accountInformation(address).do();
    return Number(accountInfo.amount);
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return 0;
  }
}

// Create application call transaction
export async function createAppCallTxn(
  from: string,
  appId: number,
  appArgs: Uint8Array[],
  accounts?: string[],
  foreignApps?: number[],
  foreignAssets?: number[]
) {
  const algodClient = getAlgodClient();
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makeApplicationCallTxnFromObject({
    sender: from,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs,
    accounts,
    foreignApps,
    foreignAssets,
    suggestedParams,
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

  const signedTxns = await signTransaction([createTxn]);
  
  // Pera returns flat array of Uint8Array, send as single blob if only one txn
  const txnBlob = signedTxns.length === 1 ? signedTxns[0] : signedTxns;
  const result = await algodClient.sendRawTransaction(txnBlob).do();

  const txId = result.txid;
  await waitForConfirmation(txId);

  const pendingTxn = await algodClient.pendingTransactionInformation(txId).do();
  const appId = Number(pendingTxn.applicationIndex);

  if (!appId || Number.isNaN(appId)) {
    throw new Error('Application creation failed');
  }

  return {
    txId: result.txid,
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

  const grouped = [paymentTxn, appCallTxn];
  algosdk.assignGroupID(grouped);

  const signedTxns = await signTransaction(grouped);
  const result = await algodClient.sendRawTransaction(signedTxns).do();
  const txId = result.txid;
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

  const txn = await createAppCallTxn(sponsorAddress, appId, [approveMilestoneSelector]);

  const signedTxn = await signTransaction([txn]);
  const algodClient = getAlgodClient();
  const txnBlob = signedTxn.length === 1 ? signedTxn[0] : signedTxn;
  const result = await algodClient.sendRawTransaction(txnBlob).do();
  const txId = result.txid;
  await waitForConfirmation(txId);

  return txId;

  return result.txid;
}

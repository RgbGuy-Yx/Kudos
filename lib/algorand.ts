import algosdk from 'algosdk';

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

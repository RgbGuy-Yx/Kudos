# Algorand Integration in Kudos

This document explains how Algorand blockchain is integrated into the Kudos grant management platform.

## Overview

Kudos uses Algorand smart contracts to create a trustless escrow system for educational grants. Sponsors fund escrow contracts, and funds are automatically released to students as they complete milestones.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Pera Wallet    │     │   Algorand      │
│   (Next.js)     │◄───►│   (Signing)      │◄───►│   TestNet       │
└────────┬────────┘     └──────────────────┘     └────────┬────────┘
         │                                                │
         │              ┌──────────────────┐              │
         └─────────────►│  KudosEscrow     │◄─────────────┘
                        │  Smart Contract  │
                        └──────────────────┘
```

## Smart Contract (KudosEscrowContract)

### Location
- Source: `contracts/kudos_escrow_contract.py` (Puya/AlgoPy)
- Compiled Artifact: `contracts/artifacts/KudosEscrowContract.arc56.json`

### Contract State (Global)
| Key | Type | Description |
|-----|------|-------------|
| `sponsor` | Address | Wallet that created and funded the grant |
| `student` | Address | Recipient wallet for milestone payouts |
| `total_amount` | UInt64 | Total grant amount in microALGOs |
| `milestone_count` | UInt64 | Number of milestones for this grant |
| `milestone_index` | UInt64 | Current milestone (0-indexed) |
| `funded_amount` | UInt64 | Amount deposited into escrow |
| `status` | UInt64 | 0=Created, 1=Funded, 2=Completed, 3=Clawback |

### ARC-4 Methods

#### `create_application(address, uint64, uint64) void`
- **Selector**: `0x669e5100`
- **Purpose**: Initialize escrow with student address, total amount, milestone count
- **Called at**: App creation only

#### `fund_contract() void`
- **Selector**: `0xd072f6e1`
- **Purpose**: Receive grant funds into escrow
- **Requirements**: 
  - Must be called by sponsor
  - Grouped with payment transaction to app address
  - Payment amount must equal `total_amount`

#### `approve_milestone() void`
- **Selector**: `0xa9a0077f`
- **Purpose**: Approve next milestone and release funds
- **Behavior**: 
  - Releases `total_amount / milestone_count` to student
  - Final milestone releases remaining balance (handles rounding)
  - Sets status to Completed when all milestones done

#### `emergency_clawback() void`
- **Selector**: `0x6bd81849`
- **Purpose**: Return remaining escrow to sponsor (emergency only)
- **Requirements**: Only callable by sponsor while grant is active

## Client Integration

### File: `lib/algorand.ts`

#### Connection
```typescript
// Connects to Algorand TestNet via Algonode
const algodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  '443'
);
```

#### Key Functions

##### `createApplication()`
Deploys a new escrow contract:
```typescript
const createTxn = algosdk.makeApplicationCreateTxnFromObject({
  sender: sponsorAddress,
  approvalProgram,      // From arc56.json bytecode
  clearProgram,
  numGlobalInts: 5,
  numGlobalByteSlices: 2,
  appArgs: [
    selector,           // 0x669e5100
    studentPublicKey,   // 32 bytes
    totalAmount,        // uint64
    milestoneCount,     // uint64
  ],
});
```

##### `fundContract()`
Funds the escrow with a grouped transaction:
```typescript
// Transaction 1: Payment to app address
const paymentTxn = makePaymentTxn(sponsor, appAddress, amount);

// Transaction 2: App call to fund_contract
const appCallTxn = makeAppCallTxn(sponsor, appId, [0xd072f6e1]);

// Group and sign together
algosdk.assignGroupID([paymentTxn, appCallTxn]);
```

##### `approveMilestone()`
Approves milestone and triggers payout:
```typescript
const txn = makeAppCallTxn(sponsor, appId, [0xa9a0077f]);
// Contract internally:
// 1. Calculates payout = total_amount / milestone_count
// 2. Sends inner transaction to student
// 3. Increments milestone_index
```

##### `getContractGlobalState()`
Reads current escrow state from blockchain:
```typescript
const appInfo = await algodClient.getApplicationByID(appId).do();
// Parse global state keys: sponsor, student, status, etc.
```

## Wallet Integration

### File: `contexts/WalletContext.tsx`

Uses **Pera Wallet** for transaction signing:

```typescript
import { PeraWalletConnect } from '@perawallet/connect';

const wallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true,
});

// Sign transactions
const signedTxns = await wallet.signTransaction([
  txns.map(txn => ({ txn }))
]);
```

## Grant Lifecycle

### 1. Grant Creation
```
Sponsor selects project → Enters amount & milestones
    ↓
createApplication() → Deploys new escrow contract
    ↓
fundContract() → Sends full amount to escrow
    ↓
Save to MongoDB: { projectId, appId, txId, status: 'ACTIVE' }
```

### 2. Milestone Submission
```
Student completes work → Submits via UI
    ↓
Save to MongoDB: { grantId, milestoneIndex, status: 'PENDING' }
```

### 3. Milestone Approval
```
Sponsor reviews submission → Clicks "Approve"
    ↓
approveMilestone() → Contract releases funds to student
    ↓
Update MongoDB: { status: 'APPROVED', txId }
```

### 4. Grant Completion
```
All milestones approved → Contract status = 2 (Completed)
    ↓
Grant marked complete in database
```

## Payout Calculation

For a grant with `total_amount = 300,000 microALGOs` and `milestone_count = 3`:

| Milestone | Payout | Calculation |
|-----------|--------|-------------|
| 1 | 100,000 | `300,000 / 3` |
| 2 | 100,000 | `300,000 / 3` |
| 3 | 100,000 | Remaining balance |

The final milestone pays the remaining balance to handle any rounding errors.

## Environment Variables

```env
# Algorand Node (TestNet)
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algonode.cloud
NEXT_PUBLIC_ALGOD_PORT=443
NEXT_PUBLIC_ALGOD_TOKEN=

# Optional: Pre-compiled bytecode (falls back to arc56.json)
NEXT_PUBLIC_APPROVAL_PROGRAM_B64=
NEXT_PUBLIC_CLEAR_PROGRAM_B64=
```

## Security Features

1. **Sponsor-only operations**: Only the original sponsor can fund, approve, or clawback
2. **Immutable recipient**: Student address set at creation, cannot be changed
3. **Grouped transactions**: Funding requires atomic payment + app call
4. **On-chain state**: All escrow data stored on Algorand, not just database

## Testing

### Prerequisites
- Pera Wallet app with TestNet account
- TestNet ALGOs (get from [TestNet Dispenser](https://bank.testnet.algorand.network/))

### Test Flow
1. Connect Pera Wallet on TestNet
2. Login as sponsor
3. Select a student project
4. Create grant (sign 2 transactions)
5. Student submits milestone
6. Approve milestone (sign 1 transaction)
7. Verify funds in student wallet on [AlgoExplorer](https://testnet.algoexplorer.io/)

## Deployed Contract Example

View a sample escrow on TestNet:
```
App ID: Check your grant's appId in the database
Explorer: https://testnet.algoexplorer.io/application/{appId}
```

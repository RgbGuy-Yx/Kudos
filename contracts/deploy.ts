/**
 * Deploy KudosEscrowContract to Algorand Testnet
 *
 * Usage:
 *   npx tsx contracts/deploy.ts <student_address> [total_algo] [milestone_count]
 *
 * Environment:
 *   DEPLOYER_MNEMONIC  - 25-word Algorand mnemonic (required)
 *   ALGOD_SERVER       - Algod node URL (default: https://testnet-api.algonode.cloud)
 *   ALGOD_TOKEN        - Algod API token (default: empty)
 *   ALGOD_PORT         - Algod port (default: 443)
 *
 * Generate a new testnet account:
 *   npx tsx contracts/deploy.ts --generate
 */

import algosdk from 'algosdk';
import * as fs from 'fs';
import * as path from 'path';

// ── Generate account mode ───────────────────────────────────────────────────
if (process.argv.includes('--generate')) {
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  console.log('');
  console.log('  New Algorand Testnet Account');
  console.log('  ────────────────────────────');
  console.log('  Address :', account.addr.toString());
  console.log('  Mnemonic:', mnemonic);
  console.log('');
  console.log('  1. Fund it at https://bank.testnet.algorand.network/');
  console.log('  2. Then deploy:');
  console.log(`     $env:DEPLOYER_MNEMONIC="${mnemonic}"`);
  console.log('     npx tsx contracts/deploy.ts <student_address> [total_algo] [milestones]');
  console.log('');
  process.exit(0);
}

// ── Main deploy ─────────────────────────────────────────────────────────────
async function deploy() {
  const mnemonic = process.env.DEPLOYER_MNEMONIC;
  if (!mnemonic) {
    console.log('');
    console.log('  DEPLOYER_MNEMONIC environment variable not set.');
    console.log('');
    console.log('  Steps:');
    console.log('  1. Generate a testnet account:  npx tsx contracts/deploy.ts --generate');
    console.log('  2. Fund it: https://bank.testnet.algorand.network/');
    console.log('  3. Set env var:');
    console.log('     $env:DEPLOYER_MNEMONIC="word1 word2 ... word25"');
    console.log('');
    process.exit(1);
  }

  const studentAddr = process.argv[2];
  const totalAlgo = parseFloat(process.argv[3] || '1');
  const milestones = parseInt(process.argv[4] || '3', 10);

  if (!studentAddr) {
    console.log('');
    console.log('  Usage:');
    console.log('    npx tsx contracts/deploy.ts <student_address> [total_algo] [milestone_count]');
    console.log('');
    console.log('  Example:');
    console.log('    npx tsx contracts/deploy.ts RKLQKW...3OU 5 3');
    console.log('');
    process.exit(1);
  }

  // ── Algod client ────────────────────────────────────────────────────────
  const algodServer = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
  const algodToken = process.env.ALGOD_TOKEN || '';
  const algodPort = process.env.ALGOD_PORT || '443';
  const algod = new algosdk.Algodv2(algodToken, algodServer, algodPort);

  // ── Deployer account ──────────────────────────────────────────────────
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const deployerAddr = account.addr.toString();
  const totalMicro = Math.floor(totalAlgo * 1_000_000);

  console.log('');
  console.log('  Deploying KudosEscrowContract to Algorand Testnet');
  console.log('  ─────────────────────────────────────────────────');
  console.log('  Deployer   :', deployerAddr);
  console.log('  Student    :', studentAddr);
  console.log('  Amount     :', totalAlgo, 'ALGO (', totalMicro, 'µALGO )');
  console.log('  Milestones :', milestones);
  console.log('  Algod      :', algodServer);

  // ── Check balance ──────────────────────────────────────────────────────
  try {
    const info = await algod.accountInformation(deployerAddr).do();
    const balance = Number(info.amount) / 1_000_000;
    console.log('  Balance    :', balance.toFixed(6), 'ALGO');
    if (balance < 0.5) {
      console.error('');
      console.error('  ⚠ Low balance! Need at least ~0.5 ALGO for deployment MBR + fees.');
      console.error('  Fund at: https://bank.testnet.algorand.network/');
      process.exit(1);
    }
  } catch (e: any) {
    console.warn('  ⚠ Could not check balance:', e.message);
  }

  console.log('');

  // ── Read TEAL artifacts ────────────────────────────────────────────────
  const artifactsDir = path.resolve(__dirname, 'artifacts');
  const approvalTeal = fs.readFileSync(
    path.join(artifactsDir, 'KudosEscrowContract.approval.teal'),
    'utf-8'
  );
  const clearTeal = fs.readFileSync(
    path.join(artifactsDir, 'KudosEscrowContract.clear.teal'),
    'utf-8'
  );

  // ── Compile TEAL → AVM bytecode ───────────────────────────────────────
  console.log('  [1/3] Compiling TEAL via algod...');
  let approvalBytes: Uint8Array;
  let clearBytes: Uint8Array;

  try {
    const approvalRes = await algod.compile(approvalTeal).do();
    const clearRes = await algod.compile(clearTeal).do();
    approvalBytes = new Uint8Array(Buffer.from(approvalRes.result, 'base64'));
    clearBytes = new Uint8Array(Buffer.from(clearRes.result, 'base64'));
  } catch (e: any) {
    console.error('');
    console.error('  ✗ TEAL compilation failed:', e.message);
    console.error('');
    console.error('  The algod node may not expose /v2/teal/compile.');
    console.error('  Try using AlgoKit LocalNet instead:');
    console.error('    algokit localnet start');
    console.error('    $env:ALGOD_SERVER="http://localhost:4001"');
    console.error('    $env:ALGOD_TOKEN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"');
    console.error('    $env:ALGOD_PORT="4001"');
    console.error('    npx tsx contracts/deploy.ts ...');
    process.exit(1);
  }

  console.log('        Approval :', approvalBytes.length, 'bytes');
  console.log('        Clear    :', clearBytes.length, 'bytes');

  const extraPages = Math.max(0, Math.ceil(approvalBytes.length / 2048) - 1);
  if (extraPages > 0) {
    console.log('        Extra pages:', extraPages);
  }

  // ── Build ABI method call ──────────────────────────────────────────────
  console.log('  [2/3] Building create_application transaction...');

  const method = new algosdk.ABIMethod({
    name: 'create_application',
    args: [
      { type: 'address', name: 'student' },
      { type: 'uint64', name: 'total_amount' },
      { type: 'uint64', name: 'milestone_count' },
    ],
    returns: { type: 'void' },
  });

  const sp = await algod.getTransactionParams().do();
  const signer = algosdk.makeBasicAccountTransactionSigner(account);

  const atc = new algosdk.AtomicTransactionComposer();
  atc.addMethodCall({
    appID: 0, // 0 = create new application
    method,
    methodArgs: [studentAddr, BigInt(totalMicro), BigInt(milestones)],
    sender: deployerAddr,
    signer,
    suggestedParams: sp,
    approvalProgram: approvalBytes,
    clearProgram: clearBytes,
    numGlobalByteSlices: 2,  // sponsor, student
    numGlobalInts: 5,        // total_amount, milestone_count, milestone_index, status, funded_amount
    numLocalByteSlices: 0,
    numLocalInts: 0,
    extraPages,
  });

  // ── Submit & confirm ───────────────────────────────────────────────────
  console.log('  [3/3] Submitting to testnet...');

  const result = await atc.execute(algod, 4);
  const txId = result.txIDs[0];

  // Extract app ID from pending tx info
  const txInfo = result.methodResults[0].txInfo;
  const appId = Number(txInfo?.applicationIndex ?? 0);

  if (!appId) {
    // Fallback: query pending transaction directly
    const pending = await algod.pendingTransactionInformation(txId).do();
    const fallbackAppId = Number((pending as any).applicationIndex ?? (pending as any)['application-index'] ?? 0);
    if (fallbackAppId) {
      printSuccess(fallbackAppId, txId, totalAlgo);
      return;
    }
    console.error('  ⚠ Transaction confirmed but could not determine App ID.');
    console.error('  Tx ID:', txId);
    console.error('  Check: https://lora.algokit.io/testnet/transaction/' + txId);
    process.exit(1);
  }

  printSuccess(appId, txId, totalAlgo);
}

function printSuccess(appId: number, txId: string, totalAlgo: number) {
  const appAddr = algosdk.getApplicationAddress(appId).toString();

  console.log('');
  console.log('  ═══════════════════════════════════════════════════════════');
  console.log('  ✅ KudosEscrowContract deployed successfully!');
  console.log('  ═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('  App ID      :', appId);
  console.log('  App Address :', appAddr);
  console.log('  Tx ID       :', txId);
  console.log('  Explorer    :', `https://lora.algokit.io/testnet/application/${appId}`);
  console.log('');
  console.log('  Next steps:');
  console.log('  ───────────');
  console.log('  1. Add to your .env.local:');
  console.log('     NEXT_PUBLIC_KUDOS_APP_ID=' + appId);
  console.log('');
  console.log('  2. Fund the escrow by calling fund_contract()');
  console.log('     (send ' + totalAlgo + ' ALGO to ' + appAddr + ')');
  console.log('  ═══════════════════════════════════════════════════════════');
  console.log('');
}

deploy().catch((err) => {
  console.error('');
  console.error('  ❌ Deployment failed:', err.message || err);
  if (err.response?.body) {
    try {
      console.error('  Response:', JSON.stringify(err.response.body));
    } catch {
      console.error('  Response:', err.response.body);
    }
  }
  process.exit(1);
});

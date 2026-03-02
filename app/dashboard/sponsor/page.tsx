'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getContractGlobalState,
  createAppCallTxn,
  createPaymentTxn,
  waitForConfirmation,
  microalgosToAlgo,
  algoToMicroalgos,
  encodeString,
  encodeUint64,
  getAlgodClient,
  ContractState,
} from '@/lib/algorand';
import algosdk from 'algosdk';

export default function SponsorDashboard() {
  const { user, loading, logout, walletMismatch, isWalletConnected } = useAuth();
  const { accountAddress, signTransaction, peraWallet } = useWallet();
  const router = useRouter();

  // Contract state
  const [appId, setAppId] = useState<number>(0);
  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form states
  const [showCreateGrant, setShowCreateGrant] = useState(false);
  const [grantForm, setGrantForm] = useState({
    studentAddress: '',
    totalAmount: '',
    totalMilestones: '',
  });
  const [fundAmount, setFundAmount] = useState('');
  const [milestoneToApprove, setMilestoneToApprove] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch contract state
  const fetchContractState = async () => {
    if (!appId || appId === 0) {
      setError('Please enter a valid Application ID');
      return;
    }
    
    setLoadingState(true);
    setError('');
    
    try {
      const state = await getContractGlobalState(appId);
      setContractState(state);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contract state');
      setContractState(null);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    if (appId > 0) {
      fetchContractState();
    }
  }, [appId]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Transaction handlers
  const handleCreateGrant = async () => {
    if (!user || !accountAddress || !peraWallet) {
      setError('Wallet not connected');
      return;
    }

    if (!grantForm.studentAddress || !grantForm.totalAmount || !grantForm.totalMilestones) {
      setError('Please fill all fields');
      return;
    }

    setTxLoading('Creating grant...');
    setError('');
    
    try {
      const algodClient = getAlgodClient();
      
      // For demo: Upload approval and clear programs (replace with actual contract bytecode)
      const approvalProgram = new Uint8Array(Buffer.from('', 'base64')); // Replace with actual
      const clearProgram = new Uint8Array(Buffer.from('', 'base64')); // Replace with actual
      
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Create application
      const txn = algosdk.makeApplicationCreateTxnFromObject({
        sender: accountAddress,
        suggestedParams,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram,
        clearProgram,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        numGlobalInts: 5,
        numGlobalByteSlices: 2,
        appArgs: [
          encodeString('create'),
          new Uint8Array(algosdk.decodeAddress(grantForm.studentAddress).publicKey),
          encodeUint64(algoToMicroalgos(parseFloat(grantForm.totalAmount))),
          encodeUint64(parseInt(grantForm.totalMilestones)),
        ],
      });

      const signedTxn = await signTransaction([txn]);
      const result = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = result.txid;
      
      await waitForConfirmation(txId);
      
      // Get app ID from transaction
      const ptx = await algodClient.pendingTransactionInformation(txId).do();
      const createdAppId = ptx.applicationIndex;
      
      if (!createdAppId) {
        throw new Error('Failed to get application ID');
      }
      
      setAppId(Number(createdAppId));
      setSuccess(`Grant created! App ID: ${createdAppId}`);
      setShowCreateGrant(false);
      setGrantForm({ studentAddress: '', totalAmount: '', totalMilestones: '' });
      
      await fetchContractState();
    } catch (err: any) {
      setError('Failed to create grant: ' + err.message);
    } finally {
      setTxLoading(null);
    }
  };

  const handleFundEscrow = async () => {
    if (!user || !accountAddress || !appId || !peraWallet) {
      setError('Requirements not met');
      return;
    }

    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setError('Enter valid amount');
      return;
    }

    setTxLoading('Funding escrow...');
    setError('');
    
    try {
      const algodClient = getAlgodClient();
      
      // Get app address
      const appAddress = algosdk.getApplicationAddress(appId).toString();
      
      // Create payment transaction to app address
      const payTxn = await createPaymentTxn(
        accountAddress,
        appAddress,
        algoToMicroalgos(parseFloat(fundAmount)),
        'Fund escrow'
      );
      
      // Create app call to record funding
      const appCallTxn = await createAppCallTxn(
        accountAddress,
        appId,
        [encodeString('fund'), encodeUint64(algoToMicroalgos(parseFloat(fundAmount)))]
      );
      
      // Group transactions
      const txns = [payTxn, appCallTxn];
      algosdk.assignGroupID(txns);
      
      const signedTxns = await signTransaction(txns);
      const result = await algodClient.sendRawTransaction(signedTxns).do();
      const txId = result.txid;
      
      await waitForConfirmation(txId);
      
      setSuccess(`Funded ${fundAmount} ALGO to escrow!`);
      setFundAmount('');
      
      await fetchContractState();
    } catch (err: any) {
      setError('Failed to fund escrow: ' + err.message);
    } finally {
      setTxLoading(null);
    }
  };

  const handleApproveMilestone = async () => {
    if (!user || !accountAddress || !appId || !peraWallet) {
      setError('Requirements not met');
      return;
    }

    const milestoneIndex = milestoneToApprove ? parseInt(milestoneToApprove) : (contractState?.currentMilestone || 0);

    setTxLoading('Approving milestone...');
    setError('');
    
    try {
      const txn = await createAppCallTxn(
        accountAddress,
        appId,
        [encodeString('approve'), encodeUint64(milestoneIndex)]
      );
      
      const signedTxn = await signTransaction([txn]);
      const algodClient = getAlgodClient();
      const result = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = result.txid;
      
      await waitForConfirmation(txId);
      
      setSuccess(`Milestone ${milestoneIndex} approved!`);
      setMilestoneToApprove('');
      
      await fetchContractState();
    } catch (err: any) {
      setError('Failed to approve milestone: ' + err.message);
    } finally {
      setTxLoading(null);
    }
  };

  const handleEmergencyClawback = async () => {
    if (!user || !accountAddress || !appId || !peraWallet) {
      setError('Requirements not met');
      return;
    }

    const confirmed = confirm('Are you sure you want to execute emergency clawback? This will return all funds to you.');
    if (!confirmed) return;

    setTxLoading('Executing clawback...');
    setError('');
    
    try {
      const txn = await createAppCallTxn(
        accountAddress,
        appId,
        [encodeString('clawback')]
      );
      
      const signedTxn = await signTransaction([txn]);
      const algodClient = getAlgodClient();
      const result = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = result.txid;
      
      await waitForConfirmation(txId);
      
      setSuccess('Emergency clawback executed successfully!');
      
      await fetchContractState();
    } catch (err: any) {
      setError('Failed to execute clawback: ' + err.message);
    } finally {
      setTxLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Show wallet mismatch warning
  if (walletMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Wallet Mismatch Detected</h2>
            <p className="text-red-600 mb-4">
              The connected wallet does not match your session. You will be logged out for security.
            </p>
            <div className="bg-white p-3 rounded text-sm text-left mb-4">
              <p className="text-gray-600">Session Wallet:</p>
              <p className="font-mono text-xs break-all">{user.walletAddress}</p>
              <p className="text-gray-600 mt-2">Connected Wallet:</p>
              <p className="font-mono text-xs break-all">{accountAddress || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet disconnected warning
  if (!isWalletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">🔌</div>
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Wallet Disconnected</h2>
            <p className="text-yellow-600 mb-4">
              Please reconnect your Pera Wallet to continue. You will be logged out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Sponsor Dashboard</h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Wallet:</span>
                <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                </span>
                {accountAddress && accountAddress.toLowerCase() === user.walletAddress.toLowerCase() && (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Loading Overlay */}
        {txLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-center font-semibold">{txLoading}</p>
            </div>
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome, Sponsor!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wallet Address</p>
              <p className="font-mono text-sm break-all">{user.walletAddress}</p>
            </div>
            {user.name && (
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            )}
            {user.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            )}
            {user.organization && (
              <div>
                <p className="text-sm text-gray-600">Organization</p>
                <p className="font-medium">{user.organization}</p>
              </div>
            )}
          </div>
        </div>

        {/* App ID Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Grant Contract</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application ID
              </label>
              <input
                type="number"
                value={appId}
                onChange={(e) => setAppId(parseInt(e.target.value) || 0)}
                placeholder="Enter app ID to manage existing grant"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchContractState}
              disabled={!appId || loadingState}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loadingState ? 'Loading...' : 'Load State'}
            </button>
            <button
              onClick={() => setShowCreateGrant(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create New Grant
            </button>
          </div>
        </div>

        {/* Create Grant Modal */}
        {showCreateGrant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Create New Grant</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Wallet Address
                  </label>
                  <input
                    type="text"
                    value={grantForm.studentAddress}
                    onChange={(e) => setGrantForm({ ...grantForm, studentAddress: e.target.value })}
                    placeholder="ALGORAND..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (ALGO)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={grantForm.totalAmount}
                    onChange={(e) => setGrantForm({ ...grantForm, totalAmount: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Milestones
                  </label>
                  <input
                    type="number"
                    value={grantForm.totalMilestones}
                    onChange={(e) => setGrantForm({ ...grantForm, totalMilestones: e.target.value })}
                    placeholder="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateGrant(false);
                    setGrantForm({ studentAddress: '', totalAmount: '', totalMilestones: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGrant}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contract State Display */}
        {contractState && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Escrow Balance</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {microalgosToAlgo(contractState.escrowBalance)} ALGO
                </p>
                <p className="text-sm text-gray-600 mt-2">Available funds</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Milestone</h3>
                <p className="text-3xl font-bold text-green-600">
                  {contractState.currentMilestone} / {contractState.totalMilestones}
                </p>
                <p className="text-sm text-gray-600 mt-2">Progress</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Amount</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {microalgosToAlgo(contractState.totalAmount)} ALGO
                </p>
                <p className="text-sm text-gray-600 mt-2">Grant size</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Status</h3>
                <p className="text-2xl font-bold">
                  {contractState.isActive ? (
                    <span className="text-green-600">✓ Active</span>
                  ) : (
                    <span className="text-red-600">✗ Inactive</span>
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-2">Contract state</p>
              </div>
            </div>

            {/* Contract Details */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Contract Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Sponsor Address</p>
                  <p className="font-mono text-sm break-all">{contractState.sponsorAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Student Address</p>
                  <p className="font-mono text-sm break-all">{contractState.studentAddress}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fund Escrow */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">💰 Fund Escrow</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add funds to the escrow account for milestone payments
                </p>
                <div className="space-y-3">
                  <input
                    type="number"
                    step="0.1"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Amount in ALGO"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={handleFundEscrow}
                    disabled={!contractState.isActive || !fundAmount || parseFloat(fundAmount) <= 0}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    Fund Escrow
                  </button>
                </div>
              </div>

              {/* Approve Milestone */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">✅ Approve Milestone</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Approve and release funds for a completed milestone
                </p>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={milestoneToApprove}
                    onChange={(e) => setMilestoneToApprove(e.target.value)}
                    placeholder={`Current: ${contractState.currentMilestone}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                  />
                  <button
                    onClick={handleApproveMilestone}
                    disabled={
                      !contractState.isActive ||
                      contractState.currentMilestone >= contractState.totalMilestones ||
                      contractState.escrowBalance <= 0
                    }
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    Approve Milestone
                  </button>
                  {contractState.currentMilestone >= contractState.totalMilestones && (
                    <p className="text-xs text-gray-500">All milestones completed</p>
                  )}
                  {contractState.escrowBalance <= 0 && (
                    <p className="text-xs text-red-500">No funds in escrow</p>
                  )}
                </div>
              </div>

              {/* Emergency Clawback */}
              <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
                <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ Emergency Clawback</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Reclaim all funds from escrow in case of emergency. Use with caution!
                </p>
                <button
                  onClick={handleEmergencyClawback}
                  disabled={!contractState.isActive || contractState.escrowBalance <= 0}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  Execute Clawback
                </button>
                {contractState.escrowBalance <= 0 && (
                  <p className="text-xs text-gray-500 mt-2">No funds to clawback</p>
                )}
              </div>

              {/* Refresh State */}
              <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🔄 Refresh State</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Reload the contract state to see the latest updates
                </p>
                <button
                  onClick={fetchContractState}
                  disabled={loadingState}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {loadingState ? 'Refreshing...' : 'Refresh State'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(contractState.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </>
        )}

        {/* No Contract State */}
        {!contractState && appId > 0 && !loadingState && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              No contract state loaded. Click "Load State" to fetch contract information.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!contractState && appId === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Get Started</h3>
            <p className="text-gray-600 mb-4">
              Enter an existing Application ID to manage a grant, or create a new grant to get started.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

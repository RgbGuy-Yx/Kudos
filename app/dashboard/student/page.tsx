'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getContractGlobalState,
  microalgosToAlgo,
  ContractState,
} from '@/lib/algorand';
import { MilestoneSubmission } from '@/lib/models/Milestone';

export default function StudentDashboard() {
  const { user, loading, logout, walletMismatch, isWalletConnected } = useAuth();
  const { accountAddress } = useWallet();
  const router = useRouter();

  // Contract state
  const [appId, setAppId] = useState<number>(0);
  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Milestone state
  const [milestones, setMilestones] = useState<MilestoneSubmission[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    milestoneIndex: '',
    proofLink: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
      
      // Also fetch milestones
      if (state) {
        await fetchMilestones();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contract state');
      setContractState(null);
    } finally {
      setLoadingState(false);
    }
  };

  // Fetch milestones from database
  const fetchMilestones = async () => {
    if (!appId || appId === 0) return;
    
    try {
      const response = await fetch(`/api/milestones?appId=${appId}`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      } else {
        console.error('Failed to fetch milestones');
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
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

  // Submit milestone
  const handleSubmitMilestone = async () => {
    if (!submissionForm.milestoneIndex || !submissionForm.proofLink || !submissionForm.description) {
      setError('Please fill all fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/milestones/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          milestoneIndex: parseInt(submissionForm.milestoneIndex),
          proofLink: submissionForm.proofLink,
          description: submissionForm.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Milestone submitted successfully!');
        setShowSubmitModal(false);
        setSubmissionForm({ milestoneIndex: '', proofLink: '', description: '' });
        await fetchMilestones();
      } else {
        setError(data.error || 'Failed to submit milestone');
      }
    } catch (err: any) {
      setError('Failed to submit milestone: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Get milestone status
  const getMilestoneStatus = (index: number): 'pending' | 'approved' | 'completed' | 'not-submitted' => {
    if (!contractState) return 'not-submitted';
    
    const submission = milestones.find(m => m.milestoneIndex === index);
    
    if (index < contractState.currentMilestone) {
      return 'approved';
    } else if (submission && submission.status === 'pending') {
      return 'pending';
    } else if (index >= contractState.totalMilestones) {
      return 'completed';
    }
    
    return 'not-submitted';
  };

  // Get overall status
  const getOverallStatus = (): string => {
    if (!contractState) return 'No Grant';
    
    if (contractState.currentMilestone >= contractState.totalMilestones) {
      return 'Completed';
    }
    
    const currentMilestoneSubmission = milestones.find(
      m => m.milestoneIndex === contractState.currentMilestone
    );
    
    if (currentMilestoneSubmission?.status === 'pending') {
      return 'Pending Approval';
    }
    
    return 'In Progress';
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
              <h1 className="text-xl font-bold text-gray-800">Student Dashboard</h1>
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

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome, Student!</h2>
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
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Grant Contract</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application ID
              </label>
              <input
                type="number"
                value={appId}
                onChange={(e) => setAppId(parseInt(e.target.value) || 0)}
                placeholder="Enter your grant app ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchContractState}
              disabled={!appId || loadingState}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loadingState ? 'Loading...' : 'Load Grant'}
            </button>
          </div>
        </div>

        {/* Submit Milestone Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Submit Milestone</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Milestone Number
                  </label>
                  <input
                    type="number"
                    value={submissionForm.milestoneIndex}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, milestoneIndex: e.target.value })}
                    placeholder={contractState ? `Next: ${contractState.currentMilestone}` : '0'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proof Link (GitHub, Drive, etc.)
                  </label>
                  <input
                    type="url"
                    value={submissionForm.proofLink}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, proofLink: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={submissionForm.description}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                    placeholder="Describe what you've accomplished for this milestone..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSubmissionForm({ milestoneIndex: '', proofLink: '', description: '' });
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMilestone}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Grant</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {microalgosToAlgo(contractState.totalAmount)} ALGO
                </p>
                <p className="text-sm text-gray-600 mt-2">Full amount</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Milestone</h3>
                <p className="text-3xl font-bold text-green-600">
                  {contractState.currentMilestone} / {contractState.totalMilestones}
                </p>
                <p className="text-sm text-gray-600 mt-2">Progress</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Escrow Balance</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {microalgosToAlgo(contractState.escrowBalance)} ALGO
                </p>
                <p className="text-sm text-gray-600 mt-2">Available funds</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Status</h3>
                <p className="text-xl font-bold">
                  {getOverallStatus() === 'Completed' && <span className="text-green-600">✓ Completed</span>}
                  {getOverallStatus() === 'Pending Approval' && <span className="text-yellow-600">⏳ Pending</span>}
                  {getOverallStatus() === 'In Progress' && <span className="text-blue-600">🔄 Active</span>}
                  {getOverallStatus() === 'No Grant' && <span className="text-gray-600">—</span>}
                </p>
                <p className="text-sm text-gray-600 mt-2">{getOverallStatus()}</p>
              </div>
            </div>

            {/* Contract Details */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Grant Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Sponsor Address</p>
                  <p className="font-mono text-sm break-all">{contractState.sponsorAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Address</p>
                  <p className="font-mono text-sm break-all">{contractState.studentAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Grant Active</p>
                  <p className="font-medium">
                    {contractState.isActive ? (
                      <span className="text-green-600">Yes ✓</span>
                    ) : (
                      <span className="text-red-600">No ✗</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">{new Date(contractState.lastUpdated).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Milestones Progress */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Milestones</h3>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={contractState.currentMilestone >= contractState.totalMilestones}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Milestone
                </button>
              </div>

              <div className="space-y-4">
                {Array.from({ length: contractState.totalMilestones }, (_, i) => {
                  const status = getMilestoneStatus(i);
                  const submission = milestones.find(m => m.milestoneIndex === i);
                  
                  return (
                    <div
                      key={i}
                      className={`border rounded-lg p-4 ${
                        status === 'approved' ? 'border-green-300 bg-green-50' :
                        status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                        'border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-800">Milestone {i}</span>
                          {status === 'approved' && <span className="text-green-600 font-semibold">✓ Approved</span>}
                          {status === 'pending' && <span className="text-yellow-600 font-semibold">⏳ Pending Review</span>}
                          {status === 'not-submitted' && <span className="text-gray-500">Not Submitted</span>}
                        </div>
                        <span className="text-sm text-gray-600">
                          {contractState.totalAmount / contractState.totalMilestones / 1_000_000} ALGO
                        </span>
                      </div>

                      {submission && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Description:</span> {submission.description}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Proof:</span>{' '}
                            <a
                              href={submission.proofLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {submission.proofLink}
                            </a>
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={fetchContractState}
                disabled={loadingState}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loadingState ? 'Refreshing...' : '🔄 Refresh Grant State'}
              </button>
            </div>
          </>
        )}

        {/* No Contract State */}
        {!contractState && appId > 0 && !loadingState && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              No grant found. Make sure you entered the correct Application ID.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!contractState && appId === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Get Started</h3>
            <p className="text-gray-600 mb-4">
              Enter your Grant Application ID above to view your grant details and submit milestone proofs.
            </p>
            <p className="text-sm text-gray-500">
              Don't have a grant yet? Contact a sponsor to create one for you.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

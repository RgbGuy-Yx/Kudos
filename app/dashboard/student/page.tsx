'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getContractGlobalState,
  microalgosToAlgo,
  algoToMicroalgos,
  ContractState,
} from '@/lib/algorand';
import { MilestoneSubmission } from '@/lib/models/Milestone';

interface StudentActiveGrantInfo {
  id: string;
  appId: number;
  sponsorWallet: string;
  projectTitle: string;
  proposedBudget: number;
  milestoneIndex: number;
  totalMilestones: number;
}

export default function StudentDashboard() {
  const { user, loading, logout, walletMismatch, isWalletConnected } = useAuth();
  const { accountAddress } = useWallet();
  const router = useRouter();

  const [hasActiveGrant, setHasActiveGrant] = useState<boolean>(false);
  const [checkingGrant, setCheckingGrant] = useState<boolean>(true);
  const [studentGrant, setStudentGrant] = useState<StudentActiveGrantInfo | null>(null);

  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
    expectedDeliverables: '',
    expectedTimeline: '',
    expectedCost: '',
    githubLink: '',
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [submittedProposals, setSubmittedProposals] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      expectedDeliverables?: string;
      expectedTimeline?: string;
      expectedCost?: number;
      githubLink: string;
      status: string;
      trustScore?: number;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      createdAt: string;
    }>
  >([]);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [savingProposalEdit, setSavingProposalEdit] = useState(false);
  const [editProposalForm, setEditProposalForm] = useState({
    title: '',
    description: '',
    expectedDeliverables: '',
    expectedTimeline: '',
    expectedCost: '',
    githubLink: '',
  });

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

  const fetchStudentActiveGrant = async () => {
    try {
      setCheckingGrant(true);
      const response = await fetch('/api/grants/student-active');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check active grant');
      }

      setHasActiveGrant(!!data.hasActiveGrant);
      setStudentGrant(data.activeGrant || null);

      if (data.showCreationNotification) {
        setSuccess('A sponsor has created a new grant for your project. Review it below.');
      }

      if (data.activeGrant?.appId) {
        setAppId(data.activeGrant.appId);
      } else {
        setAppId(0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check active grant');
      setHasActiveGrant(false);
      setStudentGrant(null);
      setAppId(0);
    } finally {
      setCheckingGrant(false);
    }
  };

  const fetchSubmittedProposals = async () => {
    try {
      setLoadingProposals(true);
      const response = await fetch('/api/projects/my-proposals');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submitted proposals');
      }

      setSubmittedProposals(data.proposals || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submitted proposals');
    } finally {
      setLoadingProposals(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/me');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      setNotifications(data.notifications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
    }
  };

  useEffect(() => {
    if (!loading && user?.role === 'student') {
      fetchStudentActiveGrant();
      fetchSubmittedProposals();
      fetchNotifications();
    }
  }, [loading, user]);

  // Fetch contract state
  const fetchContractState = async () => {
    if (!appId || appId === 0) {
      setError('No active grant found for this student');
      return;
    }
    
    setLoadingState(true);
    setError('');
    
    try {
      if (studentGrant && appId >= 900000000) {
        setContractState({
          escrowBalance: algoToMicroalgos(studentGrant.proposedBudget),
          currentMilestone: studentGrant.milestoneIndex,
          totalAmount: algoToMicroalgos(studentGrant.proposedBudget),
          totalMilestones: studentGrant.totalMilestones,
          sponsorAddress: studentGrant.sponsorWallet,
          studentAddress: user?.walletAddress || '',
          isActive: true,
          lastUpdated: Date.now(),
        });
        await fetchMilestones();
        return;
      }

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
    if (!submissionForm.milestoneIndex || !submissionForm.description) {
      setError('Please fill all required fields');
      return;
    }

    if (!submissionForm.proofLink) {
      setError('Please provide a proof link');
      return;
    }

    const milestoneNumber = parseInt(submissionForm.milestoneIndex, 10);
    if (!Number.isInteger(milestoneNumber) || milestoneNumber <= 0) {
      setError('Milestone number must start from 1');
      return;
    }

    const milestoneIndex = milestoneNumber - 1;
    if (contractState && milestoneIndex >= contractState.totalMilestones) {
      setError(`Milestone number cannot exceed ${contractState.totalMilestones}`);
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
          milestoneIndex,
          proofLink: submissionForm.proofLink,
          description: submissionForm.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Milestone submitted successfully!');
        setShowSubmitModal(false);
        setSubmissionForm({
          milestoneIndex: '',
          proofLink: '',
          description: '',
        });
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

  const handleSubmitProposal = async () => {
    const {
      title,
      description,
      expectedDeliverables,
      expectedTimeline,
      expectedCost,
      githubLink,
    } = proposalForm;

    if (!title || !description || !expectedDeliverables || !expectedTimeline || !expectedCost || !githubLink) {
      setError('Please fill all proposal fields');
      return;
    }

    setSubmittingProposal(true);
    setError('');

    try {
      const response = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          expectedDeliverables,
          expectedTimeline,
          expectedCost: Number(expectedCost),
          githubLink,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit proposal');
      }

      setSuccess('Proposal submitted successfully! Sponsors can now view your project card.');
      setProposalForm({
        title: '',
        description: '',
        expectedDeliverables: '',
        expectedTimeline: '',
        expectedCost: '',
        githubLink: '',
      });
      await fetchSubmittedProposals();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleStartEditProposal = (proposal: {
    id: string;
    title: string;
    description: string;
    expectedDeliverables?: string;
    expectedTimeline?: string;
    expectedCost?: number;
    githubLink: string;
  }) => {
    setEditingProposalId(proposal.id);
    setEditProposalForm({
      title: proposal.title || '',
      description: proposal.description || '',
      expectedDeliverables: proposal.expectedDeliverables || '',
      expectedTimeline: proposal.expectedTimeline || '',
      expectedCost: proposal.expectedCost ? String(proposal.expectedCost) : '',
      githubLink: proposal.githubLink || '',
    });
  };

  const handleUpdateProposal = async () => {
    if (!editingProposalId) return;

    const {
      title,
      description,
      expectedDeliverables,
      expectedTimeline,
      expectedCost,
      githubLink,
    } = editProposalForm;

    if (!title || !description || !expectedDeliverables || !expectedTimeline || !expectedCost || !githubLink) {
      setError('Please fill all proposal fields before saving');
      return;
    }

    setSavingProposalEdit(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/my-proposals/${editingProposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          expectedDeliverables,
          expectedTimeline,
          expectedCost: Number(expectedCost),
          githubLink,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update proposal');
      }

      setSuccess('Proposal updated successfully');
      setEditingProposalId(null);
      setEditProposalForm({
        title: '',
        description: '',
        expectedDeliverables: '',
        expectedTimeline: '',
        expectedCost: '',
        githubLink: '',
      });
      await fetchSubmittedProposals();
    } catch (err: any) {
      setError(err.message || 'Failed to update proposal');
    } finally {
      setSavingProposalEdit(false);
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

        {notifications.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Notifications</h3>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 ${
                    item.type === 'MILESTONE_REJECTED'
                      ? 'border-red-200 bg-red-50'
                      : item.type === 'MILESTONE_APPROVED'
                        ? 'border-green-200 bg-green-50'
                        : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
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

        {/* Proposal Form when no active grant */}
        {!checkingGrant && !hasActiveGrant && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Submit Project Proposal</h3>
            <p className="text-sm text-gray-600 mb-5">
              You currently do not have any active grants. Submit a proposal to appear on the sponsor project marketplace.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  value={proposalForm.title}
                  onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter project title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={proposalForm.description}
                  onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  placeholder="Describe your project"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Deliveribles</label>
                <textarea
                  value={proposalForm.expectedDeliverables}
                  onChange={(e) => setProposalForm({ ...proposalForm, expectedDeliverables: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  placeholder="List expected deliverables"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Timeline</label>
                <input
                  type="text"
                  value={proposalForm.expectedTimeline}
                  onChange={(e) => setProposalForm({ ...proposalForm, expectedTimeline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g. 8 weeks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Cost (ALGO)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={proposalForm.expectedCost}
                  onChange={(e) => setProposalForm({ ...proposalForm, expectedCost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter expected cost"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Link</label>
                <input
                  type="url"
                  value={proposalForm.githubLink}
                  onChange={(e) => setProposalForm({ ...proposalForm, githubLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitProposal}
              disabled={submittingProposal}
              className="mt-5 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {submittingProposal ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Submitted Proposals</h3>
          <p className="text-sm text-gray-600 mb-5">
            View all your submitted proposals and edit them anytime.
          </p>

          {loadingProposals ? (
            <p className="text-gray-500">Loading submitted proposals...</p>
          ) : submittedProposals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
              You have not submitted any proposals yet.
            </div>
          ) : (
            <div className="space-y-4">
              {submittedProposals.map((proposal) => (
                <div key={proposal.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{proposal.title}</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {proposal.status}
                    </span>
                  </div>

                  {editingProposalId === proposal.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editProposalForm.title}
                        onChange={(e) => setEditProposalForm({ ...editProposalForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                        placeholder="Project title"
                      />
                      <textarea
                        value={editProposalForm.description}
                        onChange={(e) => setEditProposalForm({ ...editProposalForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                        placeholder="Project description"
                      />
                      <textarea
                        value={editProposalForm.expectedDeliverables}
                        onChange={(e) => setEditProposalForm({ ...editProposalForm, expectedDeliverables: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                        placeholder="Expected deliverables"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editProposalForm.expectedTimeline}
                          onChange={(e) => setEditProposalForm({ ...editProposalForm, expectedTimeline: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                          placeholder="Expected timeline"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={editProposalForm.expectedCost}
                          onChange={(e) => setEditProposalForm({ ...editProposalForm, expectedCost: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                          placeholder="Expected cost (ALGO)"
                        />
                      </div>
                      <input
                        type="url"
                        value={editProposalForm.githubLink}
                        onChange={(e) => setEditProposalForm({ ...editProposalForm, githubLink: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                        placeholder="GitHub link"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateProposal}
                          disabled={savingProposalEdit}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                          {savingProposalEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingProposalId(null)}
                          disabled={savingProposalEdit}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 mb-3">{proposal.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <p><span className="font-medium text-gray-800">Deliverables:</span> {proposal.expectedDeliverables || 'N/A'}</p>
                        <p><span className="font-medium text-gray-800">Timeline:</span> {proposal.expectedTimeline || 'N/A'}</p>
                        <p><span className="font-medium text-gray-800">Expected Cost:</span> {proposal.expectedCost ?? 0} ALGO</p>
                        <p><span className="font-medium text-gray-800">Trust Score:</span> {proposal.trustScore ?? 0}</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Updated: {new Date(proposal.updatedAt).toLocaleString()}
                      </p>
                      <a
                        href={proposal.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-sm text-blue-600 hover:underline mb-3"
                      >
                        View GitHub Repository
                      </a>
                      <div>
                        <button
                          onClick={() => handleStartEditProposal(proposal)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                        >
                          Edit Proposal
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auto Grant Overview */}
        {hasActiveGrant && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Grant Overview</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your grant is loaded automatically when a sponsor creates it. Track progress and submit milestone proofs here.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Application ID</p>
                <p className="font-semibold text-gray-900">{studentGrant?.appId || appId}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Project</p>
                <p className="font-semibold text-gray-900">{studentGrant?.projectTitle || 'Active Grant'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Sponsor Wallet</p>
                <p className="font-mono text-xs text-gray-800 break-all">{studentGrant?.sponsorWallet || '-'}</p>
              </div>
            </div>
          </div>
        )}

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
                    min="1"
                    placeholder={contractState ? `Next: ${Math.min(contractState.currentMilestone + 1, contractState.totalMilestones)}` : '1'}
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
                    setSubmissionForm({
                      milestoneIndex: '',
                      proofLink: '',
                      description: '',
                    });
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
                  {Math.min(contractState.currentMilestone + 1, contractState.totalMilestones)} / {contractState.totalMilestones}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Next required milestone: {Math.min(contractState.currentMilestone + 1, contractState.totalMilestones)}
                </p>
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
                          <span className="text-lg font-bold text-gray-800">Milestone {i + 1}</span>
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
                            {submission.proofLink ? (
                              <a
                                href={submission.proofLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Open submitted link
                              </a>
                            ) : submission.proofFileUrl ? (
                              <a
                                href={submission.proofFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Open uploaded file
                              </a>
                            ) : (
                              <span className="text-gray-500">No proof attached</span>
                            )}
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
              Grant state is currently unavailable. Please refresh in a moment.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!contractState && appId === 0 && hasActiveGrant && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Grant Syncing</h3>
            <p className="text-gray-600 mb-4">
              Your sponsor has created a grant. Your dashboard is syncing grant details automatically.
            </p>
            <p className="text-sm text-gray-500">
              If this takes too long, refresh the page.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

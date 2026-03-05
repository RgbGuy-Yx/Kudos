'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import {
  algoToMicroalgos,
  ContractState,
  getContractGlobalState,
  microalgosToAlgo,
} from '@/lib/algorand';
import { MilestoneSubmission } from '@/lib/models/Milestone';

import Sidebar, { StudentSection } from './components/Sidebar';
import TopBar from './components/TopBar';
import HeroBanner from './components/HeroBanner';
import StatCards from './components/StatCards';
import GrantJourneyTimeline from './components/GrantJourneyTimeline';
import OpenGrantsFeed from './components/OpenGrantsFeed';
import ProposalsTable from './components/ProposalsTable';
import SubmitProposalModal from './components/SubmitProposalModal';
import type { Step1Data } from './components/SubmitProposalModal/Step1AboutYou';

interface StudentActiveGrantInfo {
  id: string;
  appId: number;
  sponsorWallet: string;
  projectTitle: string;
  proposedBudget: number;
  milestoneIndex: number;
  totalMilestones: number;
}

interface Proposal {
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
}

const sectionTitle: Record<StudentSection, string> = {
  dashboard: 'Student Dashboard',
  proposals: 'My Proposals',
  'active-grant': 'Active Grant',
  milestones: 'Milestones',
  earnings: 'Earnings',
  transactions: 'Transactions',
  notifications: 'Notifications',
  settings: 'Settings',
};

export default function StudentDashboard() {
  const { user, loading, logout, walletMismatch, isWalletConnected } = useAuth();
  const { accountAddress } = useWallet();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<StudentSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);

  const [hasActiveGrant, setHasActiveGrant] = useState<boolean>(false);
  const [checkingGrant, setCheckingGrant] = useState<boolean>(true);
  const [studentGrant, setStudentGrant] = useState<StudentActiveGrantInfo | null>(null);

  const [submittedProposals, setSubmittedProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      read?: boolean;
      createdAt: string;
    }>
  >([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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

  const [appId, setAppId] = useState<number>(0);
  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [milestones, setMilestones] = useState<MilestoneSubmission[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    milestoneIndex: '',
    proofLink: '',
    description: '',
  });
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to check active grant';
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch submitted proposals';
      setError(message);
    } finally {
      setLoadingProposals(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/notifications/me');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      setNotifications(data.notifications || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(message);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationsAsRead = async () => {
    const unread = notifications.some((item) => item.read === false);
    if (!unread) return;

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    try {
      await fetch('/api/notifications/me', { method: 'PATCH' });
    } catch {
      // keep optimistic UI state even if update call fails
    }
  };

  useEffect(() => {
    if (!loading && user?.role === 'student') {
      fetchStudentActiveGrant();
      fetchSubmittedProposals();
      fetchNotifications();

      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [loading, user]);

  useEffect(() => {
    if (activeSection === 'notifications') {
      markNotificationsAsRead();
    }
  }, [activeSection]);

  const fetchMilestones = async () => {
    if (!appId || appId === 0) return;

    try {
      const response = await fetch(`/api/milestones?appId=${appId}`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch {
      setError('Failed to fetch milestones');
    }
  };

  const fetchContractState = async () => {
    if (!appId || appId === 0) {
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
      if (state) {
        await fetchMilestones();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contract state';
      setError(message);
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

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmitProposal = async (payload: {
    title: string;
    description: string;
    expectedDeliverables: string;
    expectedTimeline: string;
    amount: number;
    milestones: { title: string; amount: number; targetDate: string }[];
    fundsUsage: string;
    aboutYou: Step1Data;
    projectMeta: {
      category: string;
      stage: string;
      techStack: string[];
      githubRepoUrl: string;
      shortDescription: string;
    };
    projectRepo?: string;
    demoUrl?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          expectedDeliverables: payload.expectedDeliverables || 'Milestone-based deliverables',
          expectedTimeline: payload.expectedTimeline || 'TBD',
          expectedCost: payload.amount,
          githubLink: payload.projectRepo || payload.demoUrl || 'https://github.com/',
          proposalData: {
            aboutYou: payload.aboutYou,
            project: {
              category: payload.projectMeta.category,
              stage: payload.projectMeta.stage,
              techStack: payload.projectMeta.techStack,
              githubRepoUrl: payload.projectMeta.githubRepoUrl,
              shortDescription: payload.projectMeta.shortDescription,
            },
            funding: {
              expectedTimeline: payload.expectedTimeline,
              expectedCost: payload.amount,
              fundsUsage: payload.fundsUsage,
              milestones: payload.milestones,
            },
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit proposal' };
      }

      setSuccess('Proposal submitted successfully! Sponsors can now view your project card.');
      setProposalModalOpen(false);
      await fetchSubmittedProposals();
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit proposal';
      setError(message);
      return { success: false, error: message };
    }
  };

  const handleStartEditProposal = (proposal: Proposal) => {
    setActiveSection('proposals');
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update proposal';
      setError(message);
    } finally {
      setSavingProposalEdit(false);
    }
  };

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

    setSubmittingMilestone(true);
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
        await fetchContractState();
      } else {
        setError(data.error || 'Failed to submit milestone');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit milestone';
      setError(message);
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const getMilestoneStatus = (index: number): 'pending' | 'approved' | 'completed' | 'not-submitted' => {
    if (!contractState) return 'not-submitted';

    const submission = milestones.find((m) => m.milestoneIndex === index);

    if (index < contractState.currentMilestone) {
      return 'approved';
    }

    if (submission && submission.status === 'pending') {
      return 'pending';
    }

    if (index >= contractState.totalMilestones) {
      return 'completed';
    }

    return 'not-submitted';
  };

  const getOverallStatus = (): string => {
    if (!contractState) return 'No Grant';

    if (contractState.currentMilestone >= contractState.totalMilestones) {
      return 'Completed';
    }

    const currentMilestoneSubmission = milestones.find(
      (m) => m.milestoneIndex === contractState.currentMilestone,
    );

    if (currentMilestoneSubmission?.status === 'pending') {
      return 'Pending Approval';
    }

    return 'In Progress';
  };

  const proposalStats = useMemo(() => {
    const approved = submittedProposals.filter((p) => p.status.toLowerCase() === 'approved').length;
    const pending = submittedProposals.filter((p) => {
      const status = p.status.toLowerCase();
      return status !== 'approved' && status !== 'rejected';
    }).length;
    const rejected = submittedProposals.filter((p) => p.status.toLowerCase() === 'rejected').length;
    return { approved, pending, rejected };
  }, [submittedProposals]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => item.read === false).length,
    [notifications],
  );

  const milestonePercent = contractState
    ? Math.round((Math.min(contractState.currentMilestone, contractState.totalMilestones) / Math.max(contractState.totalMilestones, 1)) * 100)
    : 0;
  const milestoneLabel = contractState
    ? `Milestone ${Math.min(contractState.currentMilestone + 1, contractState.totalMilestones)} of ${contractState.totalMilestones}`
    : 'No active milestones';

  const algoEarned = contractState
    ? Math.max(Number(microalgosToAlgo(contractState.totalAmount - contractState.escrowBalance)), 0)
    : 0;
  const algoGoal = contractState ? Number(microalgosToAlgo(contractState.totalAmount)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1E] text-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED] mx-auto" />
          <p className="mt-4 text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (walletMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1E] px-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-rose-200 mb-2">Wallet Mismatch Detected</h2>
            <p className="text-rose-300 mb-4">
              The connected wallet does not match your session. You will be logged out for security.
            </p>
            <div className="bg-black/20 border border-white/10 p-3 rounded-xl text-sm text-left mb-4">
              <p className="text-slate-400">Session Wallet:</p>
              <p className="font-mono text-xs break-all text-white">{user.walletAddress}</p>
              <p className="text-slate-400 mt-2">Connected Wallet:</p>
              <p className="font-mono text-xs break-all text-white">{accountAddress || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1E] px-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">🔌</div>
            <h2 className="text-xl font-bold text-amber-200 mb-2">Wallet Disconnected</h2>
            <p className="text-amber-300">Please reconnect your Pera Wallet to continue.</p>
          </div>
        </div>
      </div>
    );
  }

  const renderOverviewCards = () => (
    <>
      <HeroBanner
        userName={user.name || 'Student'}
        walletAddress={user.walletAddress}
        isVerified={!!accountAddress && accountAddress.toLowerCase() === user.walletAddress.toLowerCase()}
        proposalCount={submittedProposals.length}
        activeGrantCount={hasActiveGrant ? 1 : 0}
        algoEarned={algoEarned}
        algoGoal={algoGoal}
        hasActiveGrant={hasActiveGrant}
        onOpenProposalModal={() => setProposalModalOpen(true)}
      />

      <StatCards
        proposalCount={submittedProposals.length}
        approvedCount={proposalStats.approved}
        pendingCount={proposalStats.pending}
        rejectedCount={proposalStats.rejected}
        milestoneLabel={milestoneLabel}
        milestonePercent={milestonePercent}
        algoEarned={algoEarned}
        hasActiveGrant={hasActiveGrant}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GrantJourneyTimeline
          hasActiveGrant={hasActiveGrant}
          contractState={contractState}
          milestones={milestones}
          onSubmitMilestone={() => setShowSubmitModal(true)}
        />
        <OpenGrantsFeed />
      </div>

      <ProposalsTable
        proposals={submittedProposals}
        loading={loadingProposals}
        onEdit={handleStartEditProposal}
        onOpenProposalModal={() => setProposalModalOpen(true)}
      />
    </>
  );

  const renderActiveGrant = () => (
    <div className="space-y-4">
      {hasActiveGrant && (
        <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5">
          <h3 className="text-base font-semibold text-white mb-3">Grant Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-4">
              <p className="text-xs text-slate-500">Application ID</p>
              <p className="text-sm text-white font-semibold mt-1">{studentGrant?.appId || appId}</p>
            </div>
            <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-4">
              <p className="text-xs text-slate-500">Project</p>
              <p className="text-sm text-white font-semibold mt-1">{studentGrant?.projectTitle || 'Active Grant'}</p>
            </div>
            <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-4">
              <p className="text-xs text-slate-500">Sponsor Wallet</p>
              <p className="font-mono text-xs text-slate-200 mt-1 break-all">{studentGrant?.sponsorWallet || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {contractState && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5">
            <p className="text-sm text-slate-400">Total Grant</p>
            <p className="text-2xl font-bold text-white mt-1">{microalgosToAlgo(contractState.totalAmount)} ALGO</p>
          </div>
          <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5">
            <p className="text-sm text-slate-400">Current Milestone</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {Math.min(contractState.currentMilestone + 1, contractState.totalMilestones)} / {contractState.totalMilestones}
            </p>
          </div>
          <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5">
            <p className="text-sm text-slate-400">Escrow Balance</p>
            <p className="text-2xl font-bold text-purple-300 mt-1">{microalgosToAlgo(contractState.escrowBalance)} ALGO</p>
          </div>
          <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="text-lg font-bold text-white mt-1">{getOverallStatus()}</p>
          </div>
        </div>
      )}

      {!contractState && appId > 0 && !loadingState && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Grant state is currently unavailable. Please refresh.
        </div>
      )}

      {!contractState && appId === 0 && hasActiveGrant && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-6 text-center">
          <h3 className="text-lg font-semibold text-sky-200">Grant Syncing</h3>
          <p className="text-sm text-sky-100/80 mt-1">Your grant details are syncing automatically.</p>
        </div>
      )}

      <button
        onClick={fetchContractState}
        disabled={loadingState}
        className="w-full rounded-xl border border-white/10 bg-[#12172B] px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-[#171d36] transition disabled:opacity-50"
      >
        {loadingState ? 'Refreshing...' : 'Refresh Grant State'}
      </button>
    </div>
  );

  const renderMilestones = () => (
    <div className="space-y-4">
      <GrantJourneyTimeline
        hasActiveGrant={hasActiveGrant}
        contractState={contractState}
        milestones={milestones}
        onSubmitMilestone={() => setShowSubmitModal(true)}
      />

      {contractState && (
        <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Milestone Submissions</h3>
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={contractState.currentMilestone >= contractState.totalMilestones}
              className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50"
            >
              Submit Milestone
            </button>
          </div>

          <div className="space-y-3">
            {Array.from({ length: contractState.totalMilestones }, (_, i) => {
              const status = getMilestoneStatus(i);
              const submission = milestones.find((m) => m.milestoneIndex === i);

              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    status === 'approved'
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : status === 'pending'
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-white/6 bg-[#0B0F1E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Milestone {i + 1}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {status === 'approved'
                          ? 'Approved'
                          : status === 'pending'
                            ? 'Pending Review'
                            : 'Not submitted'}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {contractState.totalAmount / contractState.totalMilestones / 1_000_000} ALGO
                    </span>
                  </div>

                  {submission && (
                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <p>{submission.description}</p>
                      <p>
                        Proof:{' '}
                        {submission.proofLink ? (
                          <a href={submission.proofLink} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">
                            Open link
                          </a>
                        ) : submission.proofFileUrl ? (
                          <a href={submission.proofFileUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">
                            Open file
                          </a>
                        ) : (
                          <span className="text-slate-500">No proof attached</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderProposals = () => (
    <div className="space-y-4">
      <ProposalsTable
        proposals={submittedProposals}
        loading={loadingProposals}
        onEdit={handleStartEditProposal}
        onOpenProposalModal={() => setProposalModalOpen(true)}
      />

      {editingProposalId && (
        <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5 space-y-3">
          <h3 className="text-base font-semibold text-white">Edit Proposal</h3>
          <input
            type="text"
            value={editProposalForm.title}
            onChange={(e) => setEditProposalForm({ ...editProposalForm, title: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
            placeholder="Project title"
          />
          <textarea
            value={editProposalForm.description}
            onChange={(e) => setEditProposalForm({ ...editProposalForm, description: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
            placeholder="Description"
          />
          <textarea
            value={editProposalForm.expectedDeliverables}
            onChange={(e) => setEditProposalForm({ ...editProposalForm, expectedDeliverables: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
            placeholder="Expected deliverables"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={editProposalForm.expectedTimeline}
              onChange={(e) => setEditProposalForm({ ...editProposalForm, expectedTimeline: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
              placeholder="Expected timeline"
            />
            <input
              type="number"
              min="0"
              step="0.1"
              value={editProposalForm.expectedCost}
              onChange={(e) => setEditProposalForm({ ...editProposalForm, expectedCost: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
              placeholder="Expected cost (ALGO)"
            />
          </div>
          <input
            type="url"
            value={editProposalForm.githubLink}
            onChange={(e) => setEditProposalForm({ ...editProposalForm, githubLink: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
            placeholder="GitHub link"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdateProposal}
              disabled={savingProposalEdit}
              className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50"
            >
              {savingProposalEdit ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditingProposalId(null)}
              disabled={savingProposalEdit}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTransactions = () => (
    <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5">
      <h3 className="text-base font-semibold text-white mb-3">Recent Milestone Activity</h3>
      <div className="space-y-2">
        {milestones.length === 0 ? (
          <p className="text-sm text-slate-500">No milestone transactions yet.</p>
        ) : (
          milestones
            .slice()
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .map((m) => (
              <div key={m._id?.toString?.() || `${m.milestoneIndex}-${m.submittedAt}`} className="rounded-xl border border-white/6 bg-[#0B0F1E] p-3">
                <p className="text-sm text-white">Milestone {m.milestoneIndex + 1} • {m.status}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(m.submittedAt).toLocaleString()}</p>
              </div>
            ))
        )}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadNotificationCount > 0 && (
            <span className="text-xs rounded-full bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-0.5">
              {unreadNotificationCount} unread
            </span>
          )}
          <button
            onClick={fetchNotifications}
            className="text-xs rounded-lg border border-white/10 px-2.5 py-1 text-slate-300 hover:bg-white/5 transition"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {loadingNotifications ? (
          <p className="text-sm text-slate-500">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3 ${
                item.type === 'MILESTONE_REJECTED'
                  ? 'border-rose-500/30 bg-rose-500/10'
                  : item.type === 'MILESTONE_APPROVED'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-sky-500/30 bg-sky-500/10'
              }`}
            >
              <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                {item.title}
                {item.read === false && (
                  <span className="size-2 rounded-full bg-red-400" />
                )}
              </p>
              <p className="text-sm text-slate-300 mt-1">{item.message}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5 space-y-4">
      <h3 className="text-base font-semibold text-white">Account Settings</h3>
      <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-4">
        <p className="text-xs text-slate-500">Wallet Address</p>
        <p className="font-mono text-sm text-slate-200 break-all mt-1">{user.walletAddress}</p>
      </div>
      <button
        onClick={logout}
        className="rounded-xl bg-rose-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition"
      >
        Logout
      </button>
    </div>
  );

  const renderContent = () => {
    if (checkingGrant && activeSection === 'dashboard') {
      return (
        <div className="rounded-2xl border border-white/6 bg-[#12172B] p-8 text-center text-slate-400">
          Loading grant data...
        </div>
      );
    }

    if (activeSection === 'dashboard') return renderOverviewCards();
    if (activeSection === 'proposals') return renderProposals();
    if (activeSection === 'active-grant') return renderActiveGrant();
    if (activeSection === 'milestones') return renderMilestones();
    if (activeSection === 'earnings') return renderActiveGrant();
    if (activeSection === 'transactions') return renderTransactions();
    if (activeSection === 'notifications') return renderNotifications();
    return renderSettings();
  };

  return (
    <div className="min-h-screen bg-[#0B0F1E] text-slate-100 flex">
      <Sidebar
        walletAddress={user.walletAddress}
        isVerified={!!accountAddress && accountAddress.toLowerCase() === user.walletAddress.toLowerCase()}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        notificationCount={unreadNotificationCount}
      />

      <div className="flex-1 min-w-0">
        <TopBar
          pageTitle={sectionTitle[activeSection]}
          unreadCount={unreadNotificationCount}
          onOpenProposalModal={() => setProposalModalOpen(true)}
          onOpenNotifications={() => {
            setActiveSection('notifications');
            markNotificationsAsRead();
          }}
          userName={user.name}
        />

        <main className="p-4 md:p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {success}
            </div>
          )}

          {renderContent()}
        </main>
      </div>

      <SubmitProposalModal
        open={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        onSubmit={handleSubmitProposal}
        onViewProposals={() => setActiveSection('proposals')}
        initialEmail={user.email}
        initialName={user.name}
      />

      {showSubmitModal && (
        <div className="fixed inset-0 z-110 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-white/6 bg-[#12172B] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Submit Milestone Proof</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Milestone Number</label>
                <input
                  type="number"
                  min="1"
                  value={submissionForm.milestoneIndex}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, milestoneIndex: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
                  placeholder={contractState ? `Next: ${Math.min(contractState.currentMilestone + 1, contractState.totalMilestones)}` : '1'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Proof Link</label>
                <input
                  type="url"
                  value={submissionForm.proofLink}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, proofLink: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={submissionForm.description}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100"
                  placeholder="Describe your progress"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSubmissionForm({ milestoneIndex: '', proofLink: '', description: '' });
                }}
                disabled={submittingMilestone}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMilestone}
                disabled={submittingMilestone}
                className="flex-1 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50"
              >
                {submittingMilestone ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

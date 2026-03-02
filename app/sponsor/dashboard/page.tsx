'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  algoToMicroalgos,
  approveMilestone,
  ContractState,
  getContractGlobalState,
} from '@/lib/algorand';
import SponsorLayout, { SponsorSection } from '@/components/sponsor/SponsorLayout';
import MarketplaceView from '@/components/sponsor/MarketplaceView';
import ActiveGrantView from '@/components/sponsor/ActiveGrantView';
import OverviewView from '@/components/sponsor/OverviewView';
import TransactionsView from '@/components/sponsor/TransactionsView';

interface Project {
  id: string;
  title: string;
  description: string;
  abstract?: string;
  expectedDeliverables?: string;
  expectedTimeline?: string;
  expectedCost?: number;
  proposedBudget: number;
  studentWallet: string;
  githubLink: string;
  status: string;
}

interface GrantTransaction {
  txId: string;
  type: string;
  createdAt: string | Date;
  amount?: number;
  milestoneIndex?: number;
}

interface ActiveGrant {
  id: string;
  sponsorWallet: string;
  studentWallet: string;
  projectId: string;
  projectTitle: string;
  description: string;
  githubLink: string;
  proposedBudget: number;
  appId: number;
  status: 'ACTIVE' | 'COMPLETED';
  milestoneIndex: number;
  totalMilestones: number;
  escrowBalance: number;
  transactions: GrantTransaction[];
}

interface MilestoneRecord {
  id: string;
  milestoneIndex: number;
  description: string;
  proofLink?: string;
  proofFileUrl?: string;
  proofFileName?: string;
  proofType?: 'github_link' | 'file_upload';
  status: 'submitted' | 'approved' | 'rejected' | 'not-submitted';
}

interface MilestoneApiItem {
  _id?: string;
  milestoneIndex: number;
  description: string;
  proofLink?: string;
  proofFileUrl?: string;
  proofFileName?: string;
  proofType?: 'github_link' | 'file_upload';
  status: 'pending' | 'approved' | 'rejected';
}

function isDemoGrant(grant: ActiveGrant): boolean {
  return grant.appId >= 900000000 || grant.transactions?.some((tx) => tx.txId.startsWith('DEMO-'));
}

export default function SponsorDashboardPage() {
  const { user, loading, logout } = useAuth();
  const { accountAddress, signTransaction } = useWallet();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<SponsorSection>('overview');
  const [activeGrant, setActiveGrant] = useState<ActiveGrant | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [completedGrantsCount, setCompletedGrantsCount] = useState(0);
  const [completedGrantsTrend, setCompletedGrantsTrend] = useState<Array<{ label: string; count: number }>>([]);

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingContract, setLoadingContract] = useState(false);
  const [deletingGrant, setDeletingGrant] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastTxId, setLastTxId] = useState('');

  const completingGrantRef = useRef(false);

  const clearFlashLater = useCallback(() => {
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 4000);
  }, []);

  const fetchOpenProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch('/api/projects/open');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
      clearFlashLater();
    } finally {
      setLoadingProjects(false);
    }
  }, [clearFlashLater]);

  const fetchMilestones = useCallback(async (appId: number) => {
    try {
      const response = await fetch(`/api/milestones?appId=${appId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch milestones');
      }

      const submissions: MilestoneApiItem[] = data.milestones || [];
      const normalized: MilestoneRecord[] = [0, 1, 2].map((index) => {
        const submission = submissions.find((item) => item.milestoneIndex === index);

        if (!submission) {
          return {
            id: `placeholder-${index}`,
            milestoneIndex: index,
            description: '',
            proofLink: undefined,
            proofFileUrl: undefined,
            proofFileName: undefined,
            proofType: undefined,
            status: 'not-submitted',
          };
        }

        return {
          id: submission._id || `submission-${index}`,
          milestoneIndex: submission.milestoneIndex,
          description: submission.description,
          proofLink: submission.proofLink,
          proofFileUrl: submission.proofFileUrl,
          proofFileName: submission.proofFileName,
          proofType: submission.proofType,
          status:
            submission.status === 'pending'
              ? 'submitted'
              : submission.status === 'approved'
                ? 'approved'
                : 'rejected',
        };
      });

      setMilestones(normalized);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch milestones');
      clearFlashLater();
    }
  }, [clearFlashLater]);

  const markGrantCompleted = useCallback(async (grantId: string) => {
    if (completingGrantRef.current) return;

    completingGrantRef.current = true;
    try {
      await fetch('/api/grants/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId }),
      });
      setSuccess('Grant Completed');
      clearFlashLater();
    } finally {
      completingGrantRef.current = false;
    }
  }, [clearFlashLater]);

  const refreshContractState = useCallback(async (grant: ActiveGrant) => {
    setLoadingContract(true);
    try {
      if (isDemoGrant(grant)) {
        setContractState({
          escrowBalance: algoToMicroalgos(grant.escrowBalance),
          currentMilestone: grant.milestoneIndex,
          totalAmount: algoToMicroalgos(grant.proposedBudget),
          totalMilestones: 3,
          sponsorAddress: grant.sponsorWallet,
          studentAddress: grant.studentWallet,
          isActive: grant.status === 'ACTIVE',
          lastUpdated: Date.now(),
        });
        return;
      }

      const state = await getContractGlobalState(grant.appId);
      setContractState(state);

      if (state && state.currentMilestone >= 3 && grant.status === 'ACTIVE') {
        await markGrantCompleted(grant.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contract state');
      clearFlashLater();
    } finally {
      setLoadingContract(false);
    }
  }, [clearFlashLater, markGrantCompleted]);

  const fetchActiveGrant = useCallback(async () => {
    const response = await fetch('/api/grants/active');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch active grant');
    }

    const grant = data.activeGrant as ActiveGrant | null;
    setCompletedGrantsCount(Number(data.completedGrantsCount || 0));
    setCompletedGrantsTrend(Array.isArray(data.completedGrantsTrend) ? data.completedGrantsTrend : []);

    setActiveGrant(grant);

    if (grant) {
      await Promise.all([refreshContractState(grant), fetchMilestones(grant.appId)]);
      setActiveSection('overview');
    } else {
      setContractState(null);
      setMilestones([]);
      setActiveSection('overview');
    }
  }, [fetchMilestones, refreshContractState]);

  const refreshDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setError('');

    try {
      await fetchActiveGrant();
      await fetchOpenProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
      clearFlashLater();
    } finally {
      setLoadingDashboard(false);
    }
  }, [clearFlashLater, fetchActiveGrant, fetchOpenProjects]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!loading && user && user.role !== 'sponsor') {
      router.push('/dashboard/student');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!loading && user?.role === 'sponsor') {
      refreshDashboard();
    }
  }, [loading, refreshDashboard, user]);

  const handleDeleteActiveGrant = async () => {
    if (!activeGrant) {
      setError('No active grant found');
      clearFlashLater();
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete the current active grant?');
    if (!confirmed) return;

    setDeletingGrant(true);
    try {
      const response = await fetch('/api/grants/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId: activeGrant.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete active grant');
      }

      setSuccess('Active grant deleted successfully');
      setLastTxId('');
      clearFlashLater();

      await refreshDashboard();
      setActiveSection('projects');
    } catch (err: any) {
      setError(err.message || 'Failed to delete active grant');
      clearFlashLater();
    } finally {
      setDeletingGrant(false);
    }
  };

  const handleApproveMilestone = async (milestone: MilestoneRecord) => {
    if (!activeGrant || !accountAddress) {
      setError('Active grant and wallet connection are required');
      clearFlashLater();
      return;
    }

    setActionLoading(`approve-${milestone.id}`);
    try {
      const txId = await approveMilestone(accountAddress, activeGrant.appId, milestone.milestoneIndex, signTransaction);

      const reviewResponse = await fetch('/api/milestones/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: milestone.id,
          action: 'APPROVE',
          txId,
        }),
      });

      if (!reviewResponse.ok) {
        const data = await reviewResponse.json();
        throw new Error(data.error || 'Failed to update submission status');
      }

      setLastTxId(txId);
      setSuccess(`Milestone ${milestone.milestoneIndex + 1} approved`);
      clearFlashLater();

      await refreshContractState(activeGrant);
      await fetchMilestones(activeGrant.appId);
      await fetchActiveGrant();
    } catch (err: any) {
      setError(err.message || 'Failed to approve milestone');
      clearFlashLater();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectMilestone = async (milestone: MilestoneRecord) => {
    if (!activeGrant) {
      setError('Active grant required');
      clearFlashLater();
      return;
    }

    setActionLoading(`reject-${milestone.id}`);
    try {
      const response = await fetch('/api/milestones/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: milestone.id,
          action: 'REJECT',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject milestone');
      }

      setSuccess(`Milestone ${milestone.milestoneIndex + 1} rejected`);
      clearFlashLater();
      await fetchMilestones(activeGrant.appId);
    } catch (err: any) {
      setError(err.message || 'Failed to reject milestone');
      clearFlashLater();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || loadingDashboard) {
    return (
      <div className="min-h-screen bg-[url('/assets/dark-hero-gradient.svg')] bg-cover bg-top text-slate-300 flex items-center justify-center">
        Loading sponsor dashboard...
      </div>
    );
  }

  if (!user || user.role !== 'sponsor') {
    return null;
  }

  const hasActiveGrant = !!activeGrant && activeGrant.status === 'ACTIVE';
  const currentSection = hasActiveGrant
    ? activeSection
    : activeSection === 'active-grant'
      ? 'overview'
      : activeSection;

  return (
    <SponsorLayout
      walletAddress={user.walletAddress}
      hasActiveGrant={hasActiveGrant}
      activeSection={currentSection}
      onSectionChange={setActiveSection}
      onLogout={logout}
    >
      {error && (
        <div className="mb-5 rounded-lg border border-rose-800/80 bg-rose-900/30 p-3 text-sm text-rose-200">{error}</div>
      )}
      {success && (
        <div className="mb-5 rounded-lg border border-emerald-800/80 bg-emerald-900/30 p-3 text-sm text-emerald-200">{success}</div>
      )}

      {currentSection === 'overview' && (
        <OverviewView
          hasActiveGrant={hasActiveGrant}
          activeGrant={activeGrant}
          contractState={contractState}
          projectsCount={projects.length}
          completedGrantsCount={completedGrantsCount}
          completedGrantsTrend={completedGrantsTrend}
          onGoProjects={() => setActiveSection('projects')}
          onGoActiveGrant={() => setActiveSection('active-grant')}
          onGoTransactions={() => setActiveSection('transactions')}
        />
      )}

      {currentSection === 'projects' && (
        <MarketplaceView
          projects={projects}
          loading={loadingProjects}
          error={''}
          hasActiveGrant={hasActiveGrant}
        />
      )}

      {currentSection === 'active-grant' && hasActiveGrant && activeGrant && (
        <ActiveGrantView
          grant={activeGrant}
          contractState={contractState}
          loadingContract={loadingContract}
          deletingGrant={deletingGrant}
          lastTxId={lastTxId}
          actionLoading={actionLoading}
          milestones={milestones}
          onDeleteGrant={handleDeleteActiveGrant}
          onRefreshState={() => refreshContractState(activeGrant)}
          onApprove={handleApproveMilestone}
          onReject={handleRejectMilestone}
        />
      )}

      {currentSection === 'transactions' && (
        <TransactionsView transactions={activeGrant?.transactions || []} />
      )}
    </SponsorLayout>
  );
}

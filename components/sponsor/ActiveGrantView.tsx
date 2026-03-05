'use client';

import { ContractState, microalgosToAlgo } from '@/lib/algorand';
import MilestoneReview from './MilestoneReview';

interface GrantTransaction {
  txId: string;
  type: string;
  createdAt: string | Date;
  amount?: number;
  milestoneIndex?: number;
}

interface ActiveGrant {
  id: string;
  projectTitle: string;
  description: string;
  studentWallet: string;
  proposedBudget: number;
  appId: number;
  milestoneIndex: number;
  status: 'ACTIVE' | 'COMPLETED';
  transactions: GrantTransaction[];
}

interface MilestoneItem {
  id: string;
  milestoneIndex: number;
  description: string;
  proofLink?: string;
  proofFileUrl?: string;
  proofFileName?: string;
  proofType?: 'github_link' | 'file_upload';
  status: 'submitted' | 'approved' | 'rejected' | 'not-submitted';
}

interface ActiveGrantViewProps {
  grant: ActiveGrant;
  contractState: ContractState | null;
  loadingContract: boolean;
  deletingGrant: boolean;
  lastTxId: string;
  actionLoading: string | null;
  milestones: MilestoneItem[];
  onDeleteGrant: () => Promise<void>;
  onRefreshState: () => Promise<void>;
  onApprove: (milestone: MilestoneItem) => Promise<void>;
  onReject: (milestone: MilestoneItem) => Promise<void>;
}

export default function ActiveGrantView({
  grant,
  contractState,
  loadingContract,
  deletingGrant,
  lastTxId,
  actionLoading,
  milestones,
  onDeleteGrant,
  onRefreshState,
  onApprove,
  onReject,
}: ActiveGrantViewProps) {
  const milestoneIndex = contractState?.currentMilestone ?? grant.milestoneIndex;
  const displayMilestone = Math.min(milestoneIndex + 1, 3);
  const progress = Math.min((milestoneIndex / 3) * 100, 100);
  const escrowBalance = contractState?.escrowBalance ?? grant.proposedBudget;
  const stats = [
    { label: 'Current Milestone', value: `${displayMilestone} / 3` },
    { label: 'Total Budget', value: `${grant.proposedBudget} ALGO` },
    { label: 'Escrow Balance', value: `${microalgosToAlgo(escrowBalance)} ALGO` },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Active Grant</h2>
          <p className="mt-1 text-sm text-slate-400">Application ID: {grant.appId}</p>
        </div>
        <div className="flex items-center gap-2">
          {milestoneIndex === 3 && (
            <span className="rounded-full border border-emerald-700 bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-300">
              Grant Completed
            </span>
          )}
          <button
            onClick={onRefreshState}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Refresh State
          </button>
          <button
            onClick={onDeleteGrant}
            disabled={deletingGrant}
            className="rounded-lg border border-rose-700 bg-rose-900/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-900/50 disabled:opacity-50"
          >
            {deletingGrant ? 'Cancelling...' : 'Cancel & Clawback'}
          </button>
        </div>
      </div>

      {loadingContract ? (
        <p className="text-sm text-slate-400">Loading contract state...</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-700/60 bg-slate-900/55 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-1.5 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Project title</p>
              <p className="mt-2 text-lg font-semibold text-white">{grant.projectTitle}</p>
              <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Description</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{grant.description}</p>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Student wallet</p>
              <p className="mt-2 break-all text-sm text-slate-200">{grant.studentWallet}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Milestone progress</span>
              <span>{displayMilestone} / 3</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-slate-800">
              <div className="h-2.5 rounded-full bg-purple-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </>
      )}

      {lastTxId && (
        <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3 text-xs text-slate-200">
          Last transaction ID: <span className="break-all text-purple-300">{lastTxId}</span>
        </div>
      )}

      <MilestoneReview
        milestones={milestones}
        actionLoading={actionLoading}
        onApprove={onApprove}
        onReject={onReject}
      />
    </section>
  );
}

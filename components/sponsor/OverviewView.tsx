'use client';

import { ContractState, microalgosToAlgo } from '@/lib/algorand';
import {
  activeGrantProjectsRows,
  buildSponsorKpis,
  disbursedTrend,
  grantFulfillmentRate,
  studentFundingBreakdown,
} from '@/lib/mock-data/sponsor-dashboard';
import KpiCards from '@/app/dashboard/sponsor/components/KpiCards';
import DisbursedLineChart from '@/app/dashboard/sponsor/components/DisbursedLineChart';
import CompletedGrantsChart from '@/app/dashboard/sponsor/components/CompletedGrantsChart';
import StudentBreakdown from '@/app/dashboard/sponsor/components/StudentBreakdown';
import FulfillmentGauge from '@/app/dashboard/sponsor/components/FulfillmentGauge';
import GrantProjectsTable from '@/app/dashboard/sponsor/components/GrantProjectsTable';

interface GrantTransaction {
  txId: string;
  type: string;
  createdAt: string | Date;
}

interface ActiveGrantSummary {
  id: string;
  projectTitle: string;
  proposedBudget: number;
  status: 'ACTIVE' | 'COMPLETED';
  milestoneIndex: number;
  transactions: GrantTransaction[];
}

interface OverviewViewProps {
  hasActiveGrant: boolean;
  activeGrant: ActiveGrantSummary | null;
  contractState: ContractState | null;
  projectsCount: number;
  completedGrantsCount: number;
  completedGrantsTrend: Array<{ label: string; count: number }>;
  onGoProjects: () => void;
  onGoActiveGrant: () => void;
  onGoTransactions: () => void;
}

export default function OverviewView({
  hasActiveGrant,
  activeGrant,
  contractState,
  projectsCount,
  completedGrantsCount,
  completedGrantsTrend,
  onGoProjects,
  onGoActiveGrant,
  onGoTransactions,
}: OverviewViewProps) {
  const milestone = contractState?.currentMilestone ?? activeGrant?.milestoneIndex ?? 0;
  const displayMilestone = Math.min(milestone + 1, 3);
  const escrow = contractState?.escrowBalance ?? 0;
  const mockTrendData = [
    { label: 'Oct', count: 2 },
    { label: 'Nov', count: 3 },
    { label: 'Dec', count: 5 },
    { label: 'Jan', count: 4 },
    { label: 'Feb', count: 6 },
    { label: 'Mar', count: 7 },
  ];
  const hasRealTrend = completedGrantsTrend.some((item) => item.count > 0);
  const graphData = (hasRealTrend ? completedGrantsTrend : mockTrendData).map((item) => ({
    month: item.label,
    count: item.count,
  }));
  const displayCompletedCount = hasRealTrend
    ? completedGrantsCount
    : 27;
  const metricCards = buildSponsorKpis({
    hasActiveGrant,
    projectsCount,
    milestoneProgress: `${displayMilestone} / 3`,
    escrowBalance: `${microalgosToAlgo(escrow)} ALGO`,
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Overview</h2>
        <p className="mt-1 text-sm text-slate-400">Control center for sponsor grant operations.</p>
      </header>

      <KpiCards items={metricCards} />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-[#12172B] p-4 md:p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Quick Access</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <button
              onClick={onGoProjects}
              className="rounded-xl border border-white/10 bg-[#0F1428] p-4 text-left transition hover:border-purple-500/40"
            >
              <p className="text-sm font-semibold text-white">Projects</p>
              <p className="mt-1 text-xs text-slate-400">Browse open student proposals.</p>
            </button>

            <button
              onClick={onGoActiveGrant}
              disabled={!hasActiveGrant}
              className="rounded-xl border border-white/10 bg-[#0F1428] p-4 text-left transition hover:border-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="text-sm font-semibold text-white">Active Grant</p>
              <p className="mt-1 text-xs text-slate-400">Review milestones and escrow state.</p>
            </button>

            <button
              onClick={onGoTransactions}
              className="rounded-xl border border-white/10 bg-[#0F1428] p-4 text-left transition hover:border-purple-500/40"
            >
              <p className="text-sm font-semibold text-white">Transactions</p>
              <p className="mt-1 text-xs text-slate-400">Track payout history.</p>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#12172B] p-4 md:p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Current Grant</p>
          {activeGrant ? (
            <>
              <p className="mt-2 text-base font-semibold text-white">{activeGrant.projectTitle}</p>
              <p className="mt-2 text-sm text-slate-300">Budget: {activeGrant.proposedBudget} ALGO</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No active grant currently.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <DisbursedLineChart data={disbursedTrend} />
        <CompletedGrantsChart data={graphData} totalCount={displayCompletedCount} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <StudentBreakdown items={studentFundingBreakdown} />
        <FulfillmentGauge value={grantFulfillmentRate} onShowDetails={onGoActiveGrant} />
      </div>

      <GrantProjectsTable rows={activeGrantProjectsRows} />
    </section>
  );
}

'use client';

import { useMemo } from 'react';
import { Flag } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ContractState } from '@/lib/algorand';
import type { MilestoneSubmission } from '@/lib/models/Milestone';

interface GrantJourneyTimelineProps {
  hasActiveGrant: boolean;
  contractState: ContractState | null;
  milestones: MilestoneSubmission[];
  onSubmitMilestone: () => void;
}

export default function GrantJourneyTimeline({
  hasActiveGrant,
  contractState,
  milestones,
  onSubmitMilestone,
}: GrantJourneyTimelineProps) {
  const totalMilestones = contractState?.totalMilestones ?? 0;
  const currentMilestone = contractState?.currentMilestone ?? 0;
  const completedMilestones = hasActiveGrant
    ? Math.min(currentMilestone, totalMilestones)
    : 0;
  const pendingReviews = milestones.filter((m) => m.status === 'pending').length;
  const rejectedReviews = milestones.filter((m) => m.status === 'rejected').length;

  const chartData = useMemo(() => {
    if (!hasActiveGrant || !contractState) {
      return [] as Array<{ name: string; progress: number; baseline: number; target: number }>;
    }

    return Array.from({ length: totalMilestones }, (_, i) => {
      const submission = milestones.find((m) => m.milestoneIndex === i);
      let progress = 0;
      let baseline = i === 0 ? 0 : Math.round((i / totalMilestones) * 100);

      if (i < currentMilestone) {
        progress = 100;
        baseline = 100;
      } else if (submission?.status === 'pending') {
        progress = 70;
      } else if (submission?.status === 'rejected') {
        progress = 35;
      } else if (i === currentMilestone) {
        progress = 20;
      }

      return {
        name: `M${i + 1}`,
        progress,
        baseline,
        target: 100,
      };
    });
  }, [hasActiveGrant, contractState, totalMilestones, milestones, currentMilestone]);

  return (
    <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">My Grant Journey</h3>
        {hasActiveGrant && contractState && (
          <span className="text-xs text-slate-400">
            Milestone {Math.min(currentMilestone + 1, totalMilestones)} / {totalMilestones}
          </span>
        )}
      </div>

      {hasActiveGrant && contractState && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-white/6 bg-[#0B0F1E] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Completed</p>
            <p className="text-sm font-semibold text-emerald-300 mt-0.5">{completedMilestones}</p>
          </div>
          <div className="rounded-lg border border-white/6 bg-[#0B0F1E] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Pending</p>
            <p className="text-sm font-semibold text-amber-300 mt-0.5">{pendingReviews}</p>
          </div>
          <div className="rounded-lg border border-white/6 bg-[#0B0F1E] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Rejected</p>
            <p className="text-sm font-semibold text-rose-300 mt-0.5">{rejectedReviews}</p>
          </div>
        </div>
      )}

      {hasActiveGrant && contractState ? (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="journeyProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                stroke="#64748B"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <ReferenceLine y={100} stroke="#334155" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B0F1E',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
                labelStyle={{ color: '#CBD5E1' }}
                formatter={(value: number | string | undefined, name: string | undefined) => [
                  `${Number(value ?? 0)}%`,
                  name === 'progress' ? 'Current completion' : 'Ideal progress',
                ]}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#475569"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="6 4"
              />
              <Area
                type="monotone"
                dataKey="progress"
                stroke="#7C3AED"
                fill="url(#journeyProgress)"
                strokeWidth={2}
                activeDot={{ r: 4, fill: '#7C3AED' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-56 rounded-xl border border-white/6 bg-[#0B0F1E] flex items-center justify-center text-center px-6">
          <div>
            <Flag className="size-5 mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">No active grant yet</p>
            <p className="text-xs text-slate-600 mt-1">Submit a proposal to start tracking milestone progress.</p>
          </div>
        </div>
      )}

      {hasActiveGrant && contractState && contractState.currentMilestone < contractState.totalMilestones && (
        <button
          onClick={onSubmitMilestone}
          className="w-full mt-1 rounded-xl border border-[#7C3AED]/40 bg-transparent py-2.5 text-sm font-semibold text-purple-200 hover:bg-[#7C3AED]/10 transition"
        >
          Submit Milestone Proof
        </button>
      )}

      {!hasActiveGrant && (
        <div className="rounded-xl bg-white/5 border border-white/6 p-4 text-center">
          <p className="text-sm text-slate-400">No active grant yet</p>
          <p className="text-xs text-slate-600 mt-1">Apply for a grant to begin your journey</p>
        </div>
      )}
    </div>
  );
}

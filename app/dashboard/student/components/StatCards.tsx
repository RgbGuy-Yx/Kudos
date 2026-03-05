'use client';

import { CheckCircle, FileText, Wallet } from 'lucide-react';

interface StatCardsProps {
  proposalCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  milestoneLabel: string;
  milestonePercent: number;
  algoEarned: number;
  hasActiveGrant: boolean;
}

export default function StatCards({
  proposalCount,
  approvedCount,
  pendingCount,
  rejectedCount,
  milestoneLabel,
  milestonePercent,
  algoEarned,
  hasActiveGrant,
}: StatCardsProps) {
  const total = approvedCount + pendingCount + rejectedCount || 1;

  const milestoneRadius = 28;
  const milestoneCirc = 2 * Math.PI * milestoneRadius;
  const milestoneOffset = milestoneCirc - (milestonePercent / 100) * milestoneCirc;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Card 1 — My Proposals (widest) */}
      <div className="col-span-12 md:col-span-5 rounded-2xl border border-white/6 bg-[#12172B] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-[#7C3AED]/20 inline-flex items-center justify-center">
              <FileText className="size-4.5 text-[#7C3AED]" />
            </div>
            <span className="text-sm font-medium text-slate-400">My Proposals</span>
          </div>
          <span className="text-3xl font-bold text-white">{proposalCount}</span>
        </div>

        {/* Breakdown bar */}
        <div className="space-y-2">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(approvedCount / total) * 100}%` }}
            />
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${(pendingCount / total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(rejectedCount / total) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-500" />
              Approved {approvedCount}
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="size-2 rounded-full bg-amber-500" />
              Pending {pendingCount}
            </span>
            <span className="flex items-center gap-1.5 text-red-300">
              <span className="size-2 rounded-full bg-red-500" />
              Rejected {rejectedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2 — Milestone Progress */}
      <div className="col-span-12 md:col-span-4 rounded-2xl border border-white/6 bg-[#12172B] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-emerald-500/20 inline-flex items-center justify-center">
              <CheckCircle className="size-4.5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-slate-400">Milestone Progress</span>
          </div>
          <div className="relative size-16">
            <svg viewBox="0 0 72 72" className="size-full -rotate-90">
              <circle cx="36" cy="36" r={milestoneRadius} fill="none" stroke="#1E2340" strokeWidth="6" />
              <circle
                cx="36"
                cy="36"
                r={milestoneRadius}
                fill="none"
                stroke="#22C55E"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={milestoneCirc}
                strokeDashoffset={milestoneOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{milestonePercent}%</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-300">{milestoneLabel}</p>
      </div>

      {/* Card 3 — ALGO Earned */}
      <div className="col-span-12 md:col-span-3 rounded-2xl border border-white/6 bg-[#12172B] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-9 rounded-lg bg-purple-500/20 inline-flex items-center justify-center">
            <Wallet className="size-4.5 text-purple-400" />
          </div>
          <span className="text-sm font-medium text-slate-400">ALGO Earned</span>
        </div>
        <p className="text-2xl font-bold text-white">{algoEarned.toFixed(3)} ALGO</p>
        <p className="mt-1 text-xs text-slate-500">
          {hasActiveGrant ? 'From milestone payouts' : 'No disbursements yet'}
        </p>
      </div>
    </div>
  );
}

'use client';

import { Plus } from 'lucide-react';

interface HeroBannerProps {
  userName: string;
  walletAddress: string;
  isVerified: boolean;
  proposalCount: number;
  activeGrantCount: number;
  algoEarned: number;
  algoGoal: number;
  hasActiveGrant: boolean;
  onOpenProposalModal: () => void;
}

export default function HeroBanner({
  userName,
  walletAddress,
  isVerified,
  proposalCount,
  activeGrantCount,
  algoEarned,
  algoGoal,
  hasActiveGrant,
  onOpenProposalModal,
}: HeroBannerProps) {
  const pct = algoGoal > 0 ? Math.min((algoEarned / algoGoal) * 100, 100) : 0;
  const truncWallet = `${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}`;

  // SVG radial
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-[#12172B] p-6 md:p-8">
      {/* Purple radial glow */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#7C3AED]/20 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left */}
        <div className="space-y-4 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {userName} 👋
          </h2>

          {/* Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 px-3 py-1 text-xs font-medium text-purple-200">
              Student
            </span>
            <span className="rounded-full bg-[#1E1B4B] border border-white/10 px-3 py-1 font-mono text-xs text-slate-300">
              {truncWallet}
            </span>
            {isVerified && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Verified
              </span>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3">
            <span className="rounded-lg bg-white/5 border border-white/6 px-3 py-1.5 text-xs text-slate-300">
              <strong className="text-white">{proposalCount}</strong> Proposals Submitted
            </span>
            <span className="rounded-lg bg-white/5 border border-white/6 px-3 py-1.5 text-xs text-slate-300">
              <strong className="text-white">{activeGrantCount}</strong> Active Grants
            </span>
          </div>

          <button
            onClick={onOpenProposalModal}
            className="mt-1 flex items-center gap-2 rounded-xl border border-[#7C3AED]/40 bg-transparent px-4 py-2 text-sm font-semibold text-purple-200 hover:bg-[#7C3AED]/10 transition"
          >
            <Plus className="size-4" />
            Submit Proposal
          </button>
        </div>

        {/* Right — Radial funding progress */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative size-36">
            <svg viewBox="0 0 128 128" className="size-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="#1E2340"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="#7C3AED"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">{algoEarned.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400">/ {algoGoal} ALGO</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {hasActiveGrant ? 'Funding Progress' : 'No active grant yet'}
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, User, FolderKanban, Coins } from 'lucide-react';
import type { Step1Data } from './Step1AboutYou';
import type { Step2Data } from './Step2YourProject';
import type { Step3Data } from './Step3Funding';

interface Step4Props {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  agreed: boolean;
  onAgreeChange: (v: boolean) => void;
  submitted: boolean;
  onGoToProposals: () => void;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-white/4 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs text-slate-200 text-right max-w-[60%] wrap-break-word">{value || '—'}</span>
    </div>
  );
}

export default function Step4Review({
  step1,
  step2,
  step3,
  agreed,
  onAgreeChange,
  submitted,
  onGoToProposals,
}: Step4Props) {
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          <CheckCircle2 className="size-20 text-emerald-400 mb-4" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold text-slate-100"
        >
          Proposal Submitted! 🎉
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-slate-400 mt-2 max-w-xs"
        >
          Your proposal has been sent to the sponsor for review. You&apos;ll be notified once there&apos;s an update.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onGoToProposals}
          className="mt-6 px-5 py-2.5 rounded-xl bg-[#7C3AED] text-sm font-medium text-white hover:bg-[#6D28D9] transition"
        >
          View My Proposals
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-95 overflow-y-auto pr-1 custom-scrollbar">
      {/* About You */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <User className="size-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-slate-200">About You</h4>
        </div>
        <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-3">
          <Row label="Name" value={step1.fullName} />
          <Row label="Email" value={step1.email} />
          <Row label="University" value={step1.university} />
          <Row label="Degree" value={step1.degreeProgram} />
          <Row label="Year / Semester" value={`Year ${step1.yearOfStudy} / Sem ${step1.currentSemester}`} />
          <Row label="Graduation" value={step1.graduationYear} />
          <Row label="GitHub" value={step1.githubProfile} />
          <Row label="LinkedIn" value={step1.linkedinUrl} />
        </div>
      </div>

      {/* Project */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FolderKanban className="size-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-slate-200">Your Project</h4>
        </div>
        <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-3">
          <Row label="Title" value={step2.projectTitle} />
          <Row label="Category" value={step2.projectCategory} />
          <Row label="Description" value={step2.shortDescription} />
          <Row label="Deliverables" value={step2.expectedDeliverables} />
          <Row label="Tech Stack" value={step2.techStack.length > 0 ? step2.techStack.join(', ') : '—'} />
          <Row label="Stage" value={step2.projectStage} />
          <Row label="GitHub Repo" value={step2.githubRepoUrl} />
        </div>
      </div>

      {/* Funding */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Coins className="size-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-slate-200">Funding &amp; Milestones</h4>
        </div>
        <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-3">
          <Row label="Expected Cost" value={`${step3.expectedCost || 0} ALGO`} />
          <Row label="Timeline" value={step3.expectedTimeline} />
          <Row label="Funds Usage" value={step3.fundsUsage} />
          <div className="mt-2 pt-2 border-t border-white/6">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Milestones</span>
            {step3.milestones.map((ms, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-300">{ms.title || `Milestone ${idx + 1}`}</span>
                <span className="text-slate-400">{ms.amount ? `${ms.amount} ALGO` : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agreement */}
      <label className="flex items-start gap-3 cursor-pointer py-2">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreeChange(e.target.checked)}
          className="mt-0.5 size-4 rounded border-white/20 bg-[#0B0F1E] text-[#7C3AED] focus:ring-[#7C3AED]/40 accent-[#7C3AED]"
        />
        <span className="text-xs text-slate-400 leading-relaxed">
          I confirm that all information provided is accurate. I agree to the Kudos terms of service and understand that my proposal will be reviewed by the sponsor.
        </span>
      </label>
    </div>
  );
}

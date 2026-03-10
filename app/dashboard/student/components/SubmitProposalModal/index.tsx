'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import Step1AboutYou, { type Step1Data } from './Step1AboutYou';
import Step2YourProject, { type Step2Data } from './Step2YourProject';
import Step3Funding, { type Step3Data } from './Step3Funding';
import Step4Review from './Step4Review';

interface SubmitProposalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
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
  }) => Promise<{ success: boolean; error?: string }>;
  onViewProposals: () => void;
  initialEmail?: string;
  initialName?: string;
}

const stepTitles = ['About You', 'Your Project', 'Funding & Milestones', 'Review & Submit'];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const defaultStep1: Step1Data = {
  fullName: '',
  email: '',
  university: '',
  degreeProgram: '',
  yearOfStudy: '',
  currentSemester: '',
  graduationYear: '',
  githubProfile: '',
  linkedinUrl: '',
};

const defaultStep2: Step2Data = {
  projectTitle: '',
  projectCategory: '',
  shortDescription: '',
  expectedDeliverables: '',
  techStack: [],
  projectStage: '',
  githubRepoUrl: '',
};

const defaultStep3: Step3Data = {
  expectedCost: '',
  expectedTimeline: '',
  milestones: [
    { title: '', amount: '', targetDate: '' },
    { title: '', amount: '', targetDate: '' },
  ],
  fundsUsage: '',
};

export default function SubmitProposalModal({
  open,
  onClose,
  onSubmit,
  onViewProposals,
  initialEmail,
  initialName,
}: SubmitProposalModalProps) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step1, setStep1] = useState<Step1Data>({
    ...defaultStep1,
    email: initialEmail || '',
    fullName: initialName || '',
  });
  const [step2, setStep2] = useState<Step2Data>(defaultStep2);
  const [step3, setStep3] = useState<Step3Data>(defaultStep3);

  // Load from session storage if present
  useEffect(() => {
    if (open) {
      setStep(0);
      setDir(1);
      setSubmitting(false);
      setSubmitted(false);
      setAgreed(false);
      setError(null);
      let sessionData = null;
      try {
        sessionData = JSON.parse(sessionStorage.getItem('proposalDraft') || '{}');
      } catch {}
      setStep1((prev) => ({
        ...defaultStep1,
        ...prev,
        ...sessionData?.step1,
        email: initialEmail || prev.email || '',
        fullName: initialName || prev.fullName || '',
      }));
      setStep2((prev) => ({ ...defaultStep2, ...prev, ...sessionData?.step2 }));
      setStep3((prev) => ({ ...defaultStep3, ...prev, ...sessionData?.step3 }));
    }
  }, [open, initialEmail, initialName]);

  const isCurrentStepValid = () => {
    if (step === 0) {
      return Boolean(
        step1.fullName.trim() &&
          step1.email.trim() &&
          step1.university.trim() &&
          step1.degreeProgram &&
          step1.yearOfStudy &&
          step1.currentSemester &&
          step1.graduationYear,
      );
    }

    if (step === 1) {
      return Boolean(
        step2.projectTitle.trim() &&
          step2.projectCategory &&
          step2.shortDescription.trim() &&
          step2.expectedDeliverables.trim() &&
          step2.projectStage,
      );
    }

    if (step === 2) {
      const expected = Number(step3.expectedCost);
      const validMilestones = step3.milestones.every(
        (m) => m.title.trim() && Number(m.amount) > 0 && m.targetDate,
      );
      const allocated = step3.milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      return Boolean(expected > 0 && step3.expectedTimeline && validMilestones && Math.abs(allocated - expected) < 0.001);
    }

    if (step === 3) {
      return agreed;
    }

    return false;
  };

  const goNext = () => {
    if (!isCurrentStepValid()) {
      setError('Please fill all required fields before proceeding.');
      return;
    }
    setError(null);
    if (step < 3) {
      setDir(1);
      setStep(step + 1);
    }
  };
  const goBack = () => {
    setError(null);
    if (step > 0) {
      setDir(-1);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isCurrentStepValid() || submitting) {
      setError('Please fill all required fields before submitting.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: step2.projectTitle.trim(),
        description: `${step2.shortDescription.trim()}\n\nDeliverables:\n${step2.expectedDeliverables.trim()}\n\nTech Stack: ${step2.techStack.join(', ') || 'N/A'}\nStage: ${step2.projectStage || 'N/A'}\nCategory: ${step2.projectCategory || 'N/A'}\nTimeline: ${step3.expectedTimeline || 'N/A'}\nFunds Usage: ${step3.fundsUsage || 'N/A'}`,
        expectedDeliverables: step2.expectedDeliverables.trim(),
        expectedTimeline: step3.expectedTimeline || '',
        amount: Number(step3.expectedCost),
        milestones: step3.milestones.map((m) => ({
          title: m.title.trim(),
          amount: Number(m.amount),
          targetDate: m.targetDate,
        })),
        fundsUsage: step3.fundsUsage || '',
        aboutYou: step1,
        projectMeta: {
          category: step2.projectCategory || '',
          stage: step2.projectStage || '',
          techStack: step2.techStack,
          githubRepoUrl: step2.githubRepoUrl || '',
          shortDescription: step2.shortDescription || '',
        },
        projectRepo: step2.githubRepoUrl || undefined,
        demoUrl: step1.linkedinUrl || undefined,
      };

      const result = await onSubmit(payload);
      if (!result.success) {
        setError(result.error || 'Failed to submit proposal');
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    // reset state
    setStep(0);
    setDir(1);
    setSubmitting(false);
    setSubmitted(false);
    setAgreed(false);
    setError(null);
    setStep1({ ...defaultStep1, email: initialEmail || '', fullName: initialName || '' });
    setStep2(defaultStep2);
    setStep3(defaultStep3);
    sessionStorage.removeItem('proposalDraft');
    onClose();
  };

  if (!open) return null;

  const progress = ((step + 1) / 4) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl border border-white/6 bg-[#12172B] shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* header */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-0.5">
                Step {step + 1} of 4
              </p>
              <h2 className="text-base font-semibold text-slate-100">{stepTitles[step]}</h2>
            </div>
            <button
              onClick={handleClose}
              className="size-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* progress bar */}
          <div className="h-1 rounded-full bg-[#1E2340] overflow-hidden mb-5">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-[#7C3AED] to-[#A855F7]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <Step1AboutYou data={step1} onChange={setStep1} />}
              {step === 1 && <Step2YourProject data={step2} onChange={setStep2} />}
              {step === 2 && <Step3Funding data={step3} onChange={setStep3} />}
              {step === 3 && (
                <Step4Review
                  step1={step1}
                  step2={step2}
                  step3={step3}
                  agreed={agreed}
                  onAgreeChange={setAgreed}
                  submitted={submitted}
                  onGoToProposals={() => {
                    onViewProposals();
                    handleClose();
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && <p className="px-6 pb-2 text-xs text-red-400">{error}</p>}

        {/* footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-white/6 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={goBack}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              {step < 3 ? (
                <>
                  <button
                    onClick={goNext}
                    className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-sm font-medium text-white hover:bg-[#6D28D9] transition"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('proposalDraft', JSON.stringify({ step1, step2, step3 }));
                      setError('Draft saved in session.');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#A855F7] text-sm font-medium text-white hover:bg-[#9333EA] transition"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={!isCurrentStepValid() || submitting}
                    className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-sm font-medium text-white hover:bg-[#6D28D9] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting && (
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    Submit Proposal
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('proposalDraft', JSON.stringify({ step1, step2, step3 }));
                      setError('Draft saved in session.');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#A855F7] text-sm font-medium text-white hover:bg-[#9333EA] transition"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

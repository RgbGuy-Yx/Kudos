'use client';

import { useState } from 'react';

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

interface MilestoneReviewProps {
  milestones: MilestoneItem[];
  actionLoading: string | null;
  onApprove: (milestone: MilestoneItem) => Promise<void>;
  onReject: (milestone: MilestoneItem) => Promise<void>;
}

function badgeColor(status: MilestoneItem['status']) {
  if (status === 'approved') return 'bg-emerald-900/40 text-emerald-300 border-emerald-700';
  if (status === 'rejected') return 'bg-rose-900/40 text-rose-300 border-rose-700';
  if (status === 'submitted') return 'bg-amber-900/40 text-amber-300 border-amber-700';
  return 'bg-slate-800 text-slate-300 border-slate-700';
}

function label(status: MilestoneItem['status']) {
  if (status === 'submitted') return 'Submitted';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Not Submitted';
}

export default function MilestoneReview({ milestones, actionLoading, onApprove, onReject }: MilestoneReviewProps) {
  const [reviewingMilestone, setReviewingMilestone] = useState<MilestoneItem | null>(null);

  return (
    <section className="mt-5 space-y-3">
      <h3 className="text-2xl font-semibold tracking-tight text-white">Milestone Review</h3>

      <div className="grid gap-2.5">
        {milestones.map((milestone) => (
          <article key={milestone.id} className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-white">Milestone {milestone.milestoneIndex + 1}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{milestone.description || 'No description provided.'}</p>
                {milestone.proofLink || milestone.proofFileUrl ? (
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-slate-400">
                      Proof type: {milestone.proofType === 'file_upload' ? 'File Upload' : 'Link'}
                    </p>
                    <a
                      href={milestone.proofFileUrl || milestone.proofLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-purple-300 hover:text-purple-200"
                    >
                      {milestone.proofType === 'file_upload'
                        ? `Open uploaded file${milestone.proofFileName ? `: ${milestone.proofFileName}` : ''}`
                        : 'Open submission link'}
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No submission proof yet.</p>
                )}
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <span className={`rounded-full border px-2 py-1 text-xs ${badgeColor(milestone.status)}`}>
                  {label(milestone.status)}
                </span>

                {milestone.status === 'submitted' && (
                  <button
                    onClick={() => setReviewingMilestone(milestone)}
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {reviewingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-700/70 bg-slate-900/90 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-white">Review Milestone {reviewingMilestone.milestoneIndex + 1}</h4>
                <p className="mt-1 text-sm text-slate-300">Review submitted proof and choose approve or reject.</p>
              </div>
              <button
                onClick={() => setReviewingMilestone(null)}
                className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-slate-700/70 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-200">{reviewingMilestone.description || 'No description provided.'}</p>
              {reviewingMilestone.proofLink || reviewingMilestone.proofFileUrl ? (
                <a
                  href={reviewingMilestone.proofFileUrl || reviewingMilestone.proofLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-purple-300 hover:text-purple-200"
                >
                  {reviewingMilestone.proofType === 'file_upload'
                    ? `Open uploaded proof${reviewingMilestone.proofFileName ? `: ${reviewingMilestone.proofFileName}` : ''}`
                    : 'Open proof link'}
                </a>
              ) : (
                <p className="text-sm text-slate-500">No proof attached.</p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={async () => {
                  await onApprove(reviewingMilestone);
                  setReviewingMilestone(null);
                }}
                disabled={actionLoading === `approve-${reviewingMilestone.id}`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-slate-700"
              >
                {actionLoading === `approve-${reviewingMilestone.id}` ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={async () => {
                  await onReject(reviewingMilestone);
                  setReviewingMilestone(null);
                }}
                disabled={actionLoading === `reject-${reviewingMilestone.id}`}
                className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:bg-slate-700"
              >
                {actionLoading === `reject-${reviewingMilestone.id}` ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

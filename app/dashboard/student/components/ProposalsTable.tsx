'use client';

import { Eye, Pencil, FileText } from 'lucide-react';

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

interface ProposalsTableProps {
  proposals: Proposal[];
  loading: boolean;
  onEdit: (proposal: Proposal) => void;
  onOpenProposalModal: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  if (lower === 'approved' || lower === 'accepted') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
        Approved
      </span>
    );
  }
  if (lower === 'rejected') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-300">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-300">
      Pending
    </span>
  );
}

export default function ProposalsTable({
  proposals,
  loading,
  onEdit,
  onOpenProposalModal,
}: ProposalsTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/6 bg-[#12172B] p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED] mx-auto" />
        <p className="mt-3 text-sm text-slate-500">Loading proposals...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Submitted Proposals</h3>
        <span className="text-xs text-slate-500">{proposals.length} total</span>
      </div>

      {proposals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="size-14 rounded-full bg-white/5 inline-flex items-center justify-center">
            <FileText className="size-6 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400">No proposals yet</p>
          <button
            onClick={onOpenProposalModal}
            className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] transition"
          >
            Submit your first proposal
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/6 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4 font-medium">#</th>
                <th className="pb-3 pr-4 font-medium">Project Title</th>
                <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Submitted</th>
                <th className="pb-3 pr-4 font-medium">Funding</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {proposals.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b border-white/4 last:border-0 hover:bg-white/2 transition"
                >
                  <td className="py-3 pr-4 text-slate-500 font-mono text-xs">{idx + 1}</td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-white truncate max-w-55">{p.title}</p>
                  </td>
                  <td className="py-3 pr-4 hidden lg:table-cell text-xs text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs text-slate-300">
                      {p.expectedCost ?? 0} ALGO
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {p.githubLink && (
                        <a
                          href={p.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="size-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                          title="View repo"
                        >
                          <Eye className="size-4" />
                        </a>
                      )}
                      <button
                        onClick={() => onEdit(p)}
                        className="size-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

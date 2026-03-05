'use client';

import type { ActiveGrantProjectRow } from '@/lib/mock-data/sponsor-dashboard';
import { MoreHorizontal, Star } from 'lucide-react';

interface GrantProjectsTableProps {
  rows: ActiveGrantProjectRow[];
}

const statusStyles: Record<ActiveGrantProjectRow['status'], string> = {
  Active: 'bg-purple-500/20 text-purple-300',
  'Under Review': 'bg-amber-500/20 text-amber-300',
  Completed: 'bg-green-500/20 text-green-300',
};

export default function GrantProjectsTable({ rows }: GrantProjectsTableProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12172B] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#F1F5F9]">Active Grant Projects</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="border-b border-white/10 px-3 py-2 font-medium">ID</th>
              <th className="border-b border-white/10 px-3 py-2 font-medium">Project Name</th>
              <th className="border-b border-white/10 px-3 py-2 font-medium">Student</th>
              <th className="border-b border-white/10 px-3 py-2 font-medium">Current Milestone</th>
              <th className="border-b border-white/10 px-3 py-2 font-medium">Funded (ALGO)</th>
              <th className="border-b border-white/10 px-3 py-2 font-medium">Status</th>
              <th className="border-b border-white/10 px-3 py-2 font-medium">Rating</th>
              <th className="border-b border-white/10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-200">
                <td className="border-b border-white/5 px-3 py-3 text-xs text-slate-300">{row.id}</td>
                <td className="border-b border-white/5 px-3 py-3 text-[#F1F5F9]">{row.projectName}</td>
                <td className="border-b border-white/5 px-3 py-3">{row.student}</td>
                <td className="border-b border-white/5 px-3 py-3">{row.currentMilestone}</td>
                <td className="border-b border-white/5 px-3 py-3">{row.fundedAlgo.toFixed(2)}</td>
                <td className="border-b border-white/5 px-3 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusStyles[row.status]}`}>
                    {row.status}
                  </span>
                </td>
                <td className="border-b border-white/5 px-3 py-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={`${row.id}-${index}`}
                        size={14}
                        className={index < row.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                      />
                    ))}
                  </div>
                </td>
                <td className="border-b border-white/5 px-3 py-3 text-right">
                  <details className="relative inline-block">
                    <summary className="list-none cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
                      <MoreHorizontal size={16} />
                    </summary>
                    <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-white/10 bg-[#12172B] p-1 text-left shadow-lg">
                      <button className="block w-full rounded px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800/80">View</button>
                      <button className="block w-full rounded px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800/80">Approve Milestone</button>
                      <button className="block w-full rounded px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800/80">Release Funds</button>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

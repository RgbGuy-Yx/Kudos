'use client';

import type { CompletedGrantsPoint } from '@/lib/mock-data/sponsor-dashboard';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface CompletedGrantsChartProps {
  data: CompletedGrantsPoint[];
  totalCount: number;
}

export default function CompletedGrantsChart({ data, totalCount }: CompletedGrantsChartProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12172B] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Completed Grants</p>
        <p className="text-2xl font-semibold text-[#F1F5F9]">{totalCount}</p>
      </div>
      <p className="mt-1 text-xs text-[#64748B]">Last 6 months performance</p>

      <div className="mt-4 h-64 rounded-lg border border-white/10 bg-transparent p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12172B',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F1F5F9',
                borderRadius: 10,
              }}
            />
            <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client';

import type { DisbursedPoint } from '@/lib/mock-data/sponsor-dashboard';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DisbursedLineChartProps {
  data: DisbursedPoint[];
}

export default function DisbursedLineChart({ data }: DisbursedLineChartProps) {
  const latest = data.at(-1)?.amount ?? 0;

  return (
    <div className="rounded-xl border border-white/10 bg-[#12172B] p-4 md:p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">Total Disbursed</p>
      <p className="mt-1 text-xs text-[#64748B]">Last 6 months</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-[#F1F5F9]">{latest.toFixed(1)} ALGO</p>
        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400">
          +24.4% vs. last period
        </span>
      </div>

      <div className="mt-4 h-64 rounded-lg border border-white/10 bg-transparent p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="kudosDisbursedArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              formatter={(value) => {
                const amount = typeof value === 'number' ? value : Number(value ?? 0);
                return [`${amount.toFixed(2)} ALGO`, 'Disbursed'];
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#7C3AED"
              strokeWidth={2.5}
              fill="url(#kudosDisbursedArea)"
              dot={{ r: 3, stroke: '#7C3AED', fill: '#7C3AED' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { mockOpenGrants } from '@/lib/mock-data/student-dashboard';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#7C3AED', '#A855F7', '#22C55E', '#F59E0B', '#38BDF8', '#EF4444'];

export default function OpenGrantsFeed() {
  const budgetData = useMemo(
    () =>
      mockOpenGrants.map((grant) => ({
        name: grant.title.length > 14 ? `${grant.title.slice(0, 14)}…` : grant.title,
        budget: grant.budgetAlgo,
      })),
    [],
  );

  const skillFrequencyData = useMemo(() => {
    const freq = new Map<string, number>();
    mockOpenGrants.forEach((grant) => {
      grant.skills.forEach((skill) => {
        freq.set(skill, (freq.get(skill) || 0) + 1);
      });
    });

    return Array.from(freq.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, []);

  const totalOpenBudget = useMemo(
    () => mockOpenGrants.reduce((sum, grant) => sum + grant.budgetAlgo, 0),
    [],
  );

  const topGrant = useMemo(() => {
    if (mockOpenGrants.length === 0) return null;
    return mockOpenGrants.reduce((max, grant) => (grant.budgetAlgo > max.budgetAlgo ? grant : max));
  }, []);

  return (
    <div className="rounded-2xl border border-white/6 bg-[#12172B] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Open Grants</h3>
        <span className="text-xs text-slate-500">{mockOpenGrants.length} opportunities</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/6 bg-[#0B0F1E] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Total Budget</p>
          <p className="text-sm font-semibold text-purple-300 mt-0.5">{totalOpenBudget.toFixed(1)} ALGO</p>
        </div>
        <div className="rounded-lg border border-white/6 bg-[#0B0F1E] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Highest Grant</p>
          <p className="text-sm font-semibold text-emerald-300 mt-0.5">
            {topGrant ? `${topGrant.budgetAlgo.toFixed(1)} ALGO` : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-3">
          <p className="text-xs text-slate-400 mb-2">Budget Distribution (ALGO)</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData} margin={{ top: 8, right: 8, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={45}
                  fontSize={10}
                />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F1E',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  labelStyle={{ color: '#CBD5E1' }}
                  formatter={(value: number | string | undefined) => [`${Number(value ?? 0)} ALGO`, 'Budget']}
                />
                <Bar dataKey="budget" radius={[8, 8, 0, 0]}>
                  {budgetData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="budget" position="top" fill="#94A3B8" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/6 bg-[#0B0F1E] p-3">
          <p className="text-xs text-slate-400 mb-2">Top Skill Demand</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={skillFrequencyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={72}
                  paddingAngle={3}
                >
                  {skillFrequencyData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F1E',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number | string | undefined) => [`${Number(value ?? 0)} grants`, 'Mentions']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {skillFrequencyData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-500">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

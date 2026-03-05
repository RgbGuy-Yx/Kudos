'use client';

import { Plus, Trash2 } from 'lucide-react';

export interface MilestoneRow {
  title: string;
  amount: string;
  targetDate: string;
}

interface Step3Data {
  expectedCost: string;
  expectedTimeline: string;
  milestones: MilestoneRow[];
  fundsUsage: string;
}

interface Step3Props {
  data: Step3Data;
  onChange: (d: Step3Data) => void;
}

const label = 'block text-xs font-medium text-slate-400 mb-1.5';
const input =
  'w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition';
const select =
  'w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition appearance-none';
const textarea =
  'w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition resize-none';

const timelines = ['2 weeks', '1 month', '2 months', '3 months', '6 months'];

export default function Step3Funding({ data, onChange }: Step3Props) {
  const set = (field: keyof Step3Data, val: string | MilestoneRow[]) =>
    onChange({ ...data, [field]: val });

  const updateMilestone = (idx: number, field: keyof MilestoneRow, val: string) => {
    const updated = [...data.milestones];
    updated[idx] = { ...updated[idx], [field]: val };
    set('milestones', updated);
  };

  const addMilestone = () => {
    if (data.milestones.length >= 5) return;
    set('milestones', [...data.milestones, { title: '', amount: '', targetDate: '' }]);
  };

  const removeMilestone = (idx: number) => {
    set('milestones', data.milestones.filter((_, i) => i !== idx));
  };

  const allocated = data.milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const total = Number(data.expectedCost) || 0;
  const allocationColor =
    total > 0 && Math.abs(allocated - total) < 0.001
      ? 'text-emerald-400'
      : allocated > total
        ? 'text-red-400'
        : 'text-amber-400';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Expected Cost (ALGO) *</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              className={`${input} pr-16`}
              placeholder="0.00"
              value={data.expectedCost}
              onChange={(e) => set('expectedCost', e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
              ALGO
            </span>
          </div>
        </div>
        <div>
          <label className={label}>Expected Timeline *</label>
          <select className={select} value={data.expectedTimeline} onChange={(e) => set('expectedTimeline', e.target.value)}>
            <option value="">Select...</option>
            {timelines.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Milestone builder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={label}>Milestone Breakdown</label>
          <span className={`text-xs font-mono ${allocationColor}`}>
            Allocated: {allocated.toFixed(1)} / {total.toFixed(1)} ALGO
          </span>
        </div>

        <div className="space-y-3">
          {data.milestones.map((ms, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  className={input}
                  placeholder={`Milestone ${idx + 1} title`}
                  value={ms.title}
                  onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                />
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className={`${input} pr-14`}
                    placeholder="ALGO"
                    value={ms.amount}
                    onChange={(e) => updateMilestone(idx, 'amount', e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                    ALGO
                  </span>
                </div>
                <input
                  type="date"
                  className={input}
                  value={ms.targetDate}
                  onChange={(e) => updateMilestone(idx, 'targetDate', e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeMilestone(idx)}
                disabled={data.milestones.length <= 1}
                className="mt-1.5 size-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        {data.milestones.length < 5 && (
          <button
            type="button"
            onClick={addMilestone}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#7C3AED] hover:text-purple-300 transition"
          >
            <Plus className="size-3.5" />
            Add Milestone
          </button>
        )}
      </div>

      <div>
        <label className={label}>How will funds be used?</label>
        <textarea
          className={textarea}
          rows={3}
          placeholder="Describe how the ALGO funds will be allocated..."
          value={data.fundsUsage}
          onChange={(e) => set('fundsUsage', e.target.value)}
        />
      </div>
    </div>
  );
}

export type { Step3Data };

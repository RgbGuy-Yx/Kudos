'use client';

import type { SponsorKpiItem } from '@/lib/mock-data/sponsor-dashboard';

interface KpiCardsProps {
  items: SponsorKpiItem[];
}

export default function KpiCards({ items }: KpiCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#12172B] px-4 py-3"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#7C3AED]" />
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#7C3AED]/35" />

            <div className="flex items-start justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
              <Icon size={16} className="text-[#7C3AED]" />
            </div>

            <p className="mt-2 text-2xl font-semibold text-[#F1F5F9]">{item.value}</p>

            <span
              className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                item.positive
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {item.delta}
            </span>
          </div>
        );
      })}
    </div>
  );
}

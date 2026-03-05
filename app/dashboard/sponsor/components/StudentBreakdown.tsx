'use client';

import type { StudentBreakdownItem } from '@/lib/mock-data/sponsor-dashboard';

interface StudentBreakdownProps {
  items: StudentBreakdownItem[];
}

export default function StudentBreakdown({ items }: StudentBreakdownProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12172B] p-4 md:p-5">
      <p className="text-sm font-semibold text-[#F1F5F9]">Students Funded by Category</p>

      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#F1F5F9]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
              <span className="text-slate-300">{item.count.toLocaleString()}</span>
            </div>

            <div className={`mt-2 h-2.5 w-full overflow-hidden rounded-full ${item.track}`}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.progress}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

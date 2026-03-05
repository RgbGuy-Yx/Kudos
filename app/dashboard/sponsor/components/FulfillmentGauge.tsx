'use client';

import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

interface FulfillmentGaugeProps {
  value: number;
  onShowDetails: () => void;
}

export default function FulfillmentGauge({ value, onShowDetails }: FulfillmentGaugeProps) {
  const chartData = [{ name: 'fulfillment', value, fill: '#7C3AED' }];

  return (
    <div className="rounded-xl border border-white/10 bg-[#12172B] p-4 md:p-5">
      <p className="text-sm font-semibold text-[#F1F5F9]">Grant Fulfillment Rate</p>

      <div className="relative mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="68%"
            outerRadius="95%"
            data={chartData}
            startAngle={210}
            endAngle={-30}
            barSize={16}
          >
            <RadialBar background={{ fill: '#1E2340' }} dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-[#F1F5F9]">{value}%</p>
          <p className="mt-1 text-xs text-[#64748B]">On track for 80% target</p>
        </div>
      </div>

      <button
        onClick={onShowDetails}
        className="text-sm font-medium text-[#7C3AED] transition hover:text-purple-300"
      >
        Show details
      </button>
    </div>
  );
}

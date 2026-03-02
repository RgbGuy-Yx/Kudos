"use client";

import SectionTitle from "@/components/SectionTitle";
import { CircleCheckBigIcon, FilePenLineIcon, HandCoinsIcon } from "lucide-react";

export default function Pricing() {
  const steps = [
    {
      title: "Create grant and milestones",
      description:
        "Sponsors define total funding, split it into clear milestones, and assign expected deliverables.",
      icon: FilePenLineIcon,
    },
    {
      title: "Students submit proof",
      description:
        "Students upload milestone evidence for review so progress is documented and transparent.",
      icon: CircleCheckBigIcon,
    },
    {
      title: "Release payouts from escrow",
      description:
        "Once approved, milestone funds are released from escrow to the student with on-chain traceability.",
      icon: HandCoinsIcon,
    },
  ];

  return (
    <div id="how-it-works" className="relative">
      <SectionTitle
        text1="HOW IT WORKS"
        text2="From funding setup to milestone payouts"
        text3="A simple three-step flow for transparent sponsor-student grant execution."
      />

      <div className="flex flex-wrap items-stretch justify-center gap-6 mt-16 px-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="p-6 rounded-2xl max-w-90 w-full bg-white/50 dark:bg-gray-800/50 border border-slate-200 dark:border-slate-800"
          >
            <div className="size-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <step.icon size={22} className="text-purple-600" />
            </div>
            <p className="text-sm text-purple-600 font-medium mt-5">Step {index + 1}</p>
            <h3 className="text-xl font-semibold mt-2">{step.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 mt-3">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

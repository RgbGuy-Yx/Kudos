import { CircleCheckBigIcon, ShieldCheckIcon, SparklesIcon, WorkflowIcon } from "lucide-react";

const steps = [
    {
        title: "Sponsor sets the grant",
        description:
            "Define total funding and milestone count in minutes.",
    },
    {
        title: "Funds lock in escrow",
        description:
            "Capital stays protected until each milestone is approved.",
    },
    {
        title: "Student submits proof",
        description:
            "Deliverables and links are shared for clear sponsor review.",
    },
    {
        title: "Approve and release",
        description:
            "Approved milestones trigger transparent, on-chain payouts.",
    },
];

export default function PricingSection() {
    return (
        <section id="how-it-works" className="flex flex-col md:flex-row gap-14 items-start justify-between max-w-7xl mx-auto mt-32 px-4">
            <div className="max-w-sm">
                <h3 className="font-domine text-3xl">HOW IT WORKS</h3>
                <p className="mt-4 text-sm/6 text-gray-500">From pledge to payout, every step is simple, secure, and proof-driven.</p>
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-gray-500">
                        <div className="p-2.5 border border-gray-200 rounded-md">
                            <SparklesIcon className="size-5" />
                        </div>
                        <p>Fast setup for sponsors and students</p>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                        <div className="p-2.5 border border-gray-200 rounded-md">
                            <WorkflowIcon className="size-5" />
                        </div>
                        <p>Clear milestone-by-milestone workflow</p>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                        <div className="p-2.5 border border-gray-200 rounded-md">
                            <ShieldCheckIcon className="size-5" />
                        </div>
                        <p>Escrow-backed release protection</p>
                    </div>
                </div>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {steps.map((step, index) => (
                    <div key={step.title} className="bg-white border border-slate-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 text-gray-800">
                            <CircleCheckBigIcon className="size-5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Step {index + 1}</span>
                        </div>
                        <h4 className="mt-3 text-lg font-semibold text-gray-900">{step.title}</h4>
                        <p className="mt-2 text-sm/6 text-gray-500">{step.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
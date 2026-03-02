import { ChartSplineIcon, LayoutPanelTopIcon, NotebookPenIcon } from "lucide-react";

interface Feature {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
}

export default function FeaturesSection() {

    const features: Feature[] = [
        {
            icon: LayoutPanelTopIcon,
            title: "Escrow-First Grant Design",
            description: "Create grants where sponsor funds stay in escrow until milestone conditions are approved.",
        },
        {
            icon: NotebookPenIcon,
            title: "Proof-Driven Milestones",
            description: "Students submit proof links and descriptions for each milestone to build a verifiable review trail.",
        },
        {
            icon: ChartSplineIcon,
            title: "Real-Time Contract State",
            description: "Track escrow balance, milestone index, and grant status directly from Algorand global state.",
        },
    ];
    return (
        <div id="features" className="grid border mt-42 rounded-lg max-w-6xl mx-auto border-gray-200/70 grid-cols-1 divide-y divide-gray-200/70 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {features.map((item, index) => (
                <div key={index} className="flex flex-col items-start gap-4 hover:bg-gray-50 transition duration-300 p-8 pb-14">
                    <div className="flex items-center gap-2 text-gray-500">
                        <item.icon className="size-5" />
                        <h2 className="font-medium text-base">{item.title}</h2>
                    </div>
                    <p className="text-gray-500 text-sm/6 max-w-72">{item.description}</p>
                </div>
            ))}
        </div>
    );
}
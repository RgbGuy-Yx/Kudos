import { CheckIcon } from "lucide-react";

export const pricingData = [
  {
    title: "Starter",
    price: "Free",
    features: [
      { name: "1 active grant", icon: CheckIcon },
      { name: "Up to 3 milestones", icon: CheckIcon },
      { name: "Basic sponsor/student dashboards", icon: CheckIcon },
      { name: "Wallet connection", icon: CheckIcon },
    ],
    buttonText: "Start Free",
  },
  {
    title: "Growth",
    price: "$19",
    mostPopular: true,
    features: [
      { name: "Unlimited active grants", icon: CheckIcon },
      { name: "Milestone review workflows", icon: CheckIcon },
      { name: "Approval/rejection notifications", icon: CheckIcon },
      { name: "Escrow release tracking", icon: CheckIcon },
      { name: "Priority support", icon: CheckIcon },
    ],
    buttonText: "Upgrade",
  },
  {
    title: "Institution",
    price: "$99",
    features: [
      { name: "Multi-sponsor management", icon: CheckIcon },
      { name: "University/team onboarding", icon: CheckIcon },
      { name: "Audit-ready activity logs", icon: CheckIcon },
      { name: "Dedicated support", icon: CheckIcon },
    ],
    buttonText: "Contact Sales",
  },
];

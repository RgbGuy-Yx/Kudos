import {
  ShieldCheckIcon,
  MilestoneIcon,
  WalletIcon,
  EyeIcon,
} from "lucide-react";

export const featuresData = [
  {
    icon: ShieldCheckIcon,
    title: "Escrow-first grants",
    description:
      "Funds stay locked in Algorand smart contracts until milestone conditions are met and approved.",
  },
  {
    icon: MilestoneIcon,
    title: "Proof-driven milestones",
    description:
      "Students submit proof links for each milestone, creating a verifiable approval trail.",
  },
  {
    icon: WalletIcon,
    title: "Pera Wallet integration",
    description:
      "One-click wallet connection for sponsors and students to sign transactions securely.",
  },
  {
    icon: EyeIcon,
    title: "Real-time transparency",
    description:
      "Track escrow balance, milestone progress, and grant status directly from on-chain state.",
  },
];

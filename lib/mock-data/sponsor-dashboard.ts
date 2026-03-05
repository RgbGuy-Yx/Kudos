import {
  BarChart2,
  CheckCircle,
  FolderOpen,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type SponsorKpiItem = {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: LucideIcon;
};

export type DisbursedPoint = {
  month: string;
  amount: number;
};

export type CompletedGrantsPoint = {
  month: string;
  count: number;
};

export type StudentBreakdownItem = {
  label: string;
  count: number;
  color: string;
  track: string;
  progress: number;
};

export type ActiveGrantProjectRow = {
  id: string;
  projectName: string;
  student: string;
  currentMilestone: string;
  fundedAlgo: number;
  status: 'Active' | 'Under Review' | 'Completed';
  rating: number;
};

export const buildSponsorKpis = (params: {
  hasActiveGrant: boolean;
  projectsCount: number;
  milestoneProgress: string;
  escrowBalance: string;
}): SponsorKpiItem[] => [
  {
    label: 'Active Grant',
    value: params.hasActiveGrant ? '1' : '0',
    delta: '+12% vs last month',
    positive: true,
    icon: Wallet,
  },
  {
    label: 'Open Projects',
    value: String(params.projectsCount),
    delta: '+6.8% vs last month',
    positive: true,
    icon: FolderOpen,
  },
  {
    label: 'Milestone Progress',
    value: params.milestoneProgress,
    delta: '-2.3% vs last month',
    positive: false,
    icon: CheckCircle,
  },
  {
    label: 'Escrow Balance',
    value: params.escrowBalance,
    delta: '+18.1% vs last month',
    positive: true,
    icon: BarChart2,
  },
];

export const disbursedTrend: DisbursedPoint[] = [
  { month: 'Oct', amount: 0.08 },
  { month: 'Nov', amount: 0.11 },
  { month: 'Dec', amount: 0.19 },
  { month: 'Jan', amount: 0.28 },
  { month: 'Feb', amount: 0.44 },
  { month: 'Mar', amount: 0.6 },
];

export const studentFundingBreakdown: StudentBreakdownItem[] = [
  {
    label: 'Undergrad',
    count: 1284,
    color: '#7C3AED',
    track: 'bg-purple-500/20',
    progress: 72,
  },
  {
    label: 'Postgrad',
    count: 932,
    color: '#6366F1',
    track: 'bg-indigo-500/20',
    progress: 56,
  },
  {
    label: 'PhD',
    count: 421,
    color: '#F97316',
    track: 'bg-orange-500/20',
    progress: 34,
  },
];

export const grantFulfillmentRate = 72;

export const activeGrantProjectsRows: ActiveGrantProjectRow[] = [
  {
    id: 'KD-1021',
    projectName: 'Campus AI Research Assistant',
    student: 'Aarav Shah',
    currentMilestone: 'Milestone 2',
    fundedAlgo: 1.85,
    status: 'Active',
    rating: 4,
  },
  {
    id: 'KD-1034',
    projectName: 'Rural Telehealth Data Pipeline',
    student: 'Maya Iyer',
    currentMilestone: 'Milestone 1',
    fundedAlgo: 1.2,
    status: 'Under Review',
    rating: 3,
  },
  {
    id: 'KD-1040',
    projectName: 'Green Grid Energy Forecasting',
    student: 'Rohan Nair',
    currentMilestone: 'Milestone 3',
    fundedAlgo: 2.4,
    status: 'Active',
    rating: 5,
  },
  {
    id: 'KD-1058',
    projectName: 'FinLearn Wallet Literacy App',
    student: 'Siya Verma',
    currentMilestone: 'Final Review',
    fundedAlgo: 0.95,
    status: 'Completed',
    rating: 4,
  },
  {
    id: 'KD-1063',
    projectName: 'AgriYield Soil Intelligence Engine',
    student: 'Kabir Mehta',
    currentMilestone: 'Milestone 2',
    fundedAlgo: 1.63,
    status: 'Under Review',
    rating: 4,
  },
];

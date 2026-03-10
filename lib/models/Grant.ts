import { ObjectId } from 'mongodb';

export type ProjectStatus = 'OPEN' | 'IN_GRANT' | 'CLOSED';
export type GrantStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// Shared serialization helper
export function serializeGrant(grant: GrantDocument) {
  return {
    id: grant._id?.toString(),
    sponsorWallet: grant.sponsorWallet,
    studentWallet: grant.studentWallet,
    projectId: grant.projectId.toString(),
    projectTitle: grant.projectTitle,
    description: grant.description,
    githubLink: grant.githubLink,
    proposedBudget: grant.proposedBudget,
    appId: grant.appId,
    status: grant.status,
    milestoneIndex: grant.milestoneIndex,
    totalMilestones: grant.totalMilestones,
    escrowBalance: grant.escrowBalance,
    transactions: grant.transactions,
    createdAt: grant.createdAt,
    updatedAt: grant.updatedAt,
    completedAt: grant.completedAt,
  };
}

// Shared trust score clamping
export function clampTrustScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface ProposalMilestone {
  title: string;
  amount: number;
  targetDate: string;
}

export interface ProposalData {
  aboutYou?: {
    fullName?: string;
    email?: string;
    university?: string;
    degreeProgram?: string;
    yearOfStudy?: string;
    currentSemester?: string;
    graduationYear?: string;
    githubProfile?: string;
    linkedinUrl?: string;
  };
  project?: {
    category?: string;
    stage?: string;
    techStack?: string[];
    githubRepoUrl?: string;
    shortDescription?: string;
  };
  funding?: {
    expectedTimeline?: string;
    expectedCost?: number;
    fundsUsage?: string;
    milestones?: ProposalMilestone[];
  };
}

export interface ProjectDocument {
  _id?: ObjectId;
  title: string;
  description: string;
  abstract?: string;
  expectedDeliverables?: string;
  expectedTimeline?: string;
  expectedCost?: number;
  trustScore?: number;
  proposedBudget: number;
  studentWallet: string;
  githubLink: string;
  proposalData?: ProposalData;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrantTransaction {
  txId: string;
  type: 'CREATE_GRANT' | 'FUND_ESCROW' | 'APPROVE_MILESTONE' | 'EMERGENCY_CLAWBACK';
  createdAt: Date;
  amount?: number;
  milestoneIndex?: number;
}

export interface GrantDocument {
  _id?: ObjectId;
  sponsorWallet: string;
  studentWallet: string;
  projectId: ObjectId;
  projectTitle: string;
  description: string;
  githubLink: string;
  proposedBudget: number;
  appId: number;
  status: GrantStatus;
  milestoneIndex: number;
  totalMilestones: number;
  escrowBalance: number;
  transactions: GrantTransaction[];
  creationNotifiedToStudent?: boolean;
  creationNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

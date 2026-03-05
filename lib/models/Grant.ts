import { ObjectId } from 'mongodb';

export type ProjectStatus = 'OPEN' | 'IN_GRANT' | 'CLOSED';
export type GrantStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

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

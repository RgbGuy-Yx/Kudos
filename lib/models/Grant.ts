import { ObjectId } from 'mongodb';

export type ProjectStatus = 'OPEN' | 'IN_GRANT' | 'CLOSED';
export type GrantStatus = 'ACTIVE' | 'COMPLETED';

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
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrantTransaction {
  txId: string;
  type: 'CREATE_GRANT' | 'FUND_ESCROW' | 'APPROVE_MILESTONE';
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

import { ObjectId } from 'mongodb';

export interface MilestoneSubmission {
  _id?: ObjectId;
  appId: number;
  milestoneIndex: number;
  studentAddress: string;
  proofLink?: string;
  proofFileUrl?: string;
  proofFileName?: string;
  proofFileMimeType?: string;
  proofType: 'github_link' | 'file_upload';
  description: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  rejectedReason?: string;
  reviewTxId?: string;
}

// Indexes for efficient queries
export const milestoneIndexes = [
  { key: { appId: 1, milestoneIndex: 1 }, unique: true },
  { key: { studentAddress: 1 } },
  { key: { status: 1 } },
  { key: { submittedAt: -1 } },
];

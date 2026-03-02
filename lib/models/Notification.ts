import { ObjectId } from 'mongodb';

export type NotificationType =
  | 'MILESTONE_REJECTED'
  | 'MILESTONE_APPROVED'
  | 'GRANT_CREATED';

export interface NotificationDocument {
  _id?: ObjectId;
  userWallet: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: {
    appId?: number;
    milestoneIndex?: number;
    submissionId?: string;
  };
  read: boolean;
  createdAt: Date;
}

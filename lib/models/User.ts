import { ObjectId } from 'mongodb';
import { UserRole } from '../types';

export interface UserDocument {
  _id?: ObjectId;
  walletAddress: string;
  role: UserRole;
  name?: string;
  email?: string;
  organization?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const userIndexes = [
  { key: { walletAddress: 1 }, unique: true },
  { key: { email: 1 }, sparse: true },
];

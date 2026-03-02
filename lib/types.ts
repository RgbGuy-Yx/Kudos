export type UserRole = 'student' | 'sponsor';

export interface User {
  _id?: string;
  name: string;
  email: string;
  organization: string;
  role: UserRole;
  walletAddress: string;
  createdAt?: Date;
}

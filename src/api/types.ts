export type Role = 'admin' | 'voter';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  hasVoted: boolean;
  votedAt: string | null;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  isWriteIn: boolean;
  voteCount?: number;
}

export interface MyVote {
  candidate: Candidate;
  createdAt: string;
}

export interface Standing extends Candidate {
  votes: number;
}

export interface Results {
  totalVotes: number;
  participation: { eligible: number; voted: number };
  candidates: Standing[];
}

export interface Settings {
  locked: boolean;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  votedAt: string;
}

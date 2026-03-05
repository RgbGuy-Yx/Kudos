/* ── Mock data for student dashboard ── */

export interface OpenGrantItem {
  id: string;
  title: string;
  sponsor: string;
  budgetAlgo: number;
  deadline: string;
  skills: string[];
}

export const mockOpenGrants: OpenGrantItem[] = [
  {
    id: 'og-1',
    title: 'Decentralized Identity Verifier',
    sponsor: 'AlgoFoundation',
    budgetAlgo: 5.0,
    deadline: 'Apr 15, 2026',
    skills: ['Algorand SDK', 'React', 'TypeScript'],
  },
  {
    id: 'og-2',
    title: 'Carbon Credit Tracker on Algorand',
    sponsor: 'GreenDAO',
    budgetAlgo: 3.5,
    deadline: 'May 1, 2026',
    skills: ['Smart Contracts', 'Python', 'Next.js'],
  },
  {
    id: 'og-3',
    title: 'NFT-Based Academic Credentials',
    sponsor: 'EduChain Labs',
    budgetAlgo: 8.0,
    deadline: 'Jun 10, 2026',
    skills: ['ARC-19', 'IPFS', 'Node.js'],
  },
  {
    id: 'og-4',
    title: 'DAO Governance Voting Tool',
    sponsor: 'Web3Collective',
    budgetAlgo: 4.2,
    deadline: 'Apr 28, 2026',
    skills: ['Algorand', 'React', 'Tailwind'],
  },
];

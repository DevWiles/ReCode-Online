import type { SolutionData } from '@/types';

export interface ChallengeQuestion {
  // Progress id, also what the question page is keyed by
  id: string;
  pid: string;
  title: string;
  difficulty: string;
  url: string | null;
  slug: string | null;
  tags: string[];
  solutions: SolutionData[];
}

export type DrawResult =
  | { status: 'ok'; question: ChallengeQuestion; remaining: number }
  // Every eligible question has been drawn this run
  | { status: 'exhausted' }
  | { status: 'error' };

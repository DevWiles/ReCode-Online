import { SolutionData } from "@/types";

export interface ReviewTask {
  id: string;
  questionId: string;
  title: string;
  difficulty: string;
  url: string | null;
  slug: string | null;
  masteryLevel: number;
  lastReviewDate: string | null;
  tags?: string;
  submissions?: SolutionData[];
}

export type ReviewMode = 'today' | 'ahead';

export interface ReviewClientProps {
  initialReviews: ReviewTask[];
  mode?: ReviewMode;
  // How many of tomorrow's questions can be reviewed ahead (today mode only)
  aheadCount?: number;
}

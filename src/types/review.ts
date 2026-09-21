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

export interface ReviewClientProps {
  initialReviews: ReviewTask[];
}

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ReviewPageClient from '@/components/review/ReviewPageClient';
import { aheadWhere, dueTodayWhere, getReviewTasks } from '@/lib/review';

export default async function ReviewPage() {
  const user = await requireUser();

  const limit = user.dailyReviewLimit || 50;

  const [reviews, aheadCount] = await Promise.all([
    getReviewTasks(dueTodayWhere(user.id), limit),
    // Offered once today's queue is cleared
    prisma.progress.count({ where: aheadWhere(user.id) }),
  ]);

  return (
    <ReviewPageClient
      initialReviews={reviews}
      aheadCount={Math.min(aheadCount, limit)}
    />
  );
}

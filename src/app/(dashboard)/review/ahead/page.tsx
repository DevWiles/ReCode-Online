import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import ReviewPageClient from '@/components/review/ReviewPageClient';
import { aheadWhere, dueTodayWhere, getReviewTasks } from '@/lib/review';

export default async function ReviewAheadPage() {
  const user = await prisma.user.findFirst();
  if (!user) {
    redirect('/onboarding');
  }

  // Today's own queue comes first
  const dueToday = await prisma.progress.count({
    where: dueTodayWhere(user.id),
  });
  if (dueToday > 0) {
    redirect('/review');
  }

  // Only tomorrow's batch; once it's done the page stays empty instead of
  // pulling in the day after, so a good day doesn't turn into a grind
  const reviews = await getReviewTasks(
    aheadWhere(user.id),
    user.dailyReviewLimit || 50,
  );

  return <ReviewPageClient initialReviews={reviews} mode="ahead" />;
}

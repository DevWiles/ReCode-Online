import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getNextReviewDate } from '@/lib/utils';
import type { ReviewTask } from '@/types/review';

// Everything already due right now
export function dueTodayWhere(userId: string): Prisma.ProgressWhereInput {
  return {
    userId,
    status: { not: 'Todo' },
    nextReview: { lte: new Date() },
  };
}

// Tomorrow's queue, minus anything already touched today (e.g. a question
// failed today lands on tomorrow), so reviewing ahead can't loop back on itself
export function aheadWhere(userId: string): Prisma.ProgressWhereInput {
  return {
    userId,
    status: { not: 'Todo' },
    nextReview: { gt: new Date(), lt: getNextReviewDate(2) },
    OR: [{ lastReview: null }, { lastReview: { lt: getNextReviewDate(0) } }],
  };
}

export async function getReviewTasks(
  where: Prisma.ProgressWhereInput,
  limit: number,
): Promise<ReviewTask[]> {
  const rawReviews = await prisma.progress.findMany({
    where,
    include: {
      problem: true,
      submissions: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          label: true,
          language: true,
          code: true,
        },
      },
    },
    orderBy: {
      nextReview: 'asc',
    },
    // Limit the number of items loaded at one time
    take: limit,
  });

  return rawReviews.map((p) => ({
    id: p.id,
    questionId: p.problem.pid,
    title: p.problem.title,
    difficulty: p.problem.difficulty,
    url: p.problem.url,
    slug: p.problem.slug,
    masteryLevel: p.masteryLevel,
    // Format the date to avoid serialization issues
    lastReviewDate: p.lastReview
      ? p.lastReview.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : null,
    tags: p.problem.tags,
    submissions: p.submissions,
  }));
}

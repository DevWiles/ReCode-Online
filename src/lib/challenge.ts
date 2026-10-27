import { prisma } from '@/lib/db';
import type { ChallengeQuestion } from '@/types/challenge';

// A question qualifies once it has at least this many solutions
export const MIN_SOLUTIONS = 2;

// Progress ids of the user's questions that have several solutions. SQLite
// can't filter on a relation count, so count here; the pool is a few hundred
// rows at most
export async function multiSolutionIds(userId: string): Promise<string[]> {
  const rows = await prisma.progress.findMany({
    where: { userId },
    select: { id: true, _count: { select: { submissions: true } } },
  });
  return rows
    .filter((row) => row._count.submissions >= MIN_SOLUTIONS)
    .map((row) => row.id);
}

export async function loadChallengeQuestion(
  progressId: string,
): Promise<ChallengeQuestion | null> {
  const p = await prisma.progress.findUnique({
    where: { id: progressId },
    include: {
      problem: true,
      submissions: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, label: true, language: true, code: true },
      },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    pid: p.problem.pid,
    title: p.problem.title,
    difficulty: p.problem.difficulty,
    url: p.problem.url,
    tags: p.problem.tags.split(',').filter(Boolean),
    solutions: p.submissions,
  };
}

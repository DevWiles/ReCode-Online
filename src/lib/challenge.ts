import { prisma } from '@/lib/db';
import { getReviewTasks } from '@/lib/review';
import type { DrawResult } from '@/types/challenge';

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

// A random question from the pool that isn't in `seen`
export async function drawChallenge(
  userId: string,
  seen: string[],
): Promise<DrawResult> {
  const seenSet = new Set(seen);
  const pool = (await multiSolutionIds(userId)).filter(
    (id) => !seenSet.has(id),
  );
  if (pool.length === 0) return { status: 'exhausted' };

  const pick = pool[Math.floor(Math.random() * pool.length)];
  const [task] = await getReviewTasks({ id: pick, userId }, 1);
  if (!task) return { status: 'error' };

  return { status: 'ok', task, remaining: pool.length - 1 };
}

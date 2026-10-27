'use server';

import { getActiveUser } from '@/lib/auth';
import { loadChallengeQuestion, multiSolutionIds } from '@/lib/challenge';
import type { DrawResult } from '@/types/challenge';

/**
 * Draws a random multi-solution question the run hasn't seen yet. Read only:
 * the challenge never touches review scheduling.
 */
export async function drawChallengeAction(seen: string[]): Promise<DrawResult> {
  try {
    const user = await getActiveUser();
    if (!user) return { status: 'error' };

    const seenSet = new Set(seen);
    const pool = (await multiSolutionIds(user.id)).filter(
      (id) => !seenSet.has(id),
    );
    if (pool.length === 0) return { status: 'exhausted' };

    const pick = pool[Math.floor(Math.random() * pool.length)];
    const question = await loadChallengeQuestion(pick);
    if (!question) return { status: 'error' };

    return { status: 'ok', question, remaining: pool.length - 1 };
  } catch (error) {
    console.error('Challenge draw error:', error);
    return { status: 'error' };
  }
}

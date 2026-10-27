'use server';

import { getActiveUser } from '@/lib/auth';
import { drawChallenge } from '@/lib/challenge';
import type { DrawResult } from '@/types/challenge';

/**
 * Draws a random multi-solution question the run hasn't seen yet. Read only:
 * the challenge never touches review scheduling.
 */
export async function drawChallengeAction(seen: string[]): Promise<DrawResult> {
  try {
    const user = await getActiveUser();
    if (!user) return { status: 'error' };
    return await drawChallenge(user.id, seen);
  } catch (error) {
    console.error('Challenge draw error:', error);
    return { status: 'error' };
  }
}

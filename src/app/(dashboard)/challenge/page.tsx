import { requireUser } from '@/lib/auth';
import { multiSolutionIds } from '@/lib/challenge';
import ChallengeClient from '@/components/challenge/ChallengeClient';

export default async function ChallengePage() {
  const user = await requireUser();
  const pool = await multiSolutionIds(user.id);

  return <ChallengeClient userId={user.id} poolSize={pool.length} />;
}

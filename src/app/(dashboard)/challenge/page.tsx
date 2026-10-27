import { requireUser } from '@/lib/auth';
import { drawChallenge } from '@/lib/challenge';
import ChallengeClient from '@/components/challenge/ChallengeClient';

export default async function ChallengePage() {
  const user = await requireUser();
  // The first question comes with the page, like the review queue does
  const first = await drawChallenge(user.id, []);

  return (
    <ChallengeClient
      initialTask={first.status === 'ok' ? first.task : null}
      initialRemaining={first.status === 'ok' ? first.remaining : 0}
    />
  );
}

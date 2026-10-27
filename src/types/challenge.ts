import type { ReviewTask } from '@/types/review';

export type DrawResult =
  | { status: 'ok'; task: ReviewTask; remaining: number }
  // Every eligible question has been drawn this run
  | { status: 'exhausted' }
  | { status: 'error' };

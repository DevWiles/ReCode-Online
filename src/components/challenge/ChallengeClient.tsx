'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { drawChallengeAction } from '@/actions/challenge';
import { useTranslation } from '@/hooks/useTranslation';
import { containerVariants } from '@/animations/reviewAnimations';
import { Button } from '@/components/ui/button';
import { ReviewCard } from '@/components/review/ReviewCard';
import { QuestionPreviewModal } from '@/components/questions/QuestionPreviewModal';

import { Flame, Shuffle, Swords, Trophy } from 'lucide-react';

import type { QuestionRowData } from '@/types';
import type { ReviewTask } from '@/types/review';

interface RunStats {
  remembered: number;
  forgot: number;
  streak: number;
  bestStreak: number;
}

const EMPTY_STATS: RunStats = {
  remembered: 0,
  forgot: 0,
  streak: 0,
  bestStreak: 0,
};

const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{{${key}}}`, String(value)),
    text,
  );

export default function ChallengeClient({
  initialTask,
  initialRemaining,
}: {
  initialTask: ReviewTask | null;
  initialRemaining: number;
}) {
  const { t } = useTranslation();

  const [task, setTask] = useState<ReviewTask | null>(initialTask);
  const [seen, setSeen] = useState<string[]>(
    initialTask ? [initialTask.id] : [],
  );
  const [remaining, setRemaining] = useState(initialRemaining);
  const [stats, setStats] = useState<RunStats>(EMPTY_STATS);
  const [isActive, setIsActive] = useState(false);
  const [drawing, setDrawing] = useState(false);
  // Run over: ended by hand or the pool ran out
  const [ended, setEnded] = useState<'manual' | 'exhausted' | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Nothing qualifies at all, as opposed to a finished run
  const noPool = initialTask === null;
  const answered = stats.remembered + stats.forgot;

  const draw = async (seenSoFar: string[]) => {
    setDrawing(true);
    const result = await drawChallengeAction(seenSoFar);
    setDrawing(false);
    setIsActive(false);

    if (result.status === 'error') {
      toast.error(t('challenge.drawFailed'));
      return;
    }
    if (result.status === 'exhausted') {
      setTask(null);
      setEnded('exhausted');
      return;
    }
    setTask(result.task);
    setSeen([...seenSoFar, result.task.id]);
    setRemaining(result.remaining);
  };

  // 1 = remembered, 0 = forgot. Only the run's tally changes, never the
  // review schedule
  const handleRate = (score: number) => {
    const remembered = score === 1;
    const streak = remembered ? stats.streak + 1 : 0;
    setStats({
      remembered: stats.remembered + (remembered ? 1 : 0),
      forgot: stats.forgot + (remembered ? 0 : 1),
      streak,
      bestStreak: Math.max(stats.bestStreak, streak),
    });
    if (remembered && streak >= 3) {
      toast.success(fill(t('challenge.streakToast'), { count: streak }));
    }
    draw(seen);
  };

  const restart = () => {
    setStats(EMPTY_STATS);
    setEnded(null);
    draw([]);
  };

  const previewData: QuestionRowData | null = task && {
    id: task.id,
    status: 'Review',
    masteryLevel: task.masteryLevel,
    updatedAt: new Date(),
    problem: {
      id: '0',
      pid: task.questionId,
      title: task.title,
      difficulty: task.difficulty,
      tags: task.tags || '',
      url: task.url || '',
    },
    submissions: task.submissions || [],
  };

  return (
    <div className="relative min-h-screen w-full">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.7]"
        style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 md:space-y-12 pb-24 p-4 md:p-8 lg:p-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-[#ffa116] rounded-2xl shadow-sm border border-orange-100/50">
                <Swords size={40} strokeWidth={2.5} />
              </div>
              {t('challenge.title')}
            </h1>
            <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              {t('challenge.subtitle')}
            </p>
          </div>

          {!noPool && !ended && (
            <div
              data-testid="scoreboard"
              className="flex items-center gap-4 bg-white/80 backdrop-blur-md text-gray-600 px-5 py-2.5 rounded-2xl text-sm font-bold border border-gray-200/60 shadow-sm whitespace-nowrap"
            >
              <span>
                {t('challenge.remembered')}{' '}
                <span className="text-emerald-600" data-testid="remembered">
                  {stats.remembered}
                </span>
              </span>
              <span>
                {t('challenge.forgot')}{' '}
                <span className="text-rose-500" data-testid="forgot">
                  {stats.forgot}
                </span>
              </span>
              <span className="flex items-center gap-1" data-testid="streak">
                <Flame
                  size={16}
                  className={
                    stats.streak > 0 ? 'text-orange-500' : 'text-gray-300'
                  }
                />
                {stats.streak}
              </span>
              <span className="text-gray-400">
                {fill(t('challenge.left'), { count: remaining })}
              </span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {task && !ended ? (
            <motion.div
              key={task.id}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-4"
            >
              <ReviewCard
                task={task}
                binary
                isActive={isActive}
                isSubmitting={drawing}
                onActivate={() => setIsActive(true)}
                onCancel={() => setIsActive(false)}
                onRate={handleRate}
                onPreview={() => setIsPreviewOpen(true)}
              />
              <div className="flex items-center justify-end gap-2">
                {!isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => draw(seen)}
                    disabled={drawing}
                    className="text-gray-400 hover:text-gray-900 rounded-xl gap-1.5"
                  >
                    <Shuffle size={14} /> {t('challenge.skip')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEnded('manual')}
                  disabled={drawing}
                  className="text-gray-400 hover:text-gray-900 rounded-xl"
                >
                  {t('challenge.end')}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              data-testid="summary"
              className="flex flex-col items-center justify-center text-center gap-6 py-16 px-6 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm"
            >
              {noPool && !ended ? (
                <>
                  <Swords size={44} className="text-gray-300" />
                  <div className="space-y-2">
                    <p className="text-2xl font-extrabold text-gray-900">
                      {t('challenge.emptyTitle')}
                    </p>
                    <p className="text-gray-500 max-w-md">
                      {t('challenge.emptyDescription')}
                    </p>
                  </div>
                  <Link href="/questions">
                    <Button className="h-12 px-6 rounded-2xl bg-gray-900 hover:bg-black font-bold">
                      {t('challenge.goQuestions')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Trophy size={44} className="text-amber-500" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-wider text-gray-400">
                      {ended === 'exhausted'
                        ? t('challenge.allDone')
                        : t('challenge.runOver')}
                    </p>
                    <p className="text-5xl font-black text-gray-900">
                      {answered
                        ? `${Math.round((stats.remembered / answered) * 100)}%`
                        : '—'}
                    </p>
                    <p className="text-sm font-semibold text-gray-400">
                      {t('challenge.rememberRate')}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                    <SummaryCell
                      label={t('challenge.remembered')}
                      value={stats.remembered}
                    />
                    <SummaryCell
                      label={t('challenge.forgot')}
                      value={stats.forgot}
                    />
                    <SummaryCell
                      label={t('challenge.bestStreak')}
                      value={stats.bestStreak}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={restart}
                      disabled={drawing}
                      className="h-12 px-8 rounded-2xl bg-[#ffa116] hover:bg-[#f59e0b] text-white font-extrabold"
                    >
                      {t('challenge.again')}
                    </Button>
                    <Link href="/home">
                      <Button
                        variant="ghost"
                        className="h-12 px-6 rounded-2xl text-gray-500"
                      >
                        {t('common.backHome')}
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {previewData && (
        <QuestionPreviewModal
          isOpen={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          data={previewData}
        />
      )}
    </div>
  );
}

const SummaryCell = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl bg-white border border-gray-100 px-4 py-4">
    <p className="text-xs font-bold text-gray-400">{label}</p>
    <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
  </div>
);

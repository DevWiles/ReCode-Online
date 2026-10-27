'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import 'highlight.js/styles/github-dark.css';

import { drawChallengeAction } from '@/actions/challenge';
import { useTranslation } from '@/hooks/useTranslation';
import { getDifficultyColor } from '@/hooks';
import { cn, getLeetCodeUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Check,
  Code2,
  ExternalLink,
  Flame,
  Shuffle,
  Swords,
  Trophy,
  X,
} from 'lucide-react';

import type { ChallengeQuestion } from '@/types/challenge';

// Solved on LeetCode without / after peeking at the saved code
const POINTS_COLD = 100;
const POINTS_HINTED = 50;
// Per step of the perfect-round streak
const STREAK_BONUS = 50;

type Verdict = 'got' | 'missed';

interface Slot {
  // Looked at the saved code before judging, which halves the points
  peeked: boolean;
  showCode: boolean;
  verdict: Verdict | null;
}

interface RunStats {
  score: number;
  rounds: number;
  recalled: number;
  total: number;
  perfect: number;
  streak: number;
  bestStreak: number;
}

const EMPTY_STATS: RunStats = {
  score: 0,
  rounds: 0,
  recalled: 0,
  total: 0,
  perfect: 0,
  streak: 0,
  bestStreak: 0,
};

const slotPoints = (slot: Slot) =>
  slot.verdict === 'got' ? (slot.peeked ? POINTS_HINTED : POINTS_COLD) : 0;

const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{{${key}}}`, String(value)),
    text,
  );

// Best score lives in this browser only, keyed per account
const bestKey = (userId: string) => `recode:challenge-best:${userId}`;

const readBest = (userId: string) => {
  try {
    return Number(localStorage.getItem(bestKey(userId))) || 0;
  } catch {
    return 0;
  }
};

const subscribeStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};

const writeBest = (userId: string, score: number) => {
  try {
    localStorage.setItem(bestKey(userId), String(score));
  } catch {}
};

export default function ChallengeClient({
  userId,
  poolSize,
}: {
  userId: string;
  poolSize: number;
}) {
  const { t } = useTranslation();

  const [phase, setPhase] = useState<'start' | 'playing' | 'summary'>('start');
  const [question, setQuestion] = useState<ChallengeQuestion | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [remaining, setRemaining] = useState(poolSize);
  const [stats, setStats] = useState<RunStats>(EMPTY_STATS);
  const [roundBonus, setRoundBonus] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  // Read after hydration (the server has no localStorage); a record set in
  // this tab doesn't fire a storage event, so it is tracked locally too
  const storedBest = useSyncExternalStore(
    subscribeStorage,
    () => readBest(userId),
    () => 0,
  );
  const [runBest, setRunBest] = useState(0);
  const best = Math.max(storedBest, runBest);
  const [newRecord, setNewRecord] = useState(false);

  const roundDone =
    slots.length > 0 && slots.every((slot) => slot.verdict !== null);
  const roundTouched = slots.some((slot) => slot.peeked || slot.verdict !== null);
  const roundScore = slots.reduce((sum, slot) => sum + slotPoints(slot), 0);

  const draw = async (seenSoFar: string[], stats: RunStats) => {
    setDrawing(true);
    const result = await drawChallengeAction(seenSoFar);
    setDrawing(false);

    if (result.status === 'error') {
      toast.error(t('challenge.drawFailed'));
      return;
    }
    if (result.status === 'exhausted') {
      setExhausted(true);
      finish(stats);
      return;
    }

    setQuestion(result.question);
    setSlots(
      result.question.solutions.map(() => ({
        peeked: false,
        showCode: false,
        verdict: null,
      })),
    );
    setSeen([...seenSoFar, result.question.id]);
    setRemaining(result.remaining);
    setRoundBonus(0);
    setPhase('playing');
  };

  const start = () => {
    setStats(EMPTY_STATS);
    setSeen([]);
    setExhausted(false);
    setNewRecord(false);
    draw([], EMPTY_STATS);
  };

  const finish = (final: RunStats) => {
    if (final.score > best) {
      writeBest(userId, final.score);
      setRunBest(final.score);
      setNewRecord(true);
    }
    setPhase('summary');
  };

  const next = () => {
    if (remaining > 0) return draw(seen, stats);
    setExhausted(true);
    finish(stats);
  };

  const updateSlot = (index: number, patch: Partial<Slot>) => {
    const updated = slots.map((slot, i) =>
      i === index ? { ...slot, ...patch } : slot,
    );
    setSlots(updated);

    // The last verdict closes the round and banks its points
    if (!updated.every((slot) => slot.verdict !== null)) return;
    const recalled = updated.filter((slot) => slot.verdict === 'got').length;
    const perfect = recalled === updated.length;
    const streak = perfect ? stats.streak + 1 : 0;
    const bonus = perfect ? STREAK_BONUS * streak : 0;
    setRoundBonus(bonus);
    setStats({
      score:
        stats.score +
        updated.reduce((sum, slot) => sum + slotPoints(slot), 0) +
        bonus,
      rounds: stats.rounds + 1,
      recalled: stats.recalled + recalled,
      total: stats.total + updated.length,
      perfect: stats.perfect + (perfect ? 1 : 0),
      streak,
      bestStreak: Math.max(stats.bestStreak, streak),
    });
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

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 pb-24 p-4 md:p-8 lg:p-10">
        {/* Header + scoreboard */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-[#ffa116] rounded-2xl shadow-sm border border-orange-100/50">
                <Swords size={40} strokeWidth={2.5} />
              </div>
              {t('challenge.title')}
            </h1>
            <p className="text-gray-500 text-lg font-medium max-w-2xl leading-relaxed">
              {t('challenge.subtitle')}
            </p>
          </div>

          {phase === 'playing' && (
            <div
              data-testid="scoreboard"
              className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-2 py-2 rounded-2xl border border-gray-200/60 shadow-sm whitespace-nowrap"
            >
              <Stat label={t('challenge.score')} value={stats.score} accent />
              <Stat
                label={t('challenge.streak')}
                value={
                  <span className="flex items-center gap-1">
                    <Flame
                      size={16}
                      className={
                        stats.streak > 0 ? 'text-orange-500' : 'text-gray-300'
                      }
                    />
                    {stats.streak}
                  </span>
                }
              />
              <Stat label={t('challenge.rounds')} value={stats.rounds} />
              <Stat label={t('challenge.left')} value={remaining} />
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {phase === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm p-8 md:p-12"
            >
              {poolSize === 0 ? (
                <div className="flex flex-col items-center text-center gap-4 py-6">
                  <Swords size={40} className="text-gray-300" />
                  <p className="text-lg font-bold text-gray-800">
                    {t('challenge.emptyTitle')}
                  </p>
                  <p className="text-gray-500 max-w-md">
                    {t('challenge.emptyDescription')}
                  </p>
                  <Link href="/questions">
                    <Button className="mt-2 h-12 px-6 rounded-2xl bg-gray-900 hover:bg-black font-bold">
                      {t('challenge.goQuestions')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
                  <div className="space-y-5">
                    <p className="text-2xl font-extrabold text-gray-900">
                      {fill(t('challenge.poolSize'), { count: poolSize })}
                    </p>
                    <ul className="space-y-2 text-gray-600 font-medium">
                      <li>{t('challenge.rule1')}</li>
                      <li>
                        {fill(t('challenge.rule2'), {
                          cold: POINTS_COLD,
                          hinted: POINTS_HINTED,
                        })}
                      </li>
                      <li>
                        {fill(t('challenge.rule3'), { bonus: STREAK_BONUS })}
                      </li>
                      <li className="text-gray-400">{t('challenge.rule4')}</li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    {best > 0 && (
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                        <Trophy size={16} className="text-amber-500" />
                        {t('challenge.best')} {best}
                      </div>
                    )}
                    <Button
                      onClick={start}
                      disabled={drawing}
                      className="h-16 px-10 text-lg font-extrabold rounded-2xl bg-[#ffa116] hover:bg-[#f59e0b] text-white shadow-xl shadow-orange-200 hover:-translate-y-0.5 transition-all"
                    >
                      {t('challenge.start')}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {phase === 'playing' && question && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Question */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-gray-400 font-bold text-lg bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                    #{question.pid}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-bold border px-3 py-1 rounded-lg text-xs',
                      getDifficultyColor(question.difficulty),
                    )}
                  >
                    {question.difficulty}
                  </Badge>
                  {question.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-gray-100/70 text-gray-600 font-medium rounded-md"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {question.url && (
                    <a
                      href={question.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-900"
                    >
                      {t('challenge.openProblem')} <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {question.title}
                </h2>
                <p className="text-lg font-bold text-[#ffa116]">
                  {fill(t('challenge.prompt'), {
                    count: question.solutions.length,
                  })}
                </p>
              </div>

              {/* One card per solution: redo it on LeetCode with that approach */}
              <div className="grid gap-4">
                {question.solutions.map((solution, index) => (
                  <SolutionSlot
                    key={solution.id}
                    index={index}
                    name={solution.label.trim()}
                    language={solution.language}
                    code={solution.code}
                    problemUrl={getLeetCodeUrl(
                      question.title,
                      question.url,
                      question.slug,
                    )}
                    slot={slots[index]}
                    onToggleCode={() =>
                      updateSlot(index, {
                        showCode: !slots[index].showCode,
                        // Reading the answer before judging counts as a peek
                        peeked:
                          slots[index].peeked || slots[index].verdict === null,
                      })
                    }
                    onJudge={(verdict) => updateSlot(index, { verdict })}
                  />
                ))}
              </div>

              {/* Round controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm px-6 py-5">
                <div className="text-gray-600 font-semibold" data-testid="round-result">
                  {roundDone ? (
                    <span>
                      {fill(t('challenge.roundScore'), { score: roundScore })}
                      {roundBonus > 0 && (
                        <span className="ml-2 text-orange-500 font-extrabold">
                          {fill(t('challenge.perfectBonus'), {
                            streak: stats.streak,
                            bonus: roundBonus,
                          })}
                        </span>
                      )}
                    </span>
                  ) : (
                    t('challenge.roundHint')
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!roundTouched && (
                    <Button
                      variant="ghost"
                      onClick={() => draw(seen, stats)}
                      disabled={drawing}
                      className="h-12 rounded-2xl gap-2 text-gray-500"
                    >
                      <Shuffle size={16} /> {t('challenge.skip')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => finish(stats)}
                    disabled={drawing}
                    className="h-12 rounded-2xl text-gray-500"
                  >
                    {t('challenge.end')}
                  </Button>
                  {roundDone && (
                    <Button
                      onClick={next}
                      disabled={drawing}
                      className="h-12 px-8 rounded-2xl bg-gray-900 hover:bg-black font-bold"
                    >
                      {remaining > 0 ? t('challenge.next') : t('challenge.finish')}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm p-8 md:p-12 flex flex-col items-center text-center gap-6"
              data-testid="summary"
            >
              <Trophy
                size={48}
                className={newRecord ? 'text-amber-500' : 'text-gray-300'}
              />
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  {exhausted ? t('challenge.allDone') : t('challenge.runOver')}
                </p>
                <p className="text-6xl font-black text-gray-900 mt-2">
                  {stats.score}
                </p>
                {newRecord && (
                  <p className="mt-2 font-extrabold text-amber-500">
                    {t('challenge.newRecord')}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
                <SummaryCell label={t('challenge.rounds')} value={stats.rounds} />
                <SummaryCell
                  label={t('challenge.recallRate')}
                  value={
                    stats.total
                      ? `${Math.round((stats.recalled / stats.total) * 100)}%`
                      : '—'
                  }
                  sub={`${stats.recalled}/${stats.total}`}
                />
                <SummaryCell label={t('challenge.perfectRounds')} value={stats.perfect} />
                <SummaryCell label={t('challenge.bestStreak')} value={stats.bestStreak} />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={start}
                  disabled={drawing}
                  className="h-14 px-8 rounded-2xl bg-[#ffa116] hover:bg-[#f59e0b] text-white font-extrabold"
                >
                  {t('challenge.again')}
                </Button>
                <Link href="/home">
                  <Button variant="ghost" className="h-14 px-6 rounded-2xl text-gray-500">
                    {t('common.backHome')}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const Stat = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) => (
  <div className="flex flex-col items-center px-4 py-1">
    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
      {label}
    </span>
    <span
      className={cn(
        'text-xl font-black',
        accent ? 'text-[#ffa116]' : 'text-gray-800',
      )}
    >
      {value}
    </span>
  </div>
);

const SummaryCell = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) => (
  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
    <p className="text-xs font-bold text-gray-400">{label}</p>
    <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

function SolutionSlot({
  index,
  name,
  language,
  code,
  problemUrl,
  slot,
  onToggleCode,
  onJudge,
}: {
  index: number;
  name: string;
  language: string;
  code: string;
  problemUrl: string;
  slot: Slot;
  onToggleCode: () => void;
  onJudge: (verdict: Verdict) => void;
}) {
  const { t } = useTranslation();
  const numbered = fill(t('challenge.solutionN'), { n: index + 1 });

  return (
    <div
      data-testid="solution-slot"
      className={cn(
        'rounded-[1.5rem] border transition-all duration-300 overflow-hidden',
        slot.verdict === 'got'
          ? 'bg-emerald-50/60 border-emerald-200'
          : slot.verdict === 'missed'
            ? 'bg-rose-50/50 border-rose-200'
            : 'bg-white/80 border-gray-200 shadow-sm',
      )}
    >
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <span className="font-black text-gray-300 text-lg">{numbered}</span>
        <span
          className={cn(
            'flex-1 min-w-0 text-lg font-bold truncate',
            name ? 'text-gray-900' : 'text-gray-400 italic',
          )}
        >
          {name || t('challenge.unnamed')}
        </span>
        <Badge
          variant="secondary"
          className="font-mono text-xs bg-gray-100 text-gray-500 rounded-lg"
        >
          {language}
        </Badge>

        {slot.verdict ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCode}
              className="h-10 rounded-xl gap-1.5 text-gray-500"
            >
              <Code2 size={16} />
              {slot.showCode ? t('challenge.hideCode') : t('challenge.viewCode')}
            </Button>
            <span
              className={cn(
                'font-extrabold',
                slot.verdict === 'got' ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              +{slotPoints(slot)}
            </span>
          </>
        ) : (
          <a href={problemUrl} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              className="h-10 rounded-xl gap-1.5 bg-gray-900 hover:bg-black font-bold"
            >
              {t('challenge.solveOnLeetCode')} <ExternalLink size={14} />
            </Button>
          </a>
        )}
      </div>

      {slot.showCode && (
        <div
          className="max-h-[420px] overflow-auto text-sm prose max-w-none
          prose-pre:bg-[#1e1e1e] prose-pre:m-0 prose-pre:rounded-none prose-pre:p-5
          prose-code:before:content-none! prose-code:after:content-none!"
        >
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {`\`\`\`${language || 'text'}\n${code}\n\`\`\``}
          </ReactMarkdown>
        </div>
      )}

      {!slot.verdict && (
        <div className="flex flex-wrap items-center justify-end gap-3 px-6 pb-4 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCode}
            title={fill(t('challenge.peekTitle'), { points: POINTS_HINTED })}
            className="mr-auto h-10 rounded-xl gap-1.5 text-gray-400 hover:text-gray-700"
          >
            <Code2 size={16} />
            {slot.showCode ? t('challenge.hideCode') : t('challenge.peekCode')}
          </Button>
          <Button
            variant="outline"
            onClick={() => onJudge('missed')}
            className="h-11 rounded-xl gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white font-bold"
          >
            <X size={16} /> {t('challenge.missed')}
          </Button>
          <Button
            onClick={() => onJudge('got')}
            className="h-11 rounded-xl gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
          >
            <Check size={16} /> {t('challenge.got')}
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Check, ExternalLink, X } from 'lucide-react';

import type { SolutionData } from '@/types';

export type SolutionVerdict = 'remembered' | 'forgot';

interface SolutionCardProps {
  solution: SolutionData;
  index: number;
  problemUrl: string;
  verdict: SolutionVerdict | undefined;
  isActive: boolean;
  onActivate: () => void;
  onCancel: () => void;
  onRate: (verdict: SolutionVerdict) => void;
}

/**
 * One solution of the drawn question, reviewed the way the review page
 * reviews a question: practice on LeetCode, then rate it, but with just
 * remembered / forgot
 */
export const SolutionCard = ({
  solution,
  index,
  problemUrl,
  verdict,
  isActive,
  onActivate,
  onCancel,
  onRate,
}: SolutionCardProps) => {
  const { t } = useTranslation();
  const name = solution.label.trim();

  return (
    <motion.div
      layout
      data-testid="solution-card"
      className={cn(
        'group relative backdrop-blur-xl rounded-[2rem] p-6 md:p-8 transition-all duration-300 border',
        verdict === 'remembered'
          ? 'bg-emerald-50/70 border-emerald-200'
          : verdict === 'forgot'
            ? 'bg-rose-50/60 border-rose-200'
            : isActive
              ? 'bg-white border-[#ffa116]/50 ring-4 ring-[#ffa116]/10 shadow-[0_20px_40px_-12px_rgba(255,161,22,0.2)] z-10 scale-[1.02]'
              : 'bg-white/60 border-white/60 hover:border-[#ffa116]/30 hover:bg-white/80 hover:shadow-lg hover:shadow-gray-200/50',
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-12">
        {/* Left: which solution */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-gray-400 font-bold tracking-wide bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100 text-sm">
              {t('challenge.solutionN').replace('{{n}}', String(index + 1))}
            </span>
            <Badge
              variant="secondary"
              className="font-mono text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-lg"
            >
              {solution.language}
            </Badge>
          </div>
          <h3
            className={cn(
              'text-2xl font-bold leading-snug truncate',
              name ? 'text-gray-900' : 'text-gray-400 italic',
            )}
          >
            {name || t('challenge.unnamed')}
          </h3>
        </div>

        {/* Right: actions, same flow as a review card */}
        <div className="flex flex-col items-end gap-3 justify-center lg:min-w-[240px]">
          {verdict ? (
            <span
              data-testid="verdict"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-bold',
                verdict === 'remembered'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-600',
              )}
            >
              {verdict === 'remembered' ? <Check size={18} /> : <X size={18} />}
              {verdict === 'remembered'
                ? t('challenge.remembered')
                : t('challenge.forgot')}
            </span>
          ) : !isActive ? (
            <>
              <a
                href={problemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
                onClick={onActivate}
              >
                <Button className="w-full bg-gray-900 hover:bg-black gap-3 h-12 text-base font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-gray-300 hover:-translate-y-0.5 transition-all cursor-pointer">
                  {t('reviewCard.solveBtn')} <ExternalLink size={18} />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-900 font-medium hover:bg-gray-100/50 rounded-xl w-full h-9"
                onClick={onActivate}
              >
                {t('reviewCard.alreadySolved')}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-end gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between w-full">
                <p className="text-sm font-bold text-gray-900">
                  {t('challenge.rateTitle')}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 h-8 px-2 rounded-lg -mr-2"
                  onClick={onCancel}
                >
                  {t('reviewCard.cancelBtn')}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={() => onRate('forgot')}
                  className="flex flex-col items-center justify-center gap-1 h-20 rounded-2xl border transition-all duration-200 active:scale-95 bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-200"
                >
                  <X size={22} strokeWidth={3} />
                  <span className="text-sm font-bold">
                    {t('challenge.forgot')}
                  </span>
                </button>
                <button
                  onClick={() => onRate('remembered')}
                  className="flex flex-col items-center justify-center gap-1 h-20 rounded-2xl border transition-all duration-200 active:scale-95 bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-200"
                >
                  <Check size={22} strokeWidth={3} />
                  <span className="text-sm font-bold">
                    {t('challenge.remembered')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

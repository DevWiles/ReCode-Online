"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/store/useUserStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { ChevronRight, Inbox } from "lucide-react";

import type { MasteryDistributionItem } from "@/types";
import type { TranslationKeys } from "@/constants/languages";

// The names the review page gives each rating, so L0..L5 read the same everywhere
const LEVEL_NAMES: TranslationKeys[] = [
  "reviewCard.rateFail",
  "reviewCard.rateHard",
  "reviewCard.rateMedium",
  "reviewCard.rateGood",
  "reviewCard.rateGreat",
  "reviewCard.rateEasy",
];

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-rose-100 text-rose-700",
};

/**
 * The questions behind one bar of the mastery chart. Closes on a click
 * outside, Escape or the close button.
 */
export function MasteryLevelDialog({
  item,
  onClose,
}: {
  item: MasteryDistributionItem | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { uiLanguage } = useUserStore();

  const formatNextReview = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    if (date <= now) return t("masterybar.overdue");
    if (date.toDateString() === now.toDateString()) return t("masterybar.today");
    return new Intl.DateTimeFormat(uiLanguage === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-xl max-h-[80vh] flex flex-col gap-0 p-0 rounded-[2rem] border border-white/40 bg-white/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        {item && (
          <>
            <div className="px-7 pt-7 pb-5 border-b border-gray-100">
              <DialogTitle className="flex items-center gap-3 text-xl font-extrabold text-gray-900 tracking-tight">
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                {item.label} · {t(LEVEL_NAMES[item.level])}
              </DialogTitle>
              <DialogDescription className="mt-1.5 ml-6 text-sm text-gray-500 font-medium">
                {item.questions.length} {t("masterybar.countSuffix")}
              </DialogDescription>
            </div>

            {item.questions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-gray-400">
                <Inbox size={32} />
                <p className="text-sm font-medium">{t("masterybar.empty")}</p>
              </div>
            ) : (
              <ul className="overflow-y-auto px-3 py-3">
                {item.questions.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/questions/${q.id}`}
                      className="group flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-12 shrink-0 text-sm font-mono font-bold text-gray-400">
                        #{q.pid}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">
                          {q.title}
                        </p>
                        {q.tags.length > 0 && (
                          <p className="truncate text-xs text-gray-400 mt-0.5">
                            {q.tags.join(" · ")}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                          DIFFICULTY_STYLES[q.difficulty] ??
                            "bg-gray-100 text-gray-600"
                        )}
                      >
                        {q.difficulty}
                      </span>
                      <span
                        className="hidden sm:block w-16 shrink-0 text-right text-xs font-medium text-gray-500"
                        title={t("masterybar.nextReview")}
                      >
                        {formatNextReview(q.nextReview)}
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

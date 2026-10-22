import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

import { Trophy, ArrowRight, Coffee, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { ReviewMode } from "@/types/review";

interface ReviewEmptyStateProps {
  mode: ReviewMode;
  aheadCount: number;
}

export const ReviewEmptyState = ({ mode, aheadCount }: ReviewEmptyStateProps) => {
  const { t } = useTranslation();
  const isAhead = mode === "ahead";
  const Icon = isAhead ? Coffee : Trophy;

  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-[#ffa116]/20 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="relative w-32 h-32 bg-linear-to-br from-yellow-50 to-orange-50 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-white/50">
          <Icon
            className="text-[#ffa116] drop-shadow-md"
            size={64}
            strokeWidth={1.5}
          />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
        {isAhead
          ? t("reviewEmptyState.aheadTitle")
          : t("reviewEmptyState.title")}
      </h2>
      <p className="text-gray-500 max-w-md text-lg leading-relaxed mb-10">
        {isAhead
          ? t("reviewEmptyState.aheadDescription")
          : t("reviewEmptyState.description")}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!isAhead && aheadCount > 0 && (
          <Link href="/review/ahead">
            <Button className="h-12 px-8 rounded-2xl bg-[#ffa116] hover:bg-[#f09000] text-white shadow-xl shadow-orange-100 transition-all active:scale-95 text-base font-medium cursor-pointer">
              <FastForward size={18} className="mr-2" />
              {t("reviewEmptyState.aheadBtn").replace(
                "{{count}}",
                aheadCount.toString()
              )}
            </Button>
          </Link>
        )}
        <Link href={isAhead ? "/home" : "/questions"}>
          <Button className="h-12 px-8 rounded-2xl bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-200 hover:shadow-gray-300 transition-all active:scale-95 text-base font-medium cursor-pointer">
            {isAhead
              ? t("common.backHome")
              : t("reviewEmptyState.actionBtn")}{" "}
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

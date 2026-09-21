"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

import "highlight.js/styles/github-dark.css";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Code, Calendar, Edit3 } from "lucide-react";

import { MASTERY_COLORS } from "@/constants";
import { QuestionRowData } from "@/types";
import { SolutionViewer } from "./SolutionViewer";

interface QuestionPreviewSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: QuestionRowData | null;
}

export const QuestionPreviewSheet = ({
  isOpen,
  onOpenChange,
  data,
}: QuestionPreviewSheetProps) => {
  if (!data) return null;

  const { t } = useTranslation();

  const tags = data.problem.tags.split(",");

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col bg-white h-screen">
        <SheetHeader className="p-6 border-b border-gray-100 bg-gray-50/30 shrink-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-400 font-bold">
                  #{data.problem.pid}
                </span>
                <Badge
                  variant="outline"
                  className="font-medium border bg-white"
                >
                  {t(`questionsTable.diff${data.problem.difficulty}` as any)}
                </Badge>
              </div>
              <Link href={`/questions/${data.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 h-8 text-xs"
                >
                  <Edit3 size={12} /> {t("previewSheet.editBtn")}
                </Button>
              </Link>
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold text-gray-900 leading-tight">
                {data.problem.title}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        MASTERY_COLORS[data.masteryLevel] || "#ccc",
                    }}
                  ></span>
                  {t("previewSheet.masteryLevel")} {data.masteryLevel}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={12} />
                  {t("previewSheet.updatedAt")}:{" "}
                  {data.updatedAt.toLocaleDateString()}
                </span>
              </SheetDescription>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-white border font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-6 pb-20 space-y-8 w-full max-w-[100vw] sm:max-w-xl">
              {/* solutions: the list is the overview, click one to read its code */}
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Code size={16} className="text-[#ffa116]" />
                <span>{t("previewSheet.solutionCode")}</span>
              </div>

              <SolutionViewer solutions={data.submissions} />
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

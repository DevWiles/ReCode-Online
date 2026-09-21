import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { ChevronRight, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { SolutionData } from "@/types";

interface SolutionViewerProps {
  solutions: SolutionData[];
}

export const SolutionViewer = ({ solutions }: SolutionViewerProps) => {
  const { t } = useTranslation();

  // The list is the overview; the code opens in its own window on click
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex === null ? null : solutions[openIndex];

  const displayName = (solution: SolutionData, index: number) =>
    solution.label.trim() ||
    t("solutionSection.untitled").replace("{{index}}", String(index + 1));

  if (solutions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[120px] rounded-[1.5rem] bg-white border border-gray-100 text-gray-300 italic gap-3">
        <Code size={32} className="opacity-20" />
        {t("previewSheet.noSolutions")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {solutions.map((solution, index) => (
        <button
          key={solution.id}
          type="button"
          onClick={() => setOpenIndex(index)}
          className="w-full flex items-center gap-3 px-5 py-4 text-left rounded-[1.5rem] bg-white border border-gray-100 shadow-sm cursor-pointer hover:border-blue-100 hover:shadow-md transition-all"
        >
          <span className="flex-1 font-semibold text-gray-700 truncate">
            {displayName(solution, index)}
          </span>
          <Badge
            variant="secondary"
            className="font-mono text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-lg shrink-0"
          >
            {solution.language}
          </Badge>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </button>
      ))}

      <Dialog
        open={openIndex !== null}
        onOpenChange={(isOpen) => !isOpen && setOpenIndex(null)}
      >
        <DialogContent className="sm:max-w-[min(1000px,92vw)] max-h-[85vh] flex flex-col gap-0 p-0 rounded-[2rem] overflow-hidden">
          {open && openIndex !== null && (
            <>
              <DialogHeader className="p-5 pr-14 border-b border-gray-100 bg-gray-50/60 flex-row items-center gap-3 space-y-0">
                <DialogTitle className="flex-1 text-base font-bold text-gray-700 truncate">
                  {displayName(open, openIndex)}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t("previewSheet.solutionCode")}
                </DialogDescription>
                <Badge
                  variant="secondary"
                  className="font-mono text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-lg shrink-0"
                >
                  {open.language}
                </Badge>
              </DialogHeader>

              <ScrollArea className="flex-1 min-h-0">
                <div
                  className="text-sm md:text-base prose max-w-none dark:prose-invert
                  prose-pre:bg-[#1e1e1e] prose-pre:m-0 prose-pre:rounded-none prose-pre:p-6
                  prose-pre:w-full prose-pre:overflow-x-auto
                  prose-code:before:content-none! prose-code:after:content-none!
                  w-full"
                >
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {`\`\`\`${open.language || "text"}\n${
                      open.code || t("previewSheet.noCode")
                    }\n\`\`\``}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

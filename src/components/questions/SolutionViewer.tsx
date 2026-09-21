import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { ChevronRight, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { SolutionData } from "@/types";

interface SolutionViewerProps {
  solutions: SolutionData[];
}

export const SolutionViewer = ({ solutions }: SolutionViewerProps) => {
  const { t } = useTranslation();

  // Collapsed by default: the list is the overview, the code is one click away
  const [openId, setOpenId] = useState<string | null>(null);

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
      {solutions.map((solution, index) => {
        const isOpen = openId === solution.id;
        const name =
          solution.label.trim() ||
          t("solutionSection.untitled").replace("{{index}}", String(index + 1));

        return (
          <div
            key={solution.id}
            className="rounded-[1.5rem] bg-white border border-gray-100 shadow-sm overflow-hidden w-full"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : solution.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-gray-50/70 transition-colors"
            >
              <ChevronRight
                size={18}
                className={cn(
                  "text-gray-400 transition-transform shrink-0",
                  isOpen && "rotate-90"
                )}
              />
              <span className="flex-1 font-semibold text-gray-700 truncate">
                {name}
              </span>
              <Badge
                variant="secondary"
                className="font-mono text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-lg shrink-0"
              >
                {solution.language}
              </Badge>
            </button>

            {isOpen && (
              <div
                className="text-sm md:text-base prose max-w-none dark:prose-invert
                prose-pre:bg-[#1e1e1e] prose-pre:m-0 prose-pre:rounded-none prose-pre:p-6
                prose-pre:w-full prose-pre:overflow-x-auto
                prose-code:before:content-none! prose-code:after:content-none!
                w-full border-t border-gray-100"
              >
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {`\`\`\`${solution.language || "text"}\n${
                    solution.code || t("previewSheet.noCode")
                  }\n\`\`\``}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

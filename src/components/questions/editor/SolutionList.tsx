import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

import Editor from "@monaco-editor/react";
import { ChevronRight, Code2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from "@/constants";

import type { EditorSolution, SolutionListProps } from "@/types/editor";

export const SolutionList = ({
  solutions,
  preferredLang,
  onChange,
}: SolutionListProps) => {
  const { t } = useTranslation();

  // The list only ever shows names; the code lives in a dialog opened on click
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editing = editingIndex === null ? null : solutions[editingIndex];

  const displayName = (solution: EditorSolution, index: number) =>
    solution.label.trim() ||
    t("solutionSection.untitled").replace("{{index}}", String(index + 1));

  const handleAdd = () => {
    onChange([...solutions, { label: "", language: preferredLang, code: "" }]);
    setEditingIndex(solutions.length);
  };

  const handlePatch = (index: number, patch: Partial<EditorSolution>) => {
    onChange(
      solutions.map((solution, i) =>
        i === index ? { ...solution, ...patch } : solution
      )
    );
  };

  const handleRemove = (index: number) => {
    onChange(solutions.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
            {t("solutionSection.title")}
          </span>
          {solutions.length > 0 && (
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {solutions.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <Plus size={16} />
          {t("solutionSection.add")}
        </button>
      </div>

      {solutions.length === 0 ? (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-[1.5rem] border border-dashed border-gray-200 bg-white/40 py-10 text-sm text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
        >
          {t("solutionSection.empty")}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {solutions.map((solution, index) => (
            <div
              key={solution.id ?? `draft-${index}`}
              onClick={() => setEditingIndex(index)}
              className="flex items-center gap-3 px-5 py-4 bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-white/60 shadow-sm cursor-pointer select-none transition-all hover:shadow-md hover:border-blue-100"
            >
              <span className="flex-1 font-semibold text-gray-700 truncate">
                {displayName(solution, index)}
              </span>
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
                {solution.language}
              </span>
              <button
                type="button"
                title={t("solutionSection.remove")}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={editingIndex !== null}
        onOpenChange={(open) => !open && setEditingIndex(null)}
      >
        <DialogContent className="sm:max-w-[min(1100px,92vw)] h-[85vh] flex flex-col gap-0 p-0 rounded-[2rem] overflow-hidden">
          {editing && editingIndex !== null && (
            <>
              <DialogHeader className="p-5 pr-14 border-b border-gray-100 bg-gray-50/60">
                <DialogTitle className="text-base font-bold text-gray-700">
                  {displayName(editing, editingIndex)}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t("solutionSection.title")}
                </DialogDescription>
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <Input
                    value={editing.label}
                    onChange={(e) =>
                      handlePatch(editingIndex, { label: e.target.value })
                    }
                    placeholder={t("solutionSection.labelPlaceholder")}
                    className="h-10 flex-1 bg-white border-gray-100 focus-visible:border-blue-200 focus-visible:ring-4 focus-visible:ring-blue-50 transition-all text-sm rounded-xl px-4"
                  />
                  <Select
                    value={editing.language}
                    onValueChange={(val) =>
                      handlePatch(editingIndex, { language: val })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white rounded-xl">
                      <SelectValue
                        placeholder={t("solutionSection.languagePlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 bg-white">
                <Editor
                  height="100%"
                  language={editing.language}
                  theme="light"
                  value={editing.code}
                  onChange={(value) =>
                    handlePatch(editingIndex, { code: value || "" })
                  }
                  options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                  }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

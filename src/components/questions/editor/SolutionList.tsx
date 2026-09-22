import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

import Editor from "@monaco-editor/react";
import {
  ChevronRight,
  Code2,
  Loader2,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";
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
import { fetchLeetCodeSnippetsAction } from "@/actions/leetcode";

import type { EditorSolution, SolutionListProps } from "@/types/editor";

/** Editor language -> the empty skeleton LeetCode pre-fills its own editor with */
type Templates = Record<string, string>;

const isLeetCodeProblem = (link: string) =>
  /leetcode\.(com|cn)\/problems\//.test(link);

export const SolutionList = ({
  solutions,
  preferredLang,
  problemLink,
  onChange,
}: SolutionListProps) => {
  const { t } = useTranslation();

  // The list only ever shows names; the code lives in a dialog opened on click
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editing = editingIndex === null ? null : solutions[editingIndex];

  // The templates are the same for every solution of a problem, so they are
  // fetched once and kept as the in-flight promise: a second caller awaits the
  // first request instead of starting its own
  const pendingTemplates = useRef<Promise<Templates | null> | null>(null);
  const templates = useRef<Templates | null>(null);
  const [isFetchingTemplates, setIsFetchingTemplates] = useState(false);
  const [templatesFailed, setTemplatesFailed] = useState(false);

  const canFetchTemplates = isLeetCodeProblem(problemLink);

  const loadTemplates = useCallback(
    (retry = false) => {
      if (!canFetchTemplates) return Promise.resolve(null);
      if (retry) pendingTemplates.current = null;
      if (pendingTemplates.current) return pendingTemplates.current;

      setIsFetchingTemplates(true);
      setTemplatesFailed(false);

      pendingTemplates.current = fetchLeetCodeSnippetsAction(problemLink)
        .then((result) => {
          if (!result.success) {
            // Cleared so the retry button can start a fresh request
            pendingTemplates.current = null;
            setTemplatesFailed(true);
            return null;
          }

          templates.current = result.data;
          return result.data;
        })
        .catch((error) => {
          // A blank editor is a fine outcome; nothing here may break the dialog
          console.error("Failed to fetch LeetCode code snippets:", error);
          pendingTemplates.current = null;
          setTemplatesFailed(true);
          return null;
        })
        .finally(() => setIsFetchingTemplates(false));

      return pendingTemplates.current;
    },
    [canFetchTemplates, problemLink]
  );

  // Warmed up while the problem is still being filled in, so the first "add"
  // usually finds the template already there. leetcode.cn can need a browser,
  // which takes seconds, and that wait is better spent before the click.
  //
  // Debounced because the link can be typed by hand: a URL matches halfway
  // through the slug, and every later keystroke would fetch a different problem
  useEffect(() => {
    // Whatever was fetched belongs to the previous link. The failed flag is
    // left to loadTemplates, which clears it as the new request goes out
    pendingTemplates.current = null;
    templates.current = null;

    if (!canFetchTemplates) return;

    const timer = setTimeout(() => loadTemplates(), 600);
    return () => clearTimeout(timer);
  }, [canFetchTemplates, loadTemplates]);

  const displayName = (solution: EditorSolution, index: number) =>
    solution.label.trim() ||
    t("solutionSection.untitled").replace("{{index}}", String(index + 1));

  /**
   * Writes the template in only where the user has not written anything of
   * their own: an empty editor, or one still holding the previous language's
   * untouched skeleton.
   */
  const applyTemplate = (
    index: number,
    language: string,
    replaceable: string[]
  ) => {
    const code = templates.current?.[language];
    if (!code) return;

    onChange((previous) =>
      previous.map((solution, i) =>
        i === index &&
        (!solution.code.trim() || replaceable.includes(solution.code))
          ? { ...solution, code }
          : solution
      )
    );
  };

  const handleAdd = async () => {
    const index = solutions.length;

    onChange((previous) => [
      ...previous,
      { label: "", language: preferredLang, code: "" },
    ]);
    setEditingIndex(index);

    await loadTemplates();
    applyTemplate(index, preferredLang, []);
  };

  const handlePatch = (index: number, patch: Partial<EditorSolution>) => {
    onChange((previous) =>
      previous.map((solution, i) =>
        i === index ? { ...solution, ...patch } : solution
      )
    );
  };

  /**
   * Switching language swaps the skeleton over with it, as long as the editor
   * still holds nothing but the old one.
   */
  const handleLanguageChange = async (index: number, language: string) => {
    const previousCode = solutions[index].code;
    const previousLanguage = solutions[index].language;

    handlePatch(index, { language });

    await loadTemplates();

    const previousTemplate = templates.current?.[previousLanguage];
    if (previousCode.trim() && previousCode !== previousTemplate) return;

    applyTemplate(index, language, previousTemplate ? [previousTemplate] : []);
  };

  const handleRemove = (index: number) => {
    onChange((previous) => previous.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  /** Pulls the skeleton on demand after the automatic attempt came back empty */
  const handleRetryTemplate = async () => {
    if (editingIndex === null) return;

    const index = editingIndex;
    const { language, code } = solutions[index];

    await loadTemplates(true);
    applyTemplate(index, language, code.trim() ? [code] : []);
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3">
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
                      handleLanguageChange(editingIndex, val)
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

                  {/* Only ever a hint: the editor stays usable while this runs */}
                  {canFetchTemplates && isFetchingTemplates && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                      <Loader2 size={13} className="animate-spin" />
                      {t("solutionSection.templateLoading")}
                    </span>
                  )}
                  {canFetchTemplates &&
                    !isFetchingTemplates &&
                    templatesFailed && (
                      <button
                        type="button"
                        onClick={handleRetryTemplate}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                      >
                        <RotateCw size={13} />
                        {t("solutionSection.templateRetry")}
                      </button>
                    )}
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

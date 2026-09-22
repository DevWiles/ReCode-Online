export interface EditorSolution {
  // A row that has never been saved has no database id yet
  id?: string;
  // Short name shown in the list; empty falls back to "Solution N"
  label: string;
  language: string;
  code: string;
}

export interface EditorFormData {
  // Problem
  pid: string;
  title: string;
  difficulty: string;
  tags: string[];
  link: string;

  // Submissions, in list order
  solutions: EditorSolution[];

  // Progress
  masteryLevel: number;
}

export interface MetaSidebarProps {
  difficulty: string;
  tags: string[];
  link: string;
  masteryLevel: number;
  onUpdate: (field: string, value: any) => void;
}

export interface QuestionEditorProps {
  mode: "create" | "edit";
  // clean data
  initialData?: Partial<EditorFormData>;
  preferredLang?: string;
}

export interface EditorHeaderProps {
  pid: string;
  title: string;
  isSaving: boolean;
  mode: "create" | "edit";
  onUpdate: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

// An updater is accepted as well as a plain array: the template fetch resolves
// after the click that started it, so it must patch whatever is current then,
// not the list it was fired from
export type SolutionsUpdate =
  | EditorSolution[]
  | ((previous: EditorSolution[]) => EditorSolution[]);

export interface SolutionListProps {
  solutions: EditorSolution[];
  preferredLang: string;
  // Problem URL; a LeetCode one lets new solutions start from the official
  // code skeleton. Empty, or any other site, simply starts from a blank editor
  problemLink: string;
  onChange: (update: SolutionsUpdate) => void;
}

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

export interface SolutionListProps {
  solutions: EditorSolution[];
  preferredLang: string;
  onChange: (solutions: EditorSolution[]) => void;
}

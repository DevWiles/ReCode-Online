import { type LucideIcon } from "lucide-react";
import { LanguageType } from "@/constants/languages";

// SideBar interfaces
interface NavItem {
  en_name: string;
  zh_name: string;
  icon: LucideIcon;
  path: string;
  // Hidden from everyone but administrators
  adminOnly?: boolean;
}

export interface NavSection {
  category: string;
  items: NavItem[];
}

// useUserStore interfaces
export interface UserState {
  uiLanguage: LanguageType;
  themeColor: string;
  username: string;
  role: string;
  preferredLang: string;
  isSettingModalOpen: boolean;
  dailyReviewLimit: number;

  setLanguage: (lang: LanguageType) => void;
  setTheme: (color: string) => void;
  setUsername: (name: string) => void;
  setRole: (role: string) => void;
  setPreferredLang: (preLang: string) => void;
  setDailyReviewLimit: (limit: number) => void;
  setIsSettingModalOpen: (status: boolean) => void;
}

// updateUsers interfaces
export interface UpdateUserProps {
  preferredLang: string;
  uiLanguage: string;
  dailyReviewLimit: number;
}

// leetcode fetch interfaces
export interface LeetCodeTopicTag {
  name: string;
  translatedName?: string | null;
}

export interface LeetCodeCodeSnippet {
  // Display name, e.g. "Python3"
  lang: string;
  // Stable identifier LeetCode keys the snippet by, e.g. "python3"
  langSlug: string;
  // The empty function/class skeleton the site pre-fills its editor with
  code: string;
}

export interface LeetCodeQuestionData {
  questionFrontendId: string;
  title: string;
  translatedTitle?: string | null;
  difficulty: string;
  topicTags: LeetCodeTopicTag[];
}

// login interfaces
export interface LoginProps {
  username: string;
  password: string;
}

// Discriminated result so the form can map error codes onto localized text
export type LoginResult =
  | { ok: true; error?: never }
  | { ok?: never; error: "EMPTY_FIELDS" | "BAD_CREDENTIALS" | "RATE_LIMITED" };

// login log interfaces
export type LoginLogFilter = "all" | "success" | "failed";

export interface LoginLogRow {
  id: string;
  username: string;
  success: boolean;
  reason: string | null;
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  // Preformatted on the server to keep client and server renders identical
  time: string;
}

export interface LoginLogsClientProps {
  uiLanguage: "en" | "zh";
  rows: LoginLogRow[];
  filter: LoginLogFilter;
  page: number;
  pageCount: number;
  total: number;
  successCount: number;
  failureCount: number;
  ipCount: number;
  currentIp: string;
}

// StatCard interfaces
export type CardVariant = "orange" | "green" | "blue" | "purple";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;

  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  footerText?: string;
  variant?: CardVariant;
  onClick?: () => void;
  className?: string;
}

// MasteryBar interfaces
export interface MasteryDistributionItem {
  level: number;
  count: number;
  label: string;
  color: string;
}

export interface MasteryBarProps {
  distribution: MasteryDistributionItem[];
}

// TodayFocus interfaces
export interface FocusTaskItem {
  id: string;
  title: string;
  difficulty: string;
}

interface HomePageStats {
  masteredCount: number;
  masteredTrend: number;
  totalQuestions: number;
  questionsTrend: number;
  toReview: number;
  // Count for the next study day with reviews, nextReviewInDays from today
  toReviewTomorrow: number;
  nextReviewInDays: number;
  // Tomorrow's questions still open for reviewing ahead
  toReviewAhead: number;
  toReviewLowLevel: number;
  masteryRate: number;
}

export interface HomePageClientProps {
  focusTasks: FocusTaskItem[];
  masteryDistribution: MasteryDistributionItem[];
  stats: HomePageStats;
}

export interface TodayFocusProps {
  focusTasks?: FocusTaskItem[] | null;
  totalTasks: number;
}

// Questions interfaces
export interface SolutionData {
  id: string;
  // Empty means the viewer falls back to "Solution N"
  label: string;
  language: string;
  code: string;
}

export interface QuestionRowData {
  id: string;
  status: string;
  masteryLevel: number;
  updatedAt: Date;

  problem: {
    id: string;
    pid: string;
    title: string;
    difficulty: string;
    tags: string;
    url: string;
  };

  // Every saved solution, in list order
  submissions: SolutionData[];
}

export interface QuestionsPageClientProps {
  initialQuestions: QuestionRowData[];
}

// user management interfaces
export interface CreateUserProps {
  username: string;
  // Blank = generate one
  password: string;
}

export type UserAdminResult =
  | { ok: true; username: string; password: string; error?: never }
  | {
      ok?: never;
      error:
        | "FORBIDDEN"
        | "BAD_USERNAME"
        | "SHORT_PASSWORD"
        | "USERNAME_TAKEN"
        | "NOT_FOUND";
    };

export interface UserRow {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  questionCount: number;
  isSelf: boolean;
}

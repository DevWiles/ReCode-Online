import { LayoutGrid, ListTodo, BarChart2, HelpCircle, ScrollText, Users, ShieldCheck, Swords } from "lucide-react";

import type { CardVariant, NavSection } from "@/types";

export const SIDEBAR_NAV: NavSection[] = [
  {
    category: "Overview",
    items: [
      { en_name: "Home", zh_name: "主页", icon: LayoutGrid, path: "/home" },
      {
        en_name: "Questions",
        zh_name: "问题列表",
        icon: ListTodo,
        path: "/questions",
      },
      { en_name: "Review", zh_name: "复习", icon: BarChart2, path: "/review" },
      {
        en_name: "Challenge",
        zh_name: "一题多解",
        icon: Swords,
        path: "/challenge",
      },
    ],
  },
  {
    category: "System",
    items: [
      {
        en_name: "Account",
        zh_name: "账号安全",
        icon: ShieldCheck,
        path: "/account",
      },
      {
        en_name: "Login Logs",
        zh_name: "登录日志",
        icon: ScrollText,
        path: "/logs",
        adminOnly: true,
      },
      {
        en_name: "Users",
        zh_name: "用户管理",
        icon: Users,
        path: "/users",
        adminOnly: true,
      },
      { en_name: "Help", zh_name: "帮助", icon: HelpCircle, path: "/help" },
    ],
  },
];

export const STATCARD_COLOR_VARIANTS: Record<string, string> = {
  orange: "from-orange-400 to-orange-600 shadow-orange-500/30",
  blue: "from-blue-500 to-indigo-600 shadow-blue-500/30",
  purple: "from-purple-500 to-fuchsia-600 shadow-purple-500/30",
  green: "from-emerald-400 to-teal-600 shadow-emerald-500/30",
};

export const MASTERY_COLORS: Record<number, string> = {
  0: "#ef4444",
  1: "#f97316",
  2: "#facc15",
  3: "#a3e635",
  4: "#22c55e",
  5: "#15803d",
};

// Programming languages ​​supported in edit notes
export const LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

// LeetCode keys its code snippets by its own slugs, which only mostly match the
// values above: "python" there is Python 2, the modern skeleton is "python3"
export const LEETCODE_LANG_SLUGS: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python3",
  java: "java",
  cpp: "cpp",
};

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export const STATUS_OPTIONS = ["Reviewing", "Solved", "Todo"];

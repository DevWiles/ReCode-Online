"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createUser, resetUserPassword } from "@/actions/users";
import { Input } from "@/components/ui/input";

import { Copy, KeyRound, ShieldCheck, UserPlus, X } from "lucide-react";

import type { UserAdminResult, UserRow } from "@/types";

const COPY = {
  zh: {
    title: "用户管理",
    sub: "给朋友开账号；每个账号的题目和复习进度互相独立",
    create: "新建账号",
    username: "用户名",
    usernameHint: "3–32 位字母、数字、_ . -，不区分大小写唯一",
    password: "初始密码",
    passwordHint: "留空自动生成，至少 8 位",
    submit: "创建",
    issued: "账号信息只显示这一次，请发给对方：",
    copy: "复制",
    copied: "已复制",
    colUser: "用户名",
    colRole: "角色",
    colQuestions: "题目数",
    colCreated: "创建时间",
    admin: "管理员",
    user: "普通用户",
    you: "你",
    reset: "重置密码",
    errors: {
      FORBIDDEN: "只有管理员可以操作",
      BAD_USERNAME: "用户名格式不对",
      SHORT_PASSWORD: "密码至少 8 位",
      USERNAME_TAKEN: "用户名已被占用",
      NOT_FOUND: "账号不存在",
    },
  },
  en: {
    title: "Users",
    sub: "Hand out accounts; every account keeps its own questions and reviews",
    create: "New account",
    username: "Username",
    usernameHint: "3–32 letters, digits, _ . -; unique regardless of case",
    password: "Initial password",
    passwordHint: "Leave blank to generate one, 8+ characters",
    submit: "Create",
    issued: "Shown only once. Send these to the account owner:",
    copy: "Copy",
    copied: "Copied",
    colUser: "Username",
    colRole: "Role",
    colQuestions: "Questions",
    colCreated: "Created",
    admin: "Admin",
    user: "User",
    you: "you",
    reset: "Reset password",
    errors: {
      FORBIDDEN: "Only admins can do this",
      BAD_USERNAME: "Invalid username",
      SHORT_PASSWORD: "Password needs 8+ characters",
      USERNAME_TAKEN: "Username already taken",
      NOT_FOUND: "No such account",
    },
  },
};

const card =
  "bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm";

export default function UsersClient({
  uiLanguage,
  rows,
}: {
  uiLanguage: "zh" | "en";
  rows: UserRow[];
}) {
  const t = COPY[uiLanguage];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // The last credentials handed out, kept on screen until dismissed
  const [issued, setIssued] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleResult = (result: UserAdminResult) => {
    if (result.error) {
      toast.error(t.errors[result.error]);
      return false;
    }
    setIssued({ username: result.username, password: result.password });
    return true;
  };

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      if (handleResult(await createUser({ username, password }))) {
        setUsername("");
        setPassword("");
      }
    });
  };

  const onReset = (userId: string) => {
    startTransition(async () => {
      handleResult(await resetUserPassword(userId));
    });
  };

  const copyIssued = async () => {
    if (!issued) return;
    await navigator.clipboard.writeText(
      `${t.colUser}: ${issued.username}\n${t.password}: ${issued.password}`
    );
    toast.success(t.copied);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">{t.sub}</p>
      </div>

      {/* Create */}
      <form onSubmit={onCreate} className={cn(card, "p-6 space-y-4")}>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <UserPlus size={14} />
          {t.create}
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-start">
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-gray-700">
              {t.username}
            </span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              required
            />
            <span className="block text-xs text-gray-400">
              {t.usernameHint}
            </span>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-gray-700">
              {t.password}
            </span>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <span className="block text-xs text-gray-400">
              {t.passwordHint}
            </span>
          </label>
          <button
            type="submit"
            disabled={isPending || !username.trim()}
            className="md:mt-7 h-9 px-6 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {t.submit}
          </button>
        </div>
      </form>

      {/* Credentials just issued */}
      {issued && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 space-y-3"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold text-amber-800">{t.issued}</p>
            <button
              onClick={() => setIssued(null)}
              className="text-amber-700/60 hover:text-amber-900 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <div className="font-mono text-sm text-gray-900 space-y-1 break-all">
            <div>
              {t.colUser}: <b>{issued.username}</b>
            </div>
            <div>
              {t.password}: <b>{issued.password}</b>
            </div>
          </div>
          <button
            onClick={copyIssued}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
          >
            <Copy size={14} />
            {t.copy}
          </button>
        </motion.div>
      )}

      {/* List */}
      <div className={cn(card, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/70">
                <th className="px-6 py-4">{t.colUser}</th>
                <th className="px-6 py-4">{t.colRole}</th>
                <th className="px-6 py-4">{t.colQuestions}</th>
                <th className="px-6 py-4">{t.colCreated}</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {row.username}
                    {row.isSelf && (
                      <span className="ml-2 text-xs font-medium text-gray-400">
                        ({t.you})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {row.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[#e08a00]">
                        <ShieldCheck size={12} />
                        {t.admin}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
                        {t.user}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 tabular-nums text-gray-700">
                    {row.questionCount}
                  </td>
                  <td className="px-6 py-4 tabular-nums text-gray-500">
                    {row.createdAt}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!row.isSelf && (
                      <button
                        onClick={() => onReset(row.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                      >
                        <KeyRound size={14} />
                        {t.reset}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  createInvite,
  createUser,
  deleteUser,
  resetUserPassword,
  revokeInvite,
  setUserDisabled,
} from "@/actions/users";
import { Input } from "@/components/ui/input";

import {
  Ban,
  BadgeCheck,
  Copy,
  KeyRound,
  Link2,
  RotateCcw,
  ShieldCheck,
  Ticket,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import type {
  InviteRow,
  UserAdminError,
  UserAdminResult,
  UserRow,
} from "@/types";

const COPY = {
  zh: {
    title: "用户管理",
    sub: "发邀请码让朋友自助注册，或直接开账号；每个账号的数据互相独立",
    inviteTitle: "邀请码",
    maxUses: "可注册人数",
    expires: "有效期（天，0 = 永久）",
    generate: "生成邀请码",
    copyCode: "复制码",
    copyLink: "复制注册链接",
    revoke: "作废",
    noInvites: "还没有邀请码",
    colCode: "邀请码",
    colUses: "已用 / 上限",
    colExpires: "到期",
    colUsedBy: "注册的账号",
    colState: "状态",
    never: "永久",
    states: {
      ACTIVE: "可用",
      USED_UP: "已用完",
      EXPIRED: "已过期",
      REVOKED: "已作废",
    },
    create: "直接开账号",
    username: "用户名",
    usernameHint: "3–32 位字母、数字、_ . -，不区分大小写唯一",
    password: "初始密码",
    passwordHint: "留空自动生成，至少 8 位",
    submit: "创建",
    issued: "账号信息只显示这一次，请发给对方：",
    copy: "复制",
    copied: "已复制",
    colUser: "用户名",
    colEmail: "邮箱",
    colRole: "角色",
    colStatus: "状态",
    colQuestions: "题目数",
    colCreated: "创建时间",
    admin: "管理员",
    user: "普通用户",
    active: "正常",
    disabledLabel: "已禁用",
    you: "你",
    reset: "重置密码",
    disable: "禁用",
    enable: "启用",
    remove: "删除",
    deleteTitle: "删除账号",
    deleteWarn: "该账号的所有题目、复习进度和代码会被永久删除，无法恢复。输入用户名确认：",
    deleteConfirm: "永久删除",
    cancel: "取消",
    deleted: "账号已删除",
    errors: {
      FORBIDDEN: "只有管理员可以操作",
      BAD_USERNAME: "用户名格式不对",
      SHORT_PASSWORD: "密码至少 8 位",
      USERNAME_TAKEN: "用户名已被占用",
      NOT_FOUND: "记录不存在",
      PROTECTED: "不能对自己或管理员执行这个操作",
      CONFIRM_MISMATCH: "输入的用户名不一致",
      BAD_INVITE: "人数需在 1–100、有效期需在 0–365 天之间",
    },
  },
  en: {
    title: "Users",
    sub: "Send invite codes for self sign-up, or create accounts directly; every account keeps its own data",
    inviteTitle: "Invite codes",
    maxUses: "Sign-ups allowed",
    expires: "Valid for (days, 0 = forever)",
    generate: "Generate",
    copyCode: "Copy code",
    copyLink: "Copy sign-up link",
    revoke: "Revoke",
    noInvites: "No invite codes yet",
    colCode: "Code",
    colUses: "Used / max",
    colExpires: "Expires",
    colUsedBy: "Accounts",
    colState: "State",
    never: "Never",
    states: {
      ACTIVE: "Active",
      USED_UP: "Used up",
      EXPIRED: "Expired",
      REVOKED: "Revoked",
    },
    create: "Create account",
    username: "Username",
    usernameHint: "3–32 letters, digits, _ . -; unique regardless of case",
    password: "Initial password",
    passwordHint: "Leave blank to generate one, 8+ characters",
    submit: "Create",
    issued: "Shown only once. Send these to the account owner:",
    copy: "Copy",
    copied: "Copied",
    colUser: "Username",
    colEmail: "Email",
    colRole: "Role",
    colStatus: "Status",
    colQuestions: "Questions",
    colCreated: "Created",
    admin: "Admin",
    user: "User",
    active: "Active",
    disabledLabel: "Disabled",
    you: "you",
    reset: "Reset password",
    disable: "Disable",
    enable: "Enable",
    remove: "Delete",
    deleteTitle: "Delete account",
    deleteWarn: "All of this account's questions, reviews and code are deleted for good. Type the username to confirm:",
    deleteConfirm: "Delete forever",
    cancel: "Cancel",
    deleted: "Account deleted",
    errors: {
      FORBIDDEN: "Only admins can do this",
      BAD_USERNAME: "Invalid username",
      SHORT_PASSWORD: "Password needs 8+ characters",
      USERNAME_TAKEN: "Username already taken",
      NOT_FOUND: "Not found",
      PROTECTED: "Not allowed on yourself or an admin",
      CONFIRM_MISMATCH: "The username does not match",
      BAD_INVITE: "Sign-ups must be 1–100 and validity 0–365 days",
    },
  },
};

const card =
  "bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm";
const heading =
  "flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest";
const fieldLabel = "text-sm font-semibold text-gray-700";
const th = "px-6 py-4";
const td = "px-6 py-4";
const action =
  "inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40 cursor-pointer";

const STATE_TONES: Record<InviteRow["state"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600",
  USED_UP: "bg-gray-100 text-gray-500",
  EXPIRED: "bg-gray-100 text-gray-500",
  REVOKED: "bg-red-50 text-red-500",
};

export default function UsersClient({
  uiLanguage,
  rows,
  invites,
}: {
  uiLanguage: "zh" | "en";
  rows: UserRow[];
  invites: InviteRow[];
}) {
  const t = COPY[uiLanguage];
  const [isPending, startTransition] = useTransition();

  const [inviteForm, setInviteForm] = useState({ maxUses: "1", expiresInDays: "7" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // The last credentials handed out, kept on screen until dismissed
  const [issued, setIssued] = useState<{
    username: string;
    password: string;
  } | null>(null);
  // Account awaiting the typed-username confirmation
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [deleteInput, setDeleteInput] = useState("");

  const fail = (error: UserAdminError) => toast.error(t.errors[error]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(t.copied);
  };

  const inviteLink = (code: string) =>
    `${window.location.origin}/register?invite=${code}`;

  const handleIssued = (result: UserAdminResult) => {
    if (result.error) {
      fail(result.error);
      return false;
    }
    setIssued({ username: result.username, password: result.password });
    return true;
  };

  const onCreateInvite = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const res = await createInvite({
        maxUses: Number(inviteForm.maxUses),
        expiresInDays: Number(inviteForm.expiresInDays),
      });
      if (res.error) fail(res.error);
      else await copy(inviteLink(res.code));
    });
  };

  const onRevoke = (id: string) =>
    startTransition(async () => {
      const res = await revokeInvite(id);
      if (res.error) fail(res.error);
    });

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      if (handleIssued(await createUser({ username, password }))) {
        setUsername("");
        setPassword("");
      }
    });
  };

  const onReset = (userId: string) =>
    startTransition(async () => {
      handleIssued(await resetUserPassword(userId));
    });

  const onToggleDisabled = (row: UserRow) =>
    startTransition(async () => {
      const res = await setUserDisabled(row.id, !row.disabled);
      if (res.error) fail(res.error);
    });

  const onDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteUser(deleting.id, deleteInput);
      if (res.error) {
        fail(res.error);
        return;
      }
      toast.success(t.deleted);
      setDeleting(null);
      setDeleteInput("");
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">{t.sub}</p>
      </div>

      {/* Invites */}
      <div className={cn(card, "overflow-hidden")}>
        <form onSubmit={onCreateInvite} className="p-6 space-y-4">
          <div className={heading}>
            <Ticket size={14} />
            {t.inviteTitle}
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-1.5">
              <span className={fieldLabel}>{t.maxUses}</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={inviteForm.maxUses}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, maxUses: e.target.value })
                }
              />
            </label>
            <label className="space-y-1.5">
              <span className={fieldLabel}>{t.expires}</span>
              <Input
                type="number"
                min={0}
                max={365}
                value={inviteForm.expiresInDays}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, expiresInDays: e.target.value })
                }
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 px-6 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {t.generate}
            </button>
          </div>
        </form>

        <div className="overflow-x-auto border-t border-gray-200/70">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/70">
                <th className={th}>{t.colCode}</th>
                <th className={th}>{t.colState}</th>
                <th className={th}>{t.colUses}</th>
                <th className={th}>{t.colExpires}</th>
                <th className={th}>{t.colUsedBy}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {t.noInvites}
                  </td>
                </tr>
              )}
              {invites.map((invite) => (
                <tr
                  key={invite.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className={cn(td, "font-mono font-bold text-gray-900")}>
                    {invite.code}
                  </td>
                  <td className={td}>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        STATE_TONES[invite.state]
                      )}
                    >
                      {t.states[invite.state]}
                    </span>
                  </td>
                  <td className={cn(td, "tabular-nums text-gray-700")}>
                    {invite.usedCount} / {invite.maxUses}
                  </td>
                  <td className={cn(td, "tabular-nums text-gray-500")}>
                    {invite.expiresAt ?? t.never}
                  </td>
                  <td className={cn(td, "text-gray-700")}>
                    {invite.usedBy.join(", ") || "—"}
                  </td>
                  <td className={cn(td, "text-right whitespace-nowrap")}>
                    {invite.state === "ACTIVE" && (
                      <div className="inline-flex gap-4">
                        <button
                          onClick={() => copy(inviteLink(invite.code))}
                          className={action}
                        >
                          <Link2 size={14} />
                          {t.copyLink}
                        </button>
                        <button
                          onClick={() => copy(invite.code)}
                          className={action}
                        >
                          <Copy size={14} />
                          {t.copyCode}
                        </button>
                        <button
                          onClick={() => onRevoke(invite.id)}
                          disabled={isPending}
                          className={cn(action, "hover:text-red-600")}
                        >
                          <Ban size={14} />
                          {t.revoke}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create directly */}
      <form onSubmit={onCreate} className={cn(card, "p-6 space-y-4")}>
        <div className={heading}>
          <UserPlus size={14} />
          {t.create}
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-start">
          <label className="space-y-1.5">
            <span className={fieldLabel}>{t.username}</span>
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
            <span className={fieldLabel}>{t.password}</span>
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
            onClick={() =>
              copy(
                `${t.colUser}: ${issued.username}\n${t.password}: ${issued.password}`
              )
            }
            className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
          >
            <Copy size={14} />
            {t.copy}
          </button>
        </motion.div>
      )}

      {/* Typed confirmation before a delete */}
      {deleting && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-red-200 bg-red-50/80 p-6 space-y-4"
        >
          <p className="font-bold text-red-700">
            {t.deleteTitle}: {deleting.username}
          </p>
          <p className="text-sm text-red-700/80">{t.deleteWarn}</p>
          <div className="flex flex-wrap gap-3">
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={deleting.username}
              className="max-w-xs bg-white"
            />
            <button
              onClick={onDelete}
              disabled={isPending || deleteInput.trim() !== deleting.username}
              className="h-9 px-5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {t.deleteConfirm}
            </button>
            <button
              onClick={() => {
                setDeleting(null);
                setDeleteInput("");
              }}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              {t.cancel}
            </button>
          </div>
        </motion.div>
      )}

      {/* Accounts */}
      <div className={cn(card, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/70">
                <th className={th}>{t.colUser}</th>
                <th className={th}>{t.colEmail}</th>
                <th className={th}>{t.colRole}</th>
                <th className={th}>{t.colStatus}</th>
                <th className={th}>{t.colQuestions}</th>
                <th className={th}>{t.colCreated}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const manageable = !row.isSelf && row.role !== "ADMIN";

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-gray-100 last:border-0",
                      row.disabled && "opacity-60"
                    )}
                  >
                    <td className={cn(td, "font-semibold text-gray-900")}>
                      {row.username}
                      {row.isSelf && (
                        <span className="ml-2 text-xs font-medium text-gray-400">
                          ({t.you})
                        </span>
                      )}
                    </td>
                    <td className={cn(td, "text-gray-600")}>
                      {row.email ? (
                        <span className="inline-flex items-center gap-1 break-all">
                          {row.email}
                          {row.emailVerified && (
                            <BadgeCheck
                              size={14}
                              className="shrink-0 text-emerald-500"
                            />
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={td}>
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
                    <td className={td}>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          row.disabled
                            ? "bg-red-50 text-red-500"
                            : "bg-emerald-50 text-emerald-600"
                        )}
                      >
                        {row.disabled ? t.disabledLabel : t.active}
                      </span>
                    </td>
                    <td className={cn(td, "tabular-nums text-gray-700")}>
                      {row.questionCount}
                    </td>
                    <td className={cn(td, "tabular-nums text-gray-500")}>
                      {row.createdAt}
                    </td>
                    <td className={cn(td, "text-right whitespace-nowrap")}>
                      {!row.isSelf && (
                        <div className="inline-flex gap-4">
                          <button
                            onClick={() => onReset(row.id)}
                            disabled={isPending}
                            className={action}
                          >
                            <KeyRound size={14} />
                            {t.reset}
                          </button>
                          {manageable && (
                            <>
                              <button
                                onClick={() => onToggleDisabled(row)}
                                disabled={isPending}
                                className={action}
                              >
                                {row.disabled ? (
                                  <RotateCcw size={14} />
                                ) : (
                                  <Ban size={14} />
                                )}
                                {row.disabled ? t.enable : t.disable}
                              </button>
                              <button
                                onClick={() => {
                                  setDeleting(row);
                                  setDeleteInput("");
                                }}
                                disabled={isPending}
                                className={cn(action, "hover:text-red-600")}
                              >
                                <Trash2 size={14} />
                                {t.remove}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

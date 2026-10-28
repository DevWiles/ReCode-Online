"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { bindEmail, logoutAllDevices, sendBindCode } from "@/actions/account";
import { changePassword } from "@/actions/password";
import { useCountdown } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";

import avatar from "../../../public/images/avatar.png";

import {
  BadgeCheck,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  TriangleAlert,
} from "lucide-react";

import type { AccountError, AccountLogin } from "@/types";

const COPY = {
  zh: {
    title: "账号安全",
    sub: "邮箱、密码和登录设备",
    admin: "管理员",
    member: "普通用户",
    joined: "加入于",
    problems: (n: number) => `共 ${n} 道题`,
    emailTitle: "邮箱",
    none: "未绑定",
    verified: "已验证",
    unverified: "未验证",
    required: "请先绑定邮箱",
    requiredSub: "为了保证忘记密码时能自助找回，所有账号都需要绑定一个邮箱。绑定完成后即可正常使用 ReCode。",
    newEmail: "新邮箱",
    code: "验证码",
    send: "发送验证码",
    sent: "验证码已发送，请查收邮件",
    bind: "绑定",
    change: "更换",
    bound: "邮箱已绑定",
    cancel: "取消",
    pwTitle: "密码",
    pwEdit: "修改",
    pwCurrent: "当前密码",
    pwNew: "新密码",
    pwConfirm: "确认新密码",
    pwHint: "8–128 位。修改后其他设备会退出登录，这台设备保持登录",
    pwSubmit: "保存新密码",
    pwDone: "密码已修改，其他设备已退出登录",
    loginsTitle: "最近登录",
    loginsEmpty: "暂无登录记录",
    thisDevice: "当前设备",
    dataTitle: "我的数据",
    exportTitle: "导出数据",
    exportSub: "下载全部题目、复习进度和解法代码（JSON），自己留一份备份",
    exportButton: "导出",
    dangerTitle: "危险操作",
    devTitle: "退出所有设备",
    devSub: "怀疑账号泄露时使用：所有设备（包括这台）都会立即退出登录",
    devButton: "退出所有设备",
    devConfirm: "确定退出？再点一次",
    MISMATCH: "两次输入的新密码不一致",
    UNAUTHORIZED: "登录已失效，请重新登录",
    BAD_EMAIL: "邮箱格式不对",
    EMAIL_TAKEN: "这个邮箱已被其他账号使用",
    BAD_PASSWORD: "新密码长度需在 8–128 位之间",
    WRONG_PASSWORD: "当前密码不对",
    COOLDOWN: "发送太频繁，请稍后再试",
    RATE_LIMITED: "发送次数过多，请一小时后再试",
    MAIL_FAILED: "邮件发送失败，请检查邮箱地址或稍后再试",
    CODE_INVALID: "验证码不对",
    CODE_EXPIRED: "验证码已过期，请重新发送",
    CODE_LOCKED: "错误次数过多，请重新发送验证码",
    UNKNOWN: "操作失败，请重试",
  },
  en: {
    title: "Account",
    sub: "Email, password and signed-in devices",
    admin: "Admin",
    member: "Member",
    joined: "Joined",
    problems: (n: number) => `${n} problem${n === 1 ? "" : "s"}`,
    emailTitle: "Email",
    none: "Not set",
    verified: "Verified",
    unverified: "Unverified",
    required: "Please add an email first",
    requiredSub: "Every account needs an email so a forgotten password can be recovered. You can use ReCode as soon as it is verified.",
    newEmail: "New email",
    code: "Code",
    send: "Send code",
    sent: "Code sent, check your inbox",
    bind: "Add",
    change: "Change",
    bound: "Email saved",
    cancel: "Cancel",
    pwTitle: "Password",
    pwEdit: "Change",
    pwCurrent: "Current password",
    pwNew: "New password",
    pwConfirm: "Confirm new password",
    pwHint: "8–128 characters. Other devices are signed out; this one stays in",
    pwSubmit: "Save password",
    pwDone: "Password changed, other devices signed out",
    loginsTitle: "Recent sign-ins",
    loginsEmpty: "No sign-ins yet",
    thisDevice: "This device",
    dataTitle: "Your data",
    exportTitle: "Export data",
    exportSub: "Download every problem, review progress and solution code as JSON to keep a backup",
    exportButton: "Export",
    dangerTitle: "Danger zone",
    devTitle: "Sign out everywhere",
    devSub: "If the account may be compromised: every device, this one included, is signed out at once",
    devButton: "Sign out everywhere",
    devConfirm: "Sure? Click again",
    MISMATCH: "The new passwords do not match",
    UNAUTHORIZED: "Session expired, please sign in again",
    BAD_EMAIL: "Invalid email address",
    EMAIL_TAKEN: "This email belongs to another account",
    BAD_PASSWORD: "New password must be 8–128 characters",
    WRONG_PASSWORD: "Current password is wrong",
    COOLDOWN: "Too soon, please wait a moment",
    RATE_LIMITED: "Too many codes requested, try again in an hour",
    MAIL_FAILED: "Could not send the email, check the address or retry later",
    CODE_INVALID: "Wrong code",
    CODE_EXPIRED: "Code expired, send a new one",
    CODE_LOCKED: "Too many wrong tries, send a new code",
    UNKNOWN: "Something went wrong, please retry",
  },
};

type FormError = AccountError | "MISMATCH" | "UNKNOWN";
type Panel = "email" | "password" | null;

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
};

const card =
  "bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm";
const label = "text-sm font-semibold text-gray-700";
// Opens a panel; every row's action looks the same
const secondary =
  "shrink-0 self-start sm:self-auto h-8 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
const primary =
  "h-9 px-5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed";
const ghost =
  "h-9 px-4 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer";

// One setting: a name on the left, its current state, and an action on the right
function Row({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
      <span className="w-24 shrink-0 text-sm font-bold text-gray-900">
        {title}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export default function AccountClient({
  uiLanguage,
  username,
  admin,
  joined,
  problemCount,
  email,
  emailVerified,
  logins,
}: {
  uiLanguage: "zh" | "en";
  username: string;
  admin: boolean;
  joined: string;
  problemCount: number;
  email: string | null;
  emailVerified: boolean;
  logins: AccountLogin[];
}) {
  const t = COPY[uiLanguage];
  const [isPending, startTransition] = useTransition();
  const countdown = useCountdown();

  // Until an email is verified its form stays open: nothing else is usable
  const [panel, setPanel] = useState<Panel>(emailVerified ? null : "email");

  const [emailForm, setEmailForm] = useState({ email: "", code: "" });
  const [emailError, setEmailError] = useState<FormError | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState<FormError | null>(null);

  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const closePanel = () => {
    setPanel(emailVerified ? null : "email");
    setEmailForm({ email: "", code: "" });
    setEmailError(null);
    setCodeSent(false);
    setPwForm({ current: "", next: "", confirm: "" });
    setPwError(null);
  };

  const openPanel = (next: Panel) => {
    closePanel();
    setPanel(next);
  };

  const onSendCode = () => {
    setEmailError(null);
    startTransition(async () => {
      const res = await sendBindCode({ email: emailForm.email });
      if (res.ok) {
        setCodeSent(true);
        countdown.start(60);
      } else {
        setEmailError(res.error);
      }
    });
  };

  const onBind = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    startTransition(async () => {
      const res = await bindEmail(emailForm);
      if (res.ok) {
        // A first binding unlocks the rest of the site; reload into it
        if (!emailVerified) {
          window.location.replace("/home");
          return;
        }
        toast.success(t.bound);
        closePanel();
      } else {
        setEmailError(res.error);
      }
    });
  };

  const onChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwError("MISMATCH");
      return;
    }
    startTransition(async () => {
      const res = await changePassword(pwForm);
      if (res.ok) {
        toast.success(t.pwDone);
        closePanel();
      } else {
        setPwError(res.error);
      }
    });
  };

  const onLogoutAll = () => {
    if (!confirmingLogout) {
      setConfirmingLogout(true);
      return;
    }
    startTransition(() => logoutAllDevices());
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">{t.sub}</p>
      </div>

      {!emailVerified && (
        <div className="flex gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800">
          <TriangleAlert size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{t.required}</p>
            <p className="text-sm mt-1">{t.requiredSub}</p>
          </div>
        </div>
      )}

      {/* Who this is */}
      <div className={cn(card, "flex items-center gap-4 p-6")}>
        <Image
          src={avatar}
          alt=""
          width={56}
          height={56}
          className="size-14 rounded-full border border-gray-100 bg-orange-50"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-xl font-extrabold text-gray-900">
              {username}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                admin
                  ? "bg-orange-50 text-[#e08a00]"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {admin ? t.admin : t.member}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {t.joined} {joined} · {t.problems(problemCount)}
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className={cn(card, "divide-y divide-gray-100 px-6")}>
        <div className="space-y-4 py-5">
          <Row
            title={t.emailTitle}
            action={
              panel !== "email" && (
                <button
                  type="button"
                  className={secondary}
                  onClick={() => openPanel("email")}
                >
                  {email ? t.change : t.bind}
                </button>
              )
            }
          >
            {email ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="break-all text-sm text-gray-700">{email}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                    emailVerified
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  )}
                >
                  {emailVerified && <BadgeCheck size={12} />}
                  {emailVerified ? t.verified : t.unverified}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">{t.none}</span>
            )}
          </Row>

          {panel === "email" && (
            <form
              onSubmit={onBind}
              className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:ml-30"
            >
              <label className="block space-y-1.5">
                <span className={label}>{t.newEmail}</span>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    autoComplete="email"
                    autoFocus={emailVerified}
                    className="bg-white"
                    value={emailForm.email}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, email: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={onSendCode}
                    disabled={isPending || countdown.left > 0 || !emailForm.email}
                    className={cn(secondary, "h-9 min-w-24")}
                  >
                    {countdown.left > 0 ? `${countdown.left}s` : t.send}
                  </button>
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className={label}>{t.code}</span>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="bg-white tracking-[0.3em]"
                  value={emailForm.code}
                  onChange={(e) =>
                    setEmailForm({
                      ...emailForm,
                      code: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </label>

              {codeSent && !emailError && (
                <p className="text-xs font-semibold text-emerald-600">{t.sent}</p>
              )}
              {emailError && (
                <p className="text-sm font-semibold text-red-500">
                  {t[emailError]}
                </p>
              )}

              <div className="flex justify-end gap-2">
                {emailVerified && (
                  <button type="button" className={ghost} onClick={closePanel}>
                    {t.cancel}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={
                    isPending || !emailForm.email || emailForm.code.length !== 6
                  }
                  className={primary}
                >
                  {email ? t.change : t.bind}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4 py-5">
          <Row
            title={t.pwTitle}
            action={
              panel !== "password" && (
                <button
                  type="button"
                  className={secondary}
                  onClick={() => openPanel("password")}
                >
                  {t.pwEdit}
                </button>
              )
            }
          >
            <span className="text-sm tracking-widest text-gray-400">
              ••••••••
            </span>
          </Row>

          {panel === "password" && (
            <form
              onSubmit={onChangePassword}
              className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:ml-30"
            >
              {(
                [
                  ["current", t.pwCurrent, "current-password"],
                  ["next", t.pwNew, "new-password"],
                  ["confirm", t.pwConfirm, "new-password"],
                ] as const
              ).map(([field, text, autoComplete], index) => (
                <label key={field} className="block space-y-1.5">
                  <span className={label}>{text}</span>
                  <Input
                    type="password"
                    required
                    autoFocus={index === 0}
                    autoComplete={autoComplete}
                    className="bg-white"
                    value={pwForm[field]}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, [field]: e.target.value })
                    }
                  />
                </label>
              ))}

              <p className="text-xs text-gray-400">{t.pwHint}</p>
              {pwError && (
                <p className="text-sm font-semibold text-red-500">
                  {t[pwError]}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" className={ghost} onClick={closePanel}>
                  {t.cancel}
                </button>
                <button type="submit" disabled={isPending} className={primary}>
                  {t.pwSubmit}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <span className="w-24 shrink-0 text-sm font-bold text-gray-900 sm:pt-0.5">
              {t.loginsTitle}
            </span>
            {logins.length === 0 ? (
              <span className="text-sm text-gray-400">{t.loginsEmpty}</span>
            ) : (
              <ul className="min-w-0 flex-1 space-y-3">
                {logins.map((login) => {
                  const DeviceIcon = DEVICE_ICONS[login.device] ?? Monitor;
                  return (
                    <li key={login.id} className="flex items-start gap-3">
                      <DeviceIcon
                        size={16}
                        className="mt-0.5 shrink-0 text-gray-400"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                          <span>
                            {login.browser} · {login.os}
                          </span>
                          {login.current && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                              {t.thisDevice}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {login.ip} · {login.time}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="space-y-3">
        <p className="px-1 text-xs font-bold uppercase tracking-widest text-gray-400">
          {t.dataTitle}
        </p>
        <div
          className={cn(
            card,
            "flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{t.exportTitle}</p>
            <p className="mt-1 text-sm text-gray-500">{t.exportSub}</p>
          </div>
          {/* The response carries Content-Disposition, so this downloads */}
          <a
            href="/api/export"
            download
            data-testid="export-data"
            className={cn(
              secondary,
              "inline-flex h-9 items-center gap-1.5"
            )}
          >
            <Download size={14} />
            {t.exportButton}
          </a>
        </div>
      </div>

      {/* Danger zone */}
      <div className="space-y-3">
        <p className="px-1 text-xs font-bold uppercase tracking-widest text-red-400">
          {t.dangerTitle}
        </p>
        <div
          className={cn(
            card,
            "flex flex-col gap-4 border-red-100 p-6 sm:flex-row sm:items-center"
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{t.devTitle}</p>
            <p className="mt-1 text-sm text-gray-500">{t.devSub}</p>
          </div>
          <button
            type="button"
            onClick={onLogoutAll}
            onBlur={() => setConfirmingLogout(false)}
            disabled={isPending}
            className={cn(
              "shrink-0 h-9 px-5 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-40",
              confirmingLogout
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-red-50 text-red-600 hover:bg-red-100"
            )}
          >
            {confirmingLogout ? t.devConfirm : t.devButton}
          </button>
        </div>
      </div>
    </div>
  );
}

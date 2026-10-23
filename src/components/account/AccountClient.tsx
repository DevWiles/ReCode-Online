"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { bindEmail, logoutAllDevices, sendBindCode } from "@/actions/account";
import { changePassword } from "@/actions/password";
import { useCountdown } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";

import { BadgeCheck, KeyRound, LogOut, Mail, TriangleAlert } from "lucide-react";

import type { AccountError } from "@/types";

const COPY = {
  zh: {
    title: "账号安全",
    sub: "邮箱、密码和登录设备",
    emailTitle: "邮箱",
    current: "当前邮箱",
    none: "未绑定",
    verified: "已验证",
    noEmailWarn: "还没绑定邮箱，忘记密码时只能找管理员重置",
    newEmail: "新邮箱",
    code: "验证码",
    send: "发送验证码",
    sent: "验证码已发送，请查收邮件",
    bind: "绑定",
    change: "更换",
    bound: "邮箱已绑定",
    pwTitle: "修改密码",
    pwCurrent: "当前密码",
    pwNew: "新密码",
    pwConfirm: "确认新密码",
    pwHint: "8–128 位。修改后其他设备会退出登录，这台设备保持登录",
    pwSubmit: "修改密码",
    pwDone: "密码已修改，其他设备已退出登录",
    devTitle: "登录设备",
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
    emailTitle: "Email",
    current: "Current email",
    none: "Not set",
    verified: "Verified",
    noEmailWarn: "No email yet: if you forget your password only an admin can reset it",
    newEmail: "New email",
    code: "Code",
    send: "Send code",
    sent: "Code sent, check your inbox",
    bind: "Add",
    change: "Change",
    bound: "Email saved",
    pwTitle: "Change password",
    pwCurrent: "Current password",
    pwNew: "New password",
    pwConfirm: "Confirm new password",
    pwHint: "8–128 characters. Other devices are signed out; this one stays in",
    pwSubmit: "Change password",
    pwDone: "Password changed, other devices signed out",
    devTitle: "Devices",
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

const card =
  "bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm p-6 space-y-5";
const heading =
  "flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest";
const label = "text-sm font-semibold text-gray-700";
const primary =
  "h-9 px-5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed";

export default function AccountClient({
  uiLanguage,
  username,
  email,
  emailVerified,
}: {
  uiLanguage: "zh" | "en";
  username: string;
  email: string | null;
  emailVerified: boolean;
}) {
  const t = COPY[uiLanguage];
  const [isPending, startTransition] = useTransition();
  const countdown = useCountdown();

  const [emailForm, setEmailForm] = useState({ email: "", code: "" });
  const [emailError, setEmailError] = useState<FormError | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState<FormError | null>(null);

  const [confirmingLogout, setConfirmingLogout] = useState(false);

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
        toast.success(t.bound);
        setEmailForm({ email: "", code: "" });
        setCodeSent(false);
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
        setPwForm({ current: "", next: "", confirm: "" });
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
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          {username} · {t.sub}
        </p>
      </div>

      {/* Email */}
      <form onSubmit={onBind} className={card}>
        <div className={heading}>
          <Mail size={14} />
          {t.emailTitle}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className={label}>{t.current}</span>
          {email ? (
            <>
              <span className="font-mono text-sm text-gray-900 break-all">
                {email}
              </span>
              {emailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                  <BadgeCheck size={12} />
                  {t.verified}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">{t.none}</span>
          )}
        </div>

        {!email && (
          <p className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-800">
            <TriangleAlert size={16} className="shrink-0" />
            {t.noEmailWarn}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-1.5">
            <span className={label}>{t.newEmail}</span>
            <div className="flex gap-2">
              <Input
                type="email"
                autoComplete="email"
                value={emailForm.email}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, email: e.target.value })
                }
              />
              <button
                type="button"
                onClick={onSendCode}
                disabled={isPending || countdown.left > 0 || !emailForm.email}
                className="shrink-0 h-9 px-3 rounded-xl bg-orange-50 text-[#e08a00] text-sm font-bold hover:bg-orange-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {countdown.left > 0 ? `${countdown.left}s` : t.send}
              </button>
            </div>
          </label>
          <label className="space-y-1.5">
            <span className={label}>{t.code}</span>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={emailForm.code}
              onChange={(e) =>
                setEmailForm({
                  ...emailForm,
                  code: e.target.value.replace(/\D/g, ""),
                })
              }
            />
          </label>
          <button
            type="submit"
            disabled={isPending || !emailForm.email || emailForm.code.length !== 6}
            className={primary}
          >
            {email ? t.change : t.bind}
          </button>
        </div>

        {codeSent && !emailError && (
          <p className="text-xs font-semibold text-emerald-600">{t.sent}</p>
        )}
        {emailError && (
          <p className="text-sm font-semibold text-red-500">{t[emailError]}</p>
        )}
      </form>

      {/* Password */}
      <form onSubmit={onChangePassword} className={card}>
        <div className={heading}>
          <KeyRound size={14} />
          {t.pwTitle}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              ["current", t.pwCurrent, "current-password"],
              ["next", t.pwNew, "new-password"],
              ["confirm", t.pwConfirm, "new-password"],
            ] as const
          ).map(([field, text, autoComplete]) => (
            <label key={field} className="space-y-1.5">
              <span className={label}>{text}</span>
              <Input
                type="password"
                required
                autoComplete={autoComplete}
                value={pwForm[field]}
                onChange={(e) =>
                  setPwForm({ ...pwForm, [field]: e.target.value })
                }
              />
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-400">{t.pwHint}</p>
        {pwError && (
          <p className="text-sm font-semibold text-red-500">{t[pwError]}</p>
        )}

        <button type="submit" disabled={isPending} className={primary}>
          {t.pwSubmit}
        </button>
      </form>

      {/* Sessions */}
      <div className={card}>
        <div className={heading}>
          <LogOut size={14} />
          {t.devTitle}
        </div>
        <p className="text-sm text-gray-500">{t.devSub}</p>
        <button
          type="button"
          onClick={onLogoutAll}
          onBlur={() => setConfirmingLogout(false)}
          disabled={isPending}
          className={cn(
            "h-9 px-5 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-40",
            confirmingLogout
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-red-50 text-red-600 hover:bg-red-100"
          )}
        >
          {confirmingLogout ? t.devConfirm : t.devButton}
        </button>
      </div>
    </div>
  );
}

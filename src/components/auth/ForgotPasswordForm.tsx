"use client";

import { useState } from "react";
import Link from "next/link";

import { resetPassword, sendResetCode } from "@/actions/password";
import {
  AuthError,
  AuthField,
  AuthShell,
  AuthSubmit,
  CodeInput,
  authInputClass,
  useCountdown,
  type AuthLang,
} from "@/components/auth/AuthShell";

import { CheckCircle2, KeyRound, Lock, ShieldCheck, User } from "lucide-react";

import type { ResetPasswordError } from "@/types";

const COPY = {
  zh: {
    title: "找回密码",
    sub: "验证码会发到账号绑定的邮箱",
    account: "账号",
    accountPlaceholder: "用户名或邮箱",
    code: "验证码",
    codePlaceholder: "6 位数字",
    send: "发送验证码",
    sent: "如果该账号存在并已绑定邮箱，验证码已发出，请查收（也看看垃圾箱）",
    password: "新密码",
    passwordPlaceholder: "至少 8 位",
    confirm: "确认新密码",
    submit: "重置密码",
    pending: "提交中...",
    done: "密码已重置，所有设备都已退出登录",
    toLogin: "用新密码登录",
    back: "返回登录",
    noEmail: "账号没绑定邮箱？请联系管理员重置密码。",
    MISMATCH: "两次输入的密码不一致",
    BAD_PASSWORD: "密码长度需在 8–128 位之间",
    CODE_INVALID: "验证码不对",
    CODE_EXPIRED: "验证码已过期，请重新发送",
    CODE_LOCKED: "错误次数过多，请重新发送验证码",
    UNKNOWN: "操作失败，请重试",
  },
  en: {
    title: "Reset password",
    sub: "We email a code to the address on the account",
    account: "Account",
    accountPlaceholder: "Username or email",
    code: "Code",
    codePlaceholder: "6 digits",
    send: "Send code",
    sent: "If the account exists and has an email, a code is on its way (check spam too)",
    password: "New password",
    passwordPlaceholder: "8 characters or more",
    confirm: "Confirm new password",
    submit: "Reset password",
    pending: "Submitting...",
    done: "Password reset. Every device has been signed out",
    toLogin: "Sign in with the new password",
    back: "Back to sign in",
    noEmail: "No email on the account? Ask an admin to reset it.",
    MISMATCH: "The passwords do not match",
    BAD_PASSWORD: "Password must be 8–128 characters",
    CODE_INVALID: "Wrong code",
    CODE_EXPIRED: "Code expired, send a new one",
    CODE_LOCKED: "Too many wrong tries, send a new code",
    UNKNOWN: "Something went wrong, please retry",
  },
};

type FormError = ResetPasswordError | "MISMATCH" | "UNKNOWN";

export default function ForgotPasswordForm() {
  const [lang, setLang] = useState<AuthLang>("zh");
  const [form, setForm] = useState({
    identifier: "",
    code: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<FormError | null>(null);
  const [notice, setNotice] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const countdown = useCountdown();

  const t = COPY[lang];
  const set = (field: keyof typeof form) => (value: string) =>
    setForm({ ...form, [field]: value });

  const onSend = async () => {
    if (!form.identifier.trim()) return;
    setError(null);
    setSending(true);

    try {
      await sendResetCode({ identifier: form.identifier });
      setNotice(true);
      countdown.start(60);
    } catch {
      setError("UNKNOWN");
    }

    setSending(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm) {
      setError("MISMATCH");
      return;
    }

    setPending(true);
    try {
      const res = await resetPassword(form);
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error);
      }
    } catch {
      setError("UNKNOWN");
    }
    setPending(false);
  };

  return (
    <AuthShell
      lang={lang}
      onToggleLang={() => setLang(lang === "zh" ? "en" : "zh")}
      icon={KeyRound}
      title={t.title}
      sub={t.sub}
      footer={
        !done && (
          <div className="space-y-3 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-[#e08a00] hover:text-[#ffa116]"
            >
              {t.back}
            </Link>
            <p className="text-xs text-gray-400 font-medium">{t.noEmail}</p>
          </div>
        )
      }
    >
      {done ? (
        <div className="space-y-6 text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <p className="font-semibold text-gray-700">{t.done}</p>
          <Link
            href="/login"
            className="block w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-200"
          >
            {t.toLogin}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <AuthField icon={User} label={t.account}>
            <input
              required
              autoFocus
              autoComplete="username"
              value={form.identifier}
              className={authInputClass}
              placeholder={t.accountPlaceholder}
              onChange={(e) => set("identifier")(e.target.value)}
            />
          </AuthField>

          <AuthField icon={ShieldCheck} label={t.code}>
            <CodeInput
              value={form.code}
              onChange={set("code")}
              placeholder={t.codePlaceholder}
              sendLabel={t.send}
              left={countdown.left}
              sending={sending}
              onSend={onSend}
            />
            {notice && (
              <p className="text-xs font-semibold text-emerald-600 ml-1">
                {t.sent}
              </p>
            )}
          </AuthField>

          <AuthField icon={Lock} label={t.password}>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={form.password}
              className={authInputClass}
              placeholder={t.passwordPlaceholder}
              onChange={(e) => set("password")(e.target.value)}
            />
          </AuthField>

          <AuthField icon={Lock} label={t.confirm}>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              className={authInputClass}
              onChange={(e) => set("confirm")(e.target.value)}
            />
          </AuthField>

          <AuthError message={error ? t[error] : null} />

          <AuthSubmit
            pending={pending}
            label={t.submit}
            pendingLabel={t.pending}
          />
        </form>
      )}
    </AuthShell>
  );
}

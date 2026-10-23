"use client";

import { useState } from "react";
import Link from "next/link";

import { register, sendRegisterCode } from "@/actions/register";
import {
  AuthError,
  AuthField,
  AuthShell,
  AuthSubmit,
  CodeInput,
  authInputClass,
  reloadIfStaleDeployment,
  useCountdown,
  type AuthLang,
} from "@/components/auth/AuthShell";

import { Lock, Mail, Ticket, User, UserPlus, ShieldCheck } from "lucide-react";

import type { RegisterError } from "@/types";

const COPY = {
  zh: {
    title: "注册",
    sub: "凭邀请码创建你的 ReCode 账号",
    invite: "邀请码",
    invitePlaceholder: "XXXX-XXXX-XXXX",
    username: "用户名",
    usernameHint: "3–32 位字母、数字、_ . -",
    email: "邮箱",
    emailPlaceholder: "用于验证和找回密码",
    code: "验证码",
    codePlaceholder: "6 位数字",
    send: "发送验证码",
    sent: "验证码已发送，请查收邮件（也看看垃圾箱）",
    password: "密码",
    passwordPlaceholder: "至少 8 位",
    confirm: "确认密码",
    submit: "注册并登录",
    pending: "注册中...",
    haveAccount: "已有账号？",
    login: "去登录",
    MISMATCH: "两次输入的密码不一致",
    INVITE_INVALID: "邀请码无效、已用完或已过期",
    BAD_USERNAME: "用户名格式不对",
    USERNAME_TAKEN: "用户名已被占用",
    BAD_EMAIL: "邮箱格式不对",
    EMAIL_TAKEN: "这个邮箱已经注册过了",
    BAD_PASSWORD: "密码长度需在 8–128 位之间",
    COOLDOWN: "发送太频繁，请稍后再试",
    RATE_LIMITED: "发送次数过多，请一小时后再试",
    MAIL_FAILED: "邮件发送失败，请检查邮箱地址或稍后再试",
    CODE_INVALID: "验证码不对",
    CODE_EXPIRED: "验证码已过期，请重新发送",
    CODE_LOCKED: "错误次数过多，请重新发送验证码",
    UNKNOWN: "注册失败，请重试",
  },
  en: {
    title: "Sign up",
    sub: "Create your ReCode account with an invite code",
    invite: "Invite code",
    invitePlaceholder: "XXXX-XXXX-XXXX",
    username: "Username",
    usernameHint: "3–32 letters, digits, _ . -",
    email: "Email",
    emailPlaceholder: "For verification and password recovery",
    code: "Code",
    codePlaceholder: "6 digits",
    send: "Send code",
    sent: "Code sent. Check your inbox (and spam folder)",
    password: "Password",
    passwordPlaceholder: "8 characters or more",
    confirm: "Confirm password",
    submit: "Sign up",
    pending: "Signing up...",
    haveAccount: "Already have an account?",
    login: "Sign in",
    MISMATCH: "The passwords do not match",
    INVITE_INVALID: "Invite code is invalid, used up or expired",
    BAD_USERNAME: "Invalid username",
    USERNAME_TAKEN: "Username already taken",
    BAD_EMAIL: "Invalid email address",
    EMAIL_TAKEN: "This email is already registered",
    BAD_PASSWORD: "Password must be 8–128 characters",
    COOLDOWN: "Too soon, please wait a moment",
    RATE_LIMITED: "Too many codes requested, try again in an hour",
    MAIL_FAILED: "Could not send the email, check the address or retry later",
    CODE_INVALID: "Wrong code",
    CODE_EXPIRED: "Code expired, send a new one",
    CODE_LOCKED: "Too many wrong tries, send a new code",
    UNKNOWN: "Sign-up failed, please retry",
  },
};

type FormError = RegisterError | "MISMATCH" | "UNKNOWN";

export default function RegisterForm({ invite }: { invite: string }) {
  const [lang, setLang] = useState<AuthLang>("zh");
  const [form, setForm] = useState({
    inviteCode: invite,
    username: "",
    email: "",
    code: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<FormError | null>(null);
  const [notice, setNotice] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(false);
  const countdown = useCountdown();

  const t = COPY[lang];
  const set = (field: keyof typeof form) => (value: string) =>
    setForm({ ...form, [field]: value });

  const onSend = async () => {
    setError(null);
    setNotice(false);
    setSending(true);

    try {
      const res = await sendRegisterCode({
        inviteCode: form.inviteCode,
        email: form.email,
      });
      if (res.ok) {
        setNotice(true);
        countdown.start(60);
      } else {
        setError(res.error);
      }
    } catch (err) {
      if (reloadIfStaleDeployment(err)) return;
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
      const res = await register(form);
      if (res.ok) {
        window.location.replace("/home");
        return;
      }
      setError(res.error);
    } catch (err) {
      if (reloadIfStaleDeployment(err)) return;
      setError("UNKNOWN");
    }
    setPending(false);
  };

  return (
    <AuthShell
      lang={lang}
      onToggleLang={() => setLang(lang === "zh" ? "en" : "zh")}
      icon={UserPlus}
      title={t.title}
      sub={t.sub}
      footer={
        <p className="text-center text-sm text-gray-500 font-medium">
          {t.haveAccount}{" "}
          <Link
            href="/login"
            className="font-bold text-[#e08a00] hover:text-[#ffa116]"
          >
            {t.login}
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <AuthField icon={Ticket} label={t.invite}>
          <input
            required
            autoComplete="off"
            value={form.inviteCode}
            className={`${authInputClass} uppercase tracking-wider`}
            placeholder={t.invitePlaceholder}
            onChange={(e) => set("inviteCode")(e.target.value)}
          />
        </AuthField>

        <AuthField icon={User} label={t.username} hint={t.usernameHint}>
          <input
            required
            autoComplete="username"
            value={form.username}
            className={authInputClass}
            onChange={(e) => set("username")(e.target.value)}
          />
        </AuthField>

        <AuthField icon={Mail} label={t.email}>
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            className={authInputClass}
            placeholder={t.emailPlaceholder}
            onChange={(e) => set("email")(e.target.value)}
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

        <AuthSubmit pending={pending} label={t.submit} pendingLabel={t.pending} />
      </form>
    </AuthShell>
  );
}

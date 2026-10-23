"use client";

import { useState } from "react";
import Link from "next/link";

import { login } from "@/actions/auth";
import {
  AuthError,
  AuthField,
  AuthShell,
  AuthSubmit,
  authInputClass,
  type AuthLang,
} from "@/components/auth/AuthShell";

import { Lock, User, Eye, EyeOff, ShieldCheck } from "lucide-react";

import type { LoginResult } from "@/types";

const COPY = {
  zh: {
    title: "ReCode",
    sub: "请登录后继续",
    labelUser: "账号",
    labelPass: "密码",
    placeholderUser: "用户名或邮箱",
    placeholderPass: "请输入密码",
    remember: "30 天内免登录",
    forgot: "忘记密码？",
    submit: "登录",
    pending: "登录中...",
    noAccount: "有邀请码？",
    register: "注册账号",
    notice: "登录行为会被记录 IP 与设备信息",
    EMPTY_FIELDS: "账号和密码不能为空",
    BAD_CREDENTIALS: "账号或密码错误",
    RATE_LIMITED: "失败次数过多，请 15 分钟后再试",
    DISABLED: "该账号已被管理员禁用",
    UNKNOWN: "登录失败，请重试",
  },
  en: {
    title: "ReCode",
    sub: "Sign in to continue",
    labelUser: "Account",
    labelPass: "Password",
    placeholderUser: "Username or email",
    placeholderPass: "Enter your password",
    remember: "Keep me signed in for 30 days",
    forgot: "Forgot password?",
    submit: "Sign in",
    pending: "Signing in...",
    noAccount: "Have an invite code?",
    register: "Create an account",
    notice: "Each attempt is logged with its IP and device",
    EMPTY_FIELDS: "Username and password are required",
    BAD_CREDENTIALS: "Wrong username or password",
    RATE_LIMITED: "Too many failed attempts, try again in 15 minutes",
    DISABLED: "This account has been disabled by an admin",
    UNKNOWN: "Sign-in failed, please retry",
  },
};

type LoginError = NonNullable<LoginResult["error"]> | "UNKNOWN";

export default function LoginForm({ next }: { next: string }) {
  const [lang, setLang] = useState<AuthLang>("zh");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: true,
  });

  const t = COPY[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const res = await login(formData);

      if (res?.ok) {
        // Full reload so the middleware and the root layout see the new cookie
        window.location.replace(next);
        return;
      }

      setError(res?.error ?? "UNKNOWN");
    } catch (err) {
      console.error("Login error:", err);
      setError("UNKNOWN");
    }

    setIsPending(false);
  };

  return (
    <AuthShell
      lang={lang}
      onToggleLang={() => setLang(lang === "zh" ? "en" : "zh")}
      icon={Lock}
      title={t.title}
      sub={t.sub}
      footer={
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-500 font-medium">
            {t.noAccount}{" "}
            <Link
              href="/register"
              className="font-bold text-[#e08a00] hover:text-[#ffa116]"
            >
              {t.register}
            </Link>
          </p>
          <p className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
            <ShieldCheck size={13} />
            {t.notice}
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <AuthField icon={User} label={t.labelUser}>
          <input
            required
            autoFocus
            autoComplete="username"
            value={formData.username}
            className={authInputClass}
            placeholder={t.placeholderUser}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </AuthField>

        <AuthField icon={Lock} label={t.labelPass}>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              className={`${authInputClass} pr-14`}
              placeholder={t.placeholderPass}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </AuthField>

        <div className="flex items-center justify-between gap-4 -mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.remember}
              onChange={(e) =>
                setFormData({ ...formData, remember: e.target.checked })
              }
              className="size-4 accent-[#ffa116] cursor-pointer"
            />
            {t.remember}
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-gray-400 hover:text-gray-700 shrink-0"
          >
            {t.forgot}
          </Link>
        </div>

        <AuthError message={error ? t[error] : null} />

        <AuthSubmit pending={isPending} label={t.submit} pendingLabel={t.pending} />
      </form>
    </AuthShell>
  );
}

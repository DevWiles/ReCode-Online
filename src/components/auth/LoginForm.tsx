"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { login } from "@/actions/auth";
import { cn } from "@/lib/utils";

import { Lock, User, Eye, EyeOff, ShieldCheck, Globe } from "lucide-react";

const COPY = {
  zh: {
    title: "ReCode",
    sub: "请登录后继续",
    labelUser: "账号",
    labelPass: "密码",
    placeholderUser: "用户名",
    placeholderPass: "请输入密码",
    submit: "登录",
    pending: "登录中...",
    notice: "登录行为会被记录 IP 与设备信息",
    EMPTY_FIELDS: "账号和密码不能为空",
    BAD_CREDENTIALS: "账号或密码错误",
    RATE_LIMITED: "失败次数过多，请 15 分钟后再试",
    UNKNOWN: "登录失败，请重试",
  },
  en: {
    title: "ReCode",
    sub: "Sign in to continue",
    labelUser: "Account",
    labelPass: "Password",
    placeholderUser: "Username",
    placeholderPass: "Enter your password",
    submit: "Sign in",
    pending: "Signing in...",
    notice: "Each attempt is logged with its IP and device",
    EMPTY_FIELDS: "Username and password are required",
    BAD_CREDENTIALS: "Wrong username or password",
    RATE_LIMITED: "Too many failed attempts, try again in 15 minutes",
    UNKNOWN: "Sign-in failed, please retry",
  },
};

export default function LoginForm({ next }: { next: string }) {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<keyof typeof COPY.zh | null>(null);
  const [formData, setFormData] = useState({ username: "", password: "" });

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
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[#f8f9fa] z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-10 border border-white/60"
      >
        <button
          type="button"
          onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          className="absolute top-8 right-8 flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <Globe size={14} />
          {lang === "zh" ? "EN" : "中文"}
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-gray-900 text-white rounded-2xl mb-6 shadow-xl rotate-3">
            <Lock size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {t.title}
          </h1>
          <p className="text-gray-500 mt-3 text-lg font-medium opacity-80">
            {t.sub}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-3 group">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <User
                size={14}
                className="group-focus-within:text-[#ffa116] transition-colors"
              />
              {t.labelUser}
            </label>
            <input
              required
              autoFocus
              autoComplete="username"
              value={formData.username}
              className="w-full px-5 py-4 bg-white/50 border border-transparent rounded-2xl focus:ring-4 focus:ring-orange-100 focus:bg-white focus:border-[#ffa116]/30 outline-none transition-all placeholder:text-gray-300 shadow-sm text-gray-900 font-medium"
              placeholder={t.placeholderUser}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>

          <div className="space-y-3 group">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Lock
                size={14}
                className="group-focus-within:text-[#ffa116] transition-colors"
              />
              {t.labelPass}
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                className="w-full px-5 py-4 pr-14 bg-white/50 border border-transparent rounded-2xl focus:ring-4 focus:ring-orange-100 focus:bg-white focus:border-[#ffa116]/30 outline-none transition-all placeholder:text-gray-300 shadow-sm text-gray-900 font-medium"
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
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
            >
              {t[error]}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "relative w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 hover:shadow-2xl hover:shadow-gray-300 transition-all active:scale-[0.98] overflow-hidden group",
              isPending ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            {!isPending && (
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
            )}
            <span className="relative z-10">
              {isPending ? t.pending : t.submit}
            </span>
          </button>
        </form>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
          <ShieldCheck size={13} />
          {t.notice}
        </p>
      </motion.div>
    </div>
  );
}

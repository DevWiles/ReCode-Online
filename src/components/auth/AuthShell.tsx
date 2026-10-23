"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { Globe, type LucideIcon } from "lucide-react";

export type AuthLang = "zh" | "en";

/** The frosted card on a dotted background shared by login, register and reset. */
export function AuthShell({
  lang,
  onToggleLang,
  icon: Icon,
  title,
  sub,
  children,
  footer,
}: {
  lang: AuthLang;
  onToggleLang: () => void;
  icon: LucideIcon;
  title: string;
  sub: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
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
        className="relative z-10 max-w-md w-full bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-white/60"
      >
        <button
          type="button"
          onClick={onToggleLang}
          className="absolute top-8 right-8 flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <Globe size={14} />
          {lang === "zh" ? "EN" : "中文"}
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gray-900 text-white rounded-2xl mb-6 shadow-xl rotate-3">
            <Icon size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {title}
          </h1>
          <p className="text-gray-500 mt-3 text-lg font-medium opacity-80">
            {sub}
          </p>
        </div>

        {children}

        {footer && <div className="mt-8">{footer}</div>}
      </motion.div>
    </div>
  );
}

export const authInputClass =
  "w-full px-5 py-4 bg-white/50 border border-transparent rounded-2xl focus:ring-4 focus:ring-orange-100 focus:bg-white focus:border-[#ffa116]/30 outline-none transition-all placeholder:text-gray-300 shadow-sm text-gray-900 font-medium";

/** Label with an icon that lights up while its input has focus. */
export function AuthField({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 group">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
        <Icon
          size={14}
          className="group-focus-within:text-[#ffa116] transition-colors"
        />
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 ml-1">{hint}</p>}
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
    >
      {message}
    </motion.p>
  );
}

export function AuthSubmit({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "relative w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 hover:shadow-2xl hover:shadow-gray-300 transition-all active:scale-[0.98] overflow-hidden group",
        pending ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      {!pending && (
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
      )}
      <span className="relative z-10">{pending ? pendingLabel : label}</span>
    </button>
  );
}

/** Seconds left before a code may be requested again; start(60) after a send. */
export function useCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return { left, start: setLeft };
}

/** Input with a "send code" button glued to its right edge. */
export function CodeInput({
  value,
  onChange,
  placeholder,
  sendLabel,
  left,
  sending,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  sendLabel: string;
  left: number;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="relative">
      <input
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        className={cn(authInputClass, "pr-32 tracking-[0.3em]")}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      />
      <button
        type="button"
        onClick={onSend}
        disabled={sending || left > 0}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-orange-50 text-[#e08a00] text-sm font-bold hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        {left > 0 ? `${left}s` : sendLabel}
      </button>
    </div>
  );
}

/**
 * A page left open across a deploy still calls the old build's server
 * actions, which the new server no longer knows. Reload once to pick up the
 * new build; returns true when it did. A reload in the last 30 seconds means
 * reloading did not help, so the error is shown instead of looping.
 */
export function reloadIfStaleDeployment(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/Server Action|older or newer deployment/i.test(message)) return false;

  const KEY = "recode:stale-reload";
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Storage unavailable: still worth one reload
  }

  window.location.reload();
  return true;
}

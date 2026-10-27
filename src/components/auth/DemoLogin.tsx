"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { startDemo } from "@/actions/demo";
import { AuthShell, type AuthLang } from "@/components/auth/AuthShell";

import { ArrowRight, Github, Sparkles } from "lucide-react";

const COPY = {
  zh: {
    sub: "算法刷题间隔复习工具 · 在线演示",
    points: [
      "按遗忘曲线排期，今天该复习哪些题一目了然",
      "已预置 14 道 LeetCode 热题与多种解法",
      "每位访客独立沙盒，随便改，6 小时后自动清除",
    ],
    start: "一键体验",
    pending: "正在准备你的沙盒...",
    RATE_LIMITED: "体验次数过多，请稍后再试",
    UNKNOWN: "进入失败，请重试",
    upstream: "原项目",
    disclaimer: "仅作个人学习展示，无商业用途，如有侵权请联系下架。",
  },
  en: {
    sub: "Spaced-repetition for algorithm practice · Live demo",
    points: [
      "Reviews scheduled on the forgetting curve, so today's list is ready",
      "Preloaded with 14 popular LeetCode problems and several solutions",
      "Every visitor gets a private sandbox, wiped after 6 hours",
    ],
    start: "Try the demo",
    pending: "Preparing your sandbox...",
    RATE_LIMITED: "Too many sandboxes from here, please try again later",
    UNKNOWN: "Could not start the demo, please retry",
    upstream: "Original project",
    disclaimer: "For personal learning and showcase only, no commercial use. Contact me to take it down.",
  },
};

/** The demo instance's login screen: one button, no credentials. */
export default function DemoLogin({
  next,
  upstreamUrl,
}: {
  next: string;
  upstreamUrl: string;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<AuthLang>("zh");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<"RATE_LIMITED" | "UNKNOWN" | null>(null);

  const t = COPY[lang];

  const handleStart = async () => {
    setIsPending(true);
    setError(null);
    try {
      const result = await startDemo();
      if (result.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      setError(result.error === "RATE_LIMITED" ? "RATE_LIMITED" : "UNKNOWN");
    } catch {
      setError("UNKNOWN");
    }
    setIsPending(false);
  };

  return (
    <AuthShell
      lang={lang}
      onToggleLang={() => setLang(lang === "zh" ? "en" : "zh")}
      icon={Sparkles}
      title="ReCode"
      sub={t.sub}
      footer={
        <p className="text-center text-xs leading-relaxed text-gray-400">
          {t.upstream}{" "}
          <a
            href={upstreamUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-gray-600 underline underline-offset-2 hover:text-gray-900"
          >
            <Github size={12} />
            CoisiniIce/ReCode
          </a>
          <br />
          {t.disclaimer}
        </p>
      }
    >
      <ul className="mb-8 space-y-3">
        {t.points.map((point) => (
          <li key={point} className="flex gap-3 text-sm font-medium text-gray-600">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffa116]" />
            {point}
          </li>
        ))}
      </ul>

      {error && (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {t[error]}
        </p>
      )}

      <button
        type="button"
        onClick={handleStart}
        disabled={isPending}
        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-lg font-bold text-white shadow-xl shadow-gray-900/20 transition-all hover:bg-black active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? t.pending : t.start}
        {!isPending && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />}
      </button>
    </AuthShell>
  );
}

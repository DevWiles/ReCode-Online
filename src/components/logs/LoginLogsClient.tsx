"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import {
  Activity,
  CheckCircle2,
  XCircle,
  Globe2,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type { LoginLogsClientProps, LoginLogFilter } from "@/types";

const COPY = {
  zh: {
    title: "登录日志",
    sub: "每一次登录尝试的 IP 与设备记录",
    total: "总记录",
    success: "成功",
    failed: "失败",
    ips: "独立 IP",
    all: "全部",
    colTime: "时间",
    colAccount: "账号",
    colResult: "结果",
    colIp: "IP 地址",
    colDevice: "设备",
    ok: "成功",
    fail: "失败",
    thisDevice: "当前设备",
    empty: "暂无记录",
    prev: "上一页",
    next: "下一页",
    page: "第",
    of: "页 / 共",
    pages: "页",
    reasons: {
      BAD_PASSWORD: "密码错误",
      NO_SUCH_USER: "账号不存在",
      RATE_LIMITED: "已被限流",
    } as Record<string, string>,
  },
  en: {
    title: "Login Logs",
    sub: "IP and device behind every sign-in attempt",
    total: "Records",
    success: "Success",
    failed: "Failed",
    ips: "Unique IPs",
    all: "All",
    colTime: "Time",
    colAccount: "Account",
    colResult: "Result",
    colIp: "IP address",
    colDevice: "Device",
    ok: "Success",
    fail: "Failed",
    thisDevice: "This device",
    empty: "No records yet",
    prev: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    pages: "",
    reasons: {
      BAD_PASSWORD: "Wrong password",
      NO_SUCH_USER: "No such user",
      RATE_LIMITED: "Rate limited",
    } as Record<string, string>,
  },
};

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
  Bot: Bot,
};

export default function LoginLogsClient({
  uiLanguage,
  rows,
  filter,
  page,
  pageCount,
  total,
  successCount,
  failureCount,
  ipCount,
  currentIp,
}: LoginLogsClientProps) {
  const t = COPY[uiLanguage];

  const stats = [
    { label: t.total, value: total, icon: Activity, tone: "text-gray-900" },
    {
      label: t.success,
      value: successCount,
      icon: CheckCircle2,
      tone: "text-emerald-600",
    },
    { label: t.failed, value: failureCount, icon: XCircle, tone: "text-red-500" },
    { label: t.ips, value: ipCount, icon: Globe2, tone: "text-blue-600" },
  ];

  const filters: { key: LoginLogFilter; label: string }[] = [
    { key: "all", label: t.all },
    { key: "success", label: t.success },
    { key: "failed", label: t.failed },
  ];

  const hrefFor = (next: Partial<{ filter: LoginLogFilter; page: number }>) => {
    const params = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    const nextPage = next.page ?? page;

    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextPage > 1) params.set("page", String(nextPage));

    const query = params.toString();
    return query ? `/logs?${query}` : "/logs";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">{t.sub}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <stat.icon size={14} />
              {stat.label}
            </div>
            <p className={cn("mt-3 text-4xl font-extrabold tracking-tight", stat.tone)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="inline-flex gap-2 p-1.5 bg-gray-100/70 rounded-2xl">
        {filters.map((item) => (
          <Link
            key={item.key}
            href={hrefFor({ filter: item.key, page: 1 })}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-bold transition-all",
              filter === item.key
                ? "bg-white text-gray-900 shadow-md ring-1 ring-black/5"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/70">
                <th className="px-6 py-4">{t.colTime}</th>
                <th className="px-6 py-4">{t.colAccount}</th>
                <th className="px-6 py-4">{t.colResult}</th>
                <th className="px-6 py-4">{t.colIp}</th>
                <th className="px-6 py-4">{t.colDevice}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-gray-400 font-medium"
                  >
                    {t.empty}
                  </td>
                </tr>
              )}

              {rows.map((row) => {
                const DeviceIcon = DEVICE_ICONS[row.device] ?? Monitor;

                return (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100/80 last:border-0 hover:bg-white/60 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {row.time}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {row.username}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold",
                          row.success
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-500"
                        )}
                      >
                        {row.success ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <XCircle size={13} />
                        )}
                        {row.success
                          ? t.ok
                          : t.reasons[row.reason ?? ""] ?? t.fail}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-700 whitespace-nowrap">
                      {row.ip}
                      {row.ip === currentIp && (
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-orange-50 text-[#ffa116] text-[10px] font-bold uppercase tracking-wide">
                          {t.thisDevice}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600" title={row.userAgent}>
                      <div className="flex items-center gap-2">
                        <DeviceIcon size={15} className="text-gray-400 shrink-0" />
                        <span className="font-medium">
                          {row.browser}
                          <span className="text-gray-400"> · {row.os}</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 font-medium">
            {uiLanguage === "zh"
              ? `${t.page} ${page} ${t.of} ${pageCount} ${t.pages}`
              : `${t.page} ${page} ${t.of} ${pageCount}`}
          </span>

          <div className="flex gap-2">
            <Link
              href={hrefFor({ page: Math.max(1, page - 1) })}
              aria-disabled={page <= 1}
              className={cn(
                "inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold bg-white/70 border border-white/60 shadow-sm transition-all",
                page <= 1
                  ? "opacity-40 pointer-events-none"
                  : "hover:bg-white hover:shadow-md"
              )}
            >
              <ChevronLeft size={15} />
              {t.prev}
            </Link>
            <Link
              href={hrefFor({ page: Math.min(pageCount, page + 1) })}
              aria-disabled={page >= pageCount}
              className={cn(
                "inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold bg-white/70 border border-white/60 shadow-sm transition-all",
                page >= pageCount
                  ? "opacity-40 pointer-events-none"
                  : "hover:bg-white hover:shadow-md"
              )}
            >
              {t.next}
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

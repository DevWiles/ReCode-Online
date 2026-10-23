import { prisma } from "@/lib/db";
import { requireAdmin, getRequestContext } from "@/lib/auth";

import LoginLogsClient from "@/components/logs/LoginLogsClient";

import type { LoginLogFilter, LoginLogRow } from "@/types";

const PAGE_SIZE = 20;

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;

  const filter: LoginLogFilter =
    params.filter === "success" || params.filter === "failed"
      ? params.filter
      : "all";
  const page = Math.max(1, Number(params.page) || 1);

  const where =
    filter === "all" ? {} : { success: filter === "success" };

  const [context, logs, total, successCount, failureCount, ipGroups] =
    await Promise.all([
      getRequestContext(),
      prisma.loginLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.loginLog.count({ where }),
      prisma.loginLog.count({ where: { success: true } }),
      prisma.loginLog.count({ where: { success: false } }),
      prisma.loginLog.groupBy({ by: ["ip"], _count: { _all: true } }),
    ]);

  // Dates are formatted here so the client component cannot drift out of sync
  // with the server render
  const rows: LoginLogRow[] = logs.map((log) => ({
    id: log.id,
    username: log.username,
    success: log.success,
    reason: log.reason,
    ip: log.ip,
    userAgent: log.userAgent,
    browser: log.browser,
    os: log.os,
    device: log.device,
    time: formatTime(log.createdAt),
  }));

  return (
    <LoginLogsClient
      uiLanguage={user.uiLanguage === "zh" ? "zh" : "en"}
      rows={rows}
      filter={filter}
      page={page}
      pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      total={total}
      successCount={successCount}
      failureCount={failureCount}
      ipCount={ipGroups.length}
      currentIp={context.ip}
    />
  );
}

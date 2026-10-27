import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getRequestContext, isAdmin, requireUser } from "@/lib/auth";

import AccountClient from "@/components/account/AccountClient";
import { DEMO_TTL_HOURS, isDemoMode } from "@/lib/demo";

import type { AccountLogin } from "@/types";

// How many recent sign-ins the account page lists
const RECENT_LOGINS = 5;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

export default async function AccountPage() {
  // The one page an account without a verified email may open
  const user = await requireUser({ allowUnverified: true });

  // A sandbox has no email or password to manage
  if (isDemoMode) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-white/60 bg-white/70 p-8 text-gray-600 shadow-sm">
        <h1 className="text-2xl font-extrabold text-gray-900">演示账号</h1>
        <p className="mt-3 leading-relaxed">
          你正在使用临时沙盒账号 <span className="font-mono font-semibold text-gray-900">{user.username}</span>
          ，不需要绑定邮箱或设置密码。沙盒里的数据只有你能看到，{DEMO_TTL_HOURS} 小时后自动清除。
        </p>
      </div>
    );
  }

  // The log keeps whatever was typed at sign-in: the username in any case,
  // or the email
  const names = [user.username, user.email]
    .filter((name): name is string => Boolean(name))
    .map((name) => name.toLowerCase());

  // SQLite has no case-insensitive mode in Prisma, so the matching ids come
  // from a raw query and the rows themselves from the typed client
  const [context, problemCount, matches] = await Promise.all([
    getRequestContext(),
    prisma.problem.count({ where: { userId: user.id } }),
    prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM LoginLog
      WHERE success = 1 AND lower(username) IN (${Prisma.join(names)})
      ORDER BY createdAt DESC
      LIMIT ${RECENT_LOGINS}
    `),
  ]);

  const logs = await prisma.loginLog.findMany({
    where: { id: { in: matches.map((match) => match.id) } },
    orderBy: { createdAt: "desc" },
  });

  // Dates are formatted here so the client render matches the server's
  const logins: AccountLogin[] = logs.map((log) => ({
    id: log.id,
    ip: log.ip,
    browser: log.browser,
    os: log.os,
    device: log.device,
    time: formatTime(log.createdAt),
    current:
      log.ip === context.ip &&
      log.browser === context.browser &&
      log.os === context.os,
  }));

  return (
    <AccountClient
      uiLanguage={user.uiLanguage === "zh" ? "zh" : "en"}
      username={user.username}
      admin={isAdmin(user)}
      joined={formatDate(user.createdAt)}
      problemCount={problemCount}
      email={user.email}
      emailVerified={Boolean(user.emailVerifiedAt)}
      logins={logins}
    />
  );
}

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

import UsersClient from "@/components/users/UsersClient";

import type { UserRow } from "@/types";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export default async function UsersPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { progress: { where: { status: { not: "Todo" } } } } },
    },
  });

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: formatDate(user.createdAt),
    questionCount: user._count.progress,
    isSelf: user.id === admin.id,
  }));

  return (
    <UsersClient
      uiLanguage={admin.uiLanguage === "zh" ? "zh" : "en"}
      rows={rows}
    />
  );
}

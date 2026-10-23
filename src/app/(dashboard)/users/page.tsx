import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

import UsersClient from "@/components/users/UsersClient";

import type { InviteRow, UserRow } from "@/types";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export default async function UsersPage() {
  const admin = await requireAdmin();

  const [users, invites] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { progress: { where: { status: { not: "Todo" } } } },
        },
      },
    }),
    prisma.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { usedBy: { select: { username: true } } },
    }),
  ]);

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    disabled: user.disabled,
    createdAt: formatDate(user.createdAt),
    questionCount: user._count.progress,
    isSelf: user.id === admin.id,
  }));

  const now = new Date();
  const inviteRows: InviteRow[] = invites.map((invite) => ({
    id: invite.id,
    code: invite.code,
    maxUses: invite.maxUses,
    usedCount: invite.usedCount,
    expiresAt: invite.expiresAt ? formatDate(invite.expiresAt) : null,
    state: invite.revokedAt
      ? "REVOKED"
      : invite.usedCount >= invite.maxUses
        ? "USED_UP"
        : invite.expiresAt && invite.expiresAt < now
          ? "EXPIRED"
          : "ACTIVE",
    usedBy: invite.usedBy.map((user) => user.username),
    createdAt: formatDate(invite.createdAt),
  }));

  return (
    <UsersClient
      uiLanguage={admin.uiLanguage === "zh" ? "zh" : "en"}
      rows={rows}
      invites={inviteRows}
    />
  );
}

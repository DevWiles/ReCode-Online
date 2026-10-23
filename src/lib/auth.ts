import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { parseUserAgent, type DeviceInfo } from "@/lib/ua";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session";

export const getSession = async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
};

/**
 * The logged-in user, or null. The middleware only checks the signature, so
 * this is where a deleted or disabled account, or a token issued before a
 * password change or "sign out everywhere", stops working.
 */
export const getCurrentUser = async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || user.disabled) return null;
  if ((session.sv ?? 0) !== user.sessionVersion) return null;

  return user;
};

export const isAdmin = (user: { role: string } | null | undefined) =>
  user?.role === "ADMIN";

/**
 * Every account must have a verified email before it can use the site, so a
 * forgotten password can always be recovered. Until then only the account
 * page (to bind one) and signing out are available.
 */
export const hasVerifiedEmail = (
  user: { emailVerifiedAt: Date | null } | null | undefined
) => Boolean(user?.emailVerifiedAt);

/** For server actions that touch the user's data: null until an email is bound. */
export const getActiveUser = async () => {
  const user = await getCurrentUser();
  return hasVerifiedEmail(user) ? user : null;
};

/**
 * The logged-in user for pages behind the middleware. A valid cookie whose
 * account has since been deleted is cleared via /logout, and an account
 * without a verified email is sent to bind one first.
 */
export const requireUser = async ({
  allowUnverified = false,
}: { allowUnverified?: boolean } = {}) => {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (!allowUnverified && !hasVerifiedEmail(user)) redirect("/account");

  return user;
};

/** Same as requireUser, but anyone who is not an admin is sent home. */
export const requireAdmin = async () => {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/home");

  return user;
};

export interface RequestContext extends DeviceInfo {
  ip: string;
  userAgent: string;
}

/**
 * Where the request came from. X-Forwarded-For wins because the app is meant
 * to sit behind nginx; its first entry is the original client.
 */
export const getRequestContext = async (): Promise<RequestContext> => {
  const headerList = await headers();

  const forwardedFor = headerList.get("x-forwarded-for");
  const rawIp =
    forwardedFor?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    headerList.get("cf-connecting-ip") ||
    "unknown";

  // Node reports local IPv4 clients as ::ffff:127.0.0.1
  const ip = rawIp.replace(/^::ffff:/i, "").replace(/^::1$/, "127.0.0.1");

  const userAgent = headerList.get("user-agent") ?? "";

  return { ip, userAgent, ...parseUserAgent(userAgent) };
};

import { cookies, headers } from "next/headers";

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

/** The logged-in user, or null. Pages behind the middleware always get a user. */
export const getCurrentUser = async () => {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({ where: { id: session.uid } });
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

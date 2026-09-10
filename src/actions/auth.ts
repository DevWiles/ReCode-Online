"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getRequestContext } from "@/lib/auth";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";

import type { LoginProps, LoginResult } from "@/types";

// Brute-force guard: this many failures from one IP inside the window locks it
const MAX_FAILURES = 8;
const WINDOW_MINUTES = 15;

const recordAttempt = async (
  username: string,
  success: boolean,
  reason: string | null
) => {
  const context = await getRequestContext();

  await prisma.loginLog.create({
    data: {
      username,
      success,
      reason,
      ip: context.ip,
      userAgent: context.userAgent,
      browser: context.browser,
      os: context.os,
      device: context.device,
    },
  });
};

export const login = async ({
  username,
  password,
}: LoginProps): Promise<LoginResult> => {
  const name = username.trim();

  if (!name || !password) {
    return { error: "EMPTY_FIELDS" };
  }

  const { ip } = await getRequestContext();

  const recentFailures = await prisma.loginLog.count({
    where: {
      ip,
      success: false,
      createdAt: { gte: new Date(Date.now() - WINDOW_MINUTES * 60 * 1000) },
    },
  });

  if (recentFailures >= MAX_FAILURES) {
    await recordAttempt(name, false, "RATE_LIMITED");
    return { error: "RATE_LIMITED" };
  }

  const user = await prisma.user.findUnique({ where: { username: name } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    // The same message for both cases, so the form cannot be used to probe
    // which usernames exist
    await recordAttempt(name, false, user ? "BAD_PASSWORD" : "NO_SUCH_USER");
    return { error: "BAD_CREDENTIALS" };
  }

  await recordAttempt(name, true, null);

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken({ uid: user.id, username: user.username }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return { ok: true };
};

export const logout = async () => {
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  redirect("/login");
};

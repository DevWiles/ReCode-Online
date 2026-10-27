"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getRequestContext } from "@/lib/auth";
import { normalizeEmail, signIn } from "@/lib/accounts";
import { SESSION_COOKIE } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

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
  remember,
}: LoginProps): Promise<LoginResult> => {
  const name = username.trim();

  // Sandboxes have no passwords; the only way in is the one-click demo button
  if (isDemoMode) return { error: "BAD_CREDENTIALS" };

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

  // Anything with an @ is an email; usernames cannot contain one
  const user = await prisma.user.findUnique({
    where: name.includes("@")
      ? { email: normalizeEmail(name) }
      : { username: name },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    // The same message for both cases, so the form cannot be used to probe
    // which usernames exist
    await recordAttempt(name, false, user ? "BAD_PASSWORD" : "NO_SUCH_USER");
    return { error: "BAD_CREDENTIALS" };
  }

  // Checked after the password so it reveals nothing to someone guessing
  if (user.disabled) {
    await recordAttempt(name, false, "DISABLED");
    return { error: "DISABLED" };
  }

  await recordAttempt(name, true, null);
  await signIn(user, remember);

  return { ok: true };
};

export const logout = async () => {
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  redirect("/login");
};

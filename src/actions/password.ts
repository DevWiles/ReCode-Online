"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser, getRequestContext, getSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendEmailCode, verifyEmailCode } from "@/lib/email-code";
import { SHORT_SESSION_MAX_AGE } from "@/lib/session";
import { isValidPassword, normalizeEmail, signIn } from "@/lib/accounts";

import type { AccountError, ActionResult, ResetPasswordError } from "@/types";

/** Username or email -> an account that can receive a reset code, or null. */
const findResettable = async (identifier: string) => {
  const value = identifier.trim();
  if (!value) return null;

  const user = await prisma.user.findUnique({
    where: value.includes("@")
      ? { email: normalizeEmail(value) }
      : { username: value },
  });

  return user && user.email && user.emailVerifiedAt && !user.disabled
    ? user
    : null;
};

/**
 * Sends a reset code when the account exists and has a verified email. The
 * answer is always "ok", so the form cannot be used to find out which
 * accounts exist; cooldowns and failures are only logged.
 */
export const sendResetCode = async ({
  identifier,
}: {
  identifier: string;
}): Promise<ActionResult<never>> => {
  const user = await findResettable(identifier);

  if (user?.email) {
    const { ip } = await getRequestContext();
    const sent = await sendEmailCode({
      email: user.email,
      purpose: "RESET",
      userId: user.id,
      username: user.username,
      ip,
    });
    if ("error" in sent) {
      console.warn(`Reset code for ${user.username} not sent: ${sent.error}`);
    }
  }

  return { ok: true };
};

/** Sets a new password from a reset code and signs out every device. */
export const resetPassword = async ({
  identifier,
  code,
  password,
}: {
  identifier: string;
  code: string;
  password: string;
}): Promise<ActionResult<ResetPasswordError>> => {
  if (!isValidPassword(password)) return { error: "BAD_PASSWORD" };

  const user = await findResettable(identifier);
  // Same answer as a wrong code, for the same reason as above
  if (!user?.email) return { error: "CODE_INVALID" };

  const verified = await verifyEmailCode({
    email: user.email,
    purpose: "RESET",
    code,
    userId: user.id,
  });
  if ("error" in verified) return { error: verified.error };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(password),
      sessionVersion: { increment: 1 },
    },
  });

  return { ok: true };
};

/**
 * Changes the signed-in user's password. Every other device is signed out;
 * this one gets a fresh cookie so the user stays where they are.
 */
export const changePassword = async ({
  current,
  next,
}: {
  current: string;
  next: string;
}): Promise<ActionResult<AccountError>> => {
  const [user, session] = await Promise.all([getCurrentUser(), getSession()]);
  if (!user || !session) return { error: "UNAUTHORIZED" };

  if (!verifyPassword(current, user.passwordHash)) {
    return { error: "WRONG_PASSWORD" };
  }
  if (!isValidPassword(next)) return { error: "BAD_PASSWORD" };

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(next),
      sessionVersion: { increment: 1 },
    },
  });

  // Keep the current device's choice: a token that outlives a short session
  // was issued with "remember me"
  const remember =
    session.exp * 1000 - Date.now() > SHORT_SESSION_MAX_AGE * 1000;
  await signIn(updated, remember);

  return { ok: true };
};

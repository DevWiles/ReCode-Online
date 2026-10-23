"use server";

import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { sendEmailCode, verifyEmailCode } from "@/lib/email-code";
import {
  USERNAME_PATTERN,
  emailTaken,
  findUsableInvite,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  signIn,
  usernameTaken,
} from "@/lib/accounts";

import type { ActionResult, RegisterError, RegisterProps } from "@/types";

/**
 * Sends the registration code. A valid invite is required first, so the form
 * cannot be used by strangers to spray mail at arbitrary addresses.
 */
export const sendRegisterCode = async ({
  inviteCode,
  email,
}: {
  inviteCode: string;
  email: string;
}): Promise<ActionResult<RegisterError>> => {
  if (!(await findUsableInvite(inviteCode))) return { error: "INVITE_INVALID" };

  const address = normalizeEmail(email);
  if (!isValidEmail(address)) return { error: "BAD_EMAIL" };
  if (await emailTaken(address)) return { error: "EMAIL_TAKEN" };

  const { ip } = await getRequestContext();
  const sent = await sendEmailCode({ email: address, purpose: "REGISTER", ip });

  return "error" in sent ? { error: sent.error } : { ok: true };
};

/** Creates the account, spends one use of the invite and signs the user in. */
export const register = async ({
  inviteCode,
  username,
  email,
  code,
  password,
}: RegisterProps): Promise<ActionResult<RegisterError>> => {
  const invite = await findUsableInvite(inviteCode);
  if (!invite) return { error: "INVITE_INVALID" };

  const name = username.trim();
  if (!USERNAME_PATTERN.test(name)) return { error: "BAD_USERNAME" };
  if (await usernameTaken(name)) return { error: "USERNAME_TAKEN" };

  const address = normalizeEmail(email);
  if (!isValidEmail(address)) return { error: "BAD_EMAIL" };
  if (await emailTaken(address)) return { error: "EMAIL_TAKEN" };

  if (!isValidPassword(password)) return { error: "BAD_PASSWORD" };

  // Last, so a mistake in another field does not burn the code
  const verified = await verifyEmailCode({
    email: address,
    purpose: "REGISTER",
    code,
  });
  if ("error" in verified) return { error: verified.error };

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      // Claimed with a conditional update so two people racing for the last
      // use of an invite cannot both get in
      const now = new Date();
      const { count } = await tx.inviteCode.updateMany({
        where: {
          id: invite.id,
          revokedAt: null,
          usedCount: { lt: invite.maxUses },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: { usedCount: { increment: 1 } },
      });
      if (count !== 1) throw new Error("INVITE_INVALID");

      return tx.user.create({
        data: {
          username: name,
          email: address,
          emailVerifiedAt: now,
          passwordHash: hashPassword(password),
          role: "USER",
          uiLanguage: "zh",
          inviteCodeId: invite.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITE_INVALID") {
      return { error: "INVITE_INVALID" };
    }
    // Unique index: someone took the name or address a moment ago
    console.error("Register error:", error);
    return { error: "USERNAME_TAKEN" };
  }

  await signIn(user, true);
  return { ok: true };
};

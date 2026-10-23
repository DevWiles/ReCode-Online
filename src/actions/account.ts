"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentUser, getRequestContext } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";
import { sendEmailCode, verifyEmailCode } from "@/lib/email-code";
import { emailTaken, isValidEmail, normalizeEmail } from "@/lib/accounts";

import type { AccountError, ActionResult } from "@/types";

/** Sends a code to the address the signed-in user wants to attach. */
export const sendBindCode = async ({
  email,
}: {
  email: string;
}): Promise<ActionResult<AccountError>> => {
  const user = await getCurrentUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const address = normalizeEmail(email);
  if (!isValidEmail(address)) return { error: "BAD_EMAIL" };
  if (await emailTaken(address, user.id)) return { error: "EMAIL_TAKEN" };

  const { ip } = await getRequestContext();
  const sent = await sendEmailCode({
    email: address,
    purpose: "BIND",
    userId: user.id,
    ip,
  });

  return "error" in sent ? { error: sent.error } : { ok: true };
};

/** Attaches (or replaces) the signed-in user's verified email. */
export const bindEmail = async ({
  email,
  code,
}: {
  email: string;
  code: string;
}): Promise<ActionResult<AccountError>> => {
  const user = await getCurrentUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const address = normalizeEmail(email);
  if (!isValidEmail(address)) return { error: "BAD_EMAIL" };
  if (await emailTaken(address, user.id)) return { error: "EMAIL_TAKEN" };

  const verified = await verifyEmailCode({
    email: address,
    purpose: "BIND",
    code,
    userId: user.id,
  });
  if ("error" in verified) return { error: verified.error };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: address, emailVerifiedAt: new Date() },
    });
  } catch {
    // Unique index: another account claimed it in the meantime
    return { error: "EMAIL_TAKEN" };
  }

  revalidatePath("/account");
  return { ok: true };
};

/** Invalidates every session of this account, this device included. */
export const logoutAllDevices = async () => {
  const user = await getCurrentUser();

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    });
  }

  const store = await cookies();
  store.delete(SESSION_COOKIE);

  redirect("/login");
};

import { randomInt } from "node:crypto";

import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo";
import { sendMail } from "@/lib/mail";
import { bannerAttachment, buildCodeMail } from "@/lib/mail/code-template";
import { hashPassword, verifyPassword } from "@/lib/password";

export type CodePurpose = "REGISTER" | "BIND" | "RESET";

export type SendCodeError = "COOLDOWN" | "RATE_LIMITED" | "MAIL_FAILED";
export type VerifyCodeError = "CODE_INVALID" | "CODE_EXPIRED" | "CODE_LOCKED";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
// Per hour
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 10;

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000);

/**
 * Emails a fresh 6-digit code. Only the newest code for an address and purpose
 * is ever accepted, so sending a new one retires the old.
 */
export const sendEmailCode = async ({
  email,
  purpose,
  userId,
  username,
  ip,
}: {
  email: string;
  purpose: CodePurpose;
  userId?: string;
  // For the greeting; unknown while registering
  username?: string;
  ip: string;
}): Promise<{ ok: true } | { error: SendCodeError }> => {
  // The demo instance has no mail server and no real accounts to recover
  if (isDemoMode) return { error: "MAIL_FAILED" };

  const latest = await prisma.emailCode.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (
    latest &&
    latest.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return { error: "COOLDOWN" };
  }

  const [byEmail, byIp] = await Promise.all([
    prisma.emailCode.count({
      where: { email, createdAt: { gte: minutesAgo(60) } },
    }),
    prisma.emailCode.count({
      where: { ip, createdAt: { gte: minutesAgo(60) } },
    }),
  ]);
  if (byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP) {
    return { error: "RATE_LIMITED" };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  const row = await prisma.emailCode.create({
    data: {
      email,
      purpose,
      userId,
      ip,
      codeHash: hashPassword(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  try {
    const mail = buildCodeMail({
      purpose,
      code,
      username,
      ip,
      minutes: CODE_TTL_MINUTES,
    });
    await sendMail({ to: email, ...mail, attachments: [bannerAttachment()] });
  } catch (error) {
    console.error("Send code mail error:", error);
    // A code that never arrived should not hold up the cooldown
    await prisma.emailCode.delete({ where: { id: row.id } });
    return { error: "MAIL_FAILED" };
  }

  return { ok: true };
};

/**
 * Checks a code and burns it on success. Call this last, after every other
 * field has been validated, so a typo elsewhere does not waste the code.
 */
export const verifyEmailCode = async ({
  email,
  purpose,
  code,
  userId,
}: {
  email: string;
  purpose: CodePurpose;
  code: string;
  userId?: string;
}): Promise<{ ok: true } | { error: VerifyCodeError }> => {
  const latest = await prisma.emailCode.findFirst({
    where: { email, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  // A code requested for one account cannot be redeemed by another
  if (!latest || (userId !== undefined && latest.userId !== userId)) {
    return { error: "CODE_INVALID" };
  }
  if (latest.attempts >= MAX_ATTEMPTS) return { error: "CODE_LOCKED" };
  if (latest.expiresAt < new Date()) return { error: "CODE_EXPIRED" };

  if (!verifyPassword(code.trim(), latest.codeHash)) {
    const { attempts } = await prisma.emailCode.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: attempts >= MAX_ATTEMPTS ? "CODE_LOCKED" : "CODE_INVALID" };
  }

  // updateMany with usedAt: null so two concurrent redemptions cannot both win
  const { count } = await prisma.emailCode.updateMany({
    where: { id: latest.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  return count === 1 ? { ok: true } : { error: "CODE_INVALID" };
};

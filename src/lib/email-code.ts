import { randomInt } from "node:crypto";

import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
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

const SUBJECTS: Record<CodePurpose, string> = {
  REGISTER: "ReCode 注册验证码",
  BIND: "ReCode 邮箱绑定验证码",
  RESET: "ReCode 重置密码验证码",
};

const ACTIONS: Record<CodePurpose, string> = {
  REGISTER: "注册 ReCode 账号",
  BIND: "把这个邮箱绑定到你的 ReCode 账号",
  RESET: "重置你的 ReCode 密码",
};

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
  ip,
}: {
  email: string;
  purpose: CodePurpose;
  userId?: string;
  ip: string;
}): Promise<{ ok: true } | { error: SendCodeError }> => {
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
    await sendMail({
      to: email,
      subject: SUBJECTS[purpose],
      text:
        `你的验证码是：${code}\n\n` +
        `它用于${ACTIONS[purpose]}，${CODE_TTL_MINUTES} 分钟内有效。\n` +
        `如果这不是你本人的操作，忽略这封邮件即可。`,
    });
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

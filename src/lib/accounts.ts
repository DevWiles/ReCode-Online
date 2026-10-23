import { randomInt } from "node:crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SHORT_SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";

export const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,32}$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

// Deliberately loose: the verification code is the real check
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) =>
  email.length <= 254 && EMAIL_PATTERN.test(email);

export const isValidPassword = (password: string) =>
  password.length >= MIN_PASSWORD_LENGTH &&
  password.length <= MAX_PASSWORD_LENGTH;

/**
 * SQLite compares usernames case-sensitively, so "Tom" and "tom" would both
 * fit the unique index. The account list is tiny, so compare in memory.
 */
export const usernameTaken = async (username: string) => {
  const users = await prisma.user.findMany({ select: { username: true } });
  const wanted = username.toLowerCase();

  return users.some((user) => user.username.toLowerCase() === wanted);
};

export const emailTaken = async (email: string, exceptUserId?: string) => {
  const owner = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  });

  return Boolean(owner && owner.id !== exceptUserId);
};

// Upper case without look-alikes (0/O, 1/I/L), easy to read out or retype
const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** e.g. "K7QM-2XRP-H9TA": 12 random characters, about 59 bits */
export const generateInviteCode = () => {
  let raw = "";
  for (let i = 0; i < 12; i++) raw += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
  return raw.match(/.{4}/g)!.join("-");
};

export const normalizeInviteCode = (code: string) =>
  code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").match(/.{1,4}/g)?.join("-") ?? "";

/** The invite if it can still be used right now, otherwise null. */
export const findUsableInvite = async (code: string) => {
  const invite = await prisma.inviteCode.findUnique({
    where: { code: normalizeInviteCode(code) },
  });

  if (
    !invite ||
    invite.revokedAt ||
    invite.usedCount >= invite.maxUses ||
    (invite.expiresAt && invite.expiresAt < new Date())
  ) {
    return null;
  }

  return invite;
};

/**
 * Sets the session cookie. With `remember` it lasts 30 days; without, it has
 * no expiry so the browser drops it on close, and the token expires in a day.
 */
export const signIn = async (
  user: { id: string; username: string; sessionVersion: number },
  remember: boolean
) => {
  const maxAge = remember ? SESSION_MAX_AGE : SHORT_SESSION_MAX_AGE;
  const token = await createSessionToken(
    { uid: user.id, username: user.username, sv: user.sessionVersion },
    maxAge
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge } : {}),
  });
};

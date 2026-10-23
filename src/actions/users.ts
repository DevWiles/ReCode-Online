"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { generatePassword, hashPassword } from "@/lib/password";

import type { CreateUserProps, UserAdminResult } from "@/types";

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 8;

const assertAdmin = async () => isAdmin(await getCurrentUser());

/**
 * SQLite compares usernames case-sensitively, so "Tom" and "tom" would both
 * fit the unique index. The account list is tiny, so compare in memory.
 */
const usernameTaken = async (username: string) => {
  const users = await prisma.user.findMany({ select: { username: true } });
  const wanted = username.toLowerCase();

  return users.some((user) => user.username.toLowerCase() === wanted);
};

/** Creates a regular account. A blank password is replaced by a random one. */
export const createUser = async ({
  username,
  password,
}: CreateUserProps): Promise<UserAdminResult> => {
  if (!(await assertAdmin())) return { error: "FORBIDDEN" };

  const name = username.trim();
  if (!USERNAME_PATTERN.test(name)) return { error: "BAD_USERNAME" };

  const plain = password || generatePassword();
  if (plain.length < MIN_PASSWORD_LENGTH) return { error: "SHORT_PASSWORD" };

  if (await usernameTaken(name)) return { error: "USERNAME_TAKEN" };

  try {
    await prisma.user.create({
      data: {
        username: name,
        passwordHash: hashPassword(plain),
        role: "USER",
        uiLanguage: "zh",
      },
    });
  } catch (error) {
    // Lost a race against another create with the same name
    console.error("Create user error:", error);
    return { error: "USERNAME_TAKEN" };
  }

  revalidatePath("/users");
  return { ok: true, username: name, password: plain };
};

/** Gives an account a fresh random password, shown once to the admin. */
export const resetUserPassword = async (
  userId: string
): Promise<UserAdminResult> => {
  if (!(await assertAdmin())) return { error: "FORBIDDEN" };

  const plain = generatePassword();

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(plain) },
    });

    return { ok: true, username: user.username, password: plain };
  } catch {
    return { error: "NOT_FOUND" };
  }
};

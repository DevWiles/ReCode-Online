"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getActiveUser, isAdmin } from "@/lib/auth";
import { generatePassword, hashPassword } from "@/lib/password";
import {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  generateInviteCode,
  usernameTaken,
} from "@/lib/accounts";

import type {
  ActionResult,
  CreateInviteProps,
  CreateUserProps,
  UserAdminError,
  UserAdminResult,
} from "@/types";

/** The signed-in admin, or null for anyone else. */
const getAdmin = async () => {
  const user = await getActiveUser();
  return isAdmin(user) ? user : null;
};

/**
 * Accounts an admin may disable or delete: anyone but themselves and other
 * admins, so the site can never lock out its last administrator.
 */
const findManageable = async (
  adminId: string,
  userId: string
): Promise<
  | { error: "NOT_FOUND" | "PROTECTED" }
  | { user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>> }
> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "NOT_FOUND" };
  if (user.id === adminId || isAdmin(user)) return { error: "PROTECTED" };
  return { user };
};

/** Creates a regular account. A blank password is replaced by a random one. */
export const createUser = async ({
  username,
  password,
}: CreateUserProps): Promise<UserAdminResult> => {
  if (!(await getAdmin())) return { error: "FORBIDDEN" };

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

/**
 * Gives an account a fresh random password, shown once to the admin. Its
 * existing sessions end, since whoever held the old password may be in them.
 */
export const resetUserPassword = async (
  userId: string
): Promise<UserAdminResult> => {
  if (!(await getAdmin())) return { error: "FORBIDDEN" };

  const plain = generatePassword();

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashPassword(plain),
        sessionVersion: { increment: 1 },
      },
    });

    return { ok: true, username: user.username, password: plain };
  } catch {
    return { error: "NOT_FOUND" };
  }
};

/** Blocks or restores sign-in. Disabling also ends the account's sessions. */
export const setUserDisabled = async (
  userId: string,
  disabled: boolean
): Promise<ActionResult<UserAdminError>> => {
  const admin = await getAdmin();
  if (!admin) return { error: "FORBIDDEN" };

  const found = await findManageable(admin.id, userId);
  if ("error" in found) return { error: found.error };

  await prisma.user.update({
    where: { id: userId },
    data: {
      disabled,
      ...(disabled ? { sessionVersion: { increment: 1 } } : {}),
    },
  });

  revalidatePath("/users");
  return { ok: true };
};

/**
 * Deletes an account with all of its questions, reviews and code. The admin
 * has to type the username back, so a stray click cannot do it.
 */
export const deleteUser = async (
  userId: string,
  confirmUsername: string
): Promise<ActionResult<UserAdminError>> => {
  const admin = await getAdmin();
  if (!admin) return { error: "FORBIDDEN" };

  const found = await findManageable(admin.id, userId);
  if ("error" in found) return { error: found.error };
  if (confirmUsername.trim() !== found.user.username) {
    return { error: "CONFIRM_MISMATCH" };
  }

  // Children first: these relations do not cascade on their own
  await prisma.$transaction([
    prisma.submission.deleteMany({ where: { progress: { userId } } }),
    prisma.progress.deleteMany({ where: { userId } }),
    prisma.problem.deleteMany({ where: { userId } }),
    prisma.emailCode.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/users");
  return { ok: true };
};

/** Creates an invite; the code is returned so the admin can copy it. */
export const createInvite = async ({
  maxUses,
  expiresInDays,
}: CreateInviteProps): Promise<
  | { ok: true; code: string; error?: never }
  | { ok?: never; error: UserAdminError }
> => {
  const admin = await getAdmin();
  if (!admin) return { error: "FORBIDDEN" };

  if (
    !Number.isInteger(maxUses) ||
    maxUses < 1 ||
    maxUses > 100 ||
    !Number.isInteger(expiresInDays) ||
    expiresInDays < 0 ||
    expiresInDays > 365
  ) {
    return { error: "BAD_INVITE" };
  }

  const invite = await prisma.inviteCode.create({
    data: {
      code: generateInviteCode(),
      createdById: admin.id,
      maxUses,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });

  revalidatePath("/users");
  return { ok: true, code: invite.code };
};

/** Withdraws an invite; accounts already created with it are unaffected. */
export const revokeInvite = async (
  inviteId: string
): Promise<ActionResult<UserAdminError>> => {
  if (!(await getAdmin())) return { error: "FORBIDDEN" };

  const { count } = await prisma.inviteCode.updateMany({
    where: { id: inviteId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) return { error: "NOT_FOUND" };

  revalidatePath("/users");
  return { ok: true };
};

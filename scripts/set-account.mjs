/**
 * Creates or updates the login account.
 *
 *   node scripts/set-account.mjs [username] [password]
 *
 * With no password given a strong one is generated and printed once.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const N = 16384;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;

// Must stay in sync with src/lib/password.ts
const hashPassword = (plain) => {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  });

  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
};

// Ambiguous characters are left out so the password stays typable
const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%^&*-_=+";

const generatePassword = (length = 20) => {
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; out.length < length && i < bytes.length; i++) {
    // Reject the tail of the byte range to keep the distribution uniform
    if (bytes[i] >= 256 - (256 % ALPHABET.length)) continue;
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
};

const [, , usernameArg, passwordArg] = process.argv;

const username = usernameArg || "devwiles";
const generated = !passwordArg;
const password = passwordArg || generatePassword();

const prisma = new PrismaClient();

try {
  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: hashPassword(password) },
    create: { username, passwordHash: hashPassword(password), uiLanguage: "zh" },
  });

  console.log(`account ready: ${user.username} (${user.id})`);
  if (generated) console.log(`password: ${password}`);
} finally {
  await prisma.$disconnect();
}

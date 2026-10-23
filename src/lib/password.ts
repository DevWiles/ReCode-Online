import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// scrypt parameters, stored alongside the hash so they can be raised later
const N = 16384;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

/** Produces "scrypt$N$r$p$salt$hash", all hex. */
export const hashPassword = (plain: string) => {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LENGTH, { N, r, p, maxmem: MAX_MEM });

  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
};

export const verifyPassword = (plain: string, stored: string | null) => {
  if (!stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, rawN, rawR, rawP, saltHex, hashHex] = parts;

  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(plain, Buffer.from(saltHex, "hex"), expected.length, {
      N: Number(rawN),
      r: Number(rawR),
      p: Number(rawP),
      maxmem: MAX_MEM,
    });

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
};

// Ambiguous characters are left out so the password stays typable
const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%^&*-_=+";

/** A random password for accounts the admin hands out. */
export const generatePassword = (length = 16) => {
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; out.length < length && i < bytes.length; i++) {
    // Reject the tail of the byte range to keep the distribution uniform
    if (bytes[i] >= 256 - (256 % ALPHABET.length)) continue;
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
};

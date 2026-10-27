/**
 * Creates .env from .env.example with a fresh random AUTH_SECRET.
 * An existing .env is left untouched.
 *
 *   node scripts/init-env.mjs
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  console.log(".env already exists, leaving it as is");
} else {
  const secret = randomBytes(32).toString("hex");
  const env = readFileSync(".env.example", "utf8").replace(
    /^AUTH_SECRET=.*$/m,
    `AUTH_SECRET="${secret}"`
  );
  writeFileSync(".env", env);
  console.log("created .env with a random AUTH_SECRET");
}

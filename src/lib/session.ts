/**
 * Stateless session token: base64url(payload).base64url(HMAC-SHA256).
 *
 * Only Web Crypto is used here (no `node:crypto`), so this module can be
 * imported from the middleware regardless of which runtime it ends up on.
 */

export const SESSION_COOKIE = "recode_session";

// 7 days, in seconds
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface SessionPayload {
  // User.id
  uid: string;
  username: string;
  // Expiry, epoch seconds
  exp: number;
}

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const getSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Put a random 64-char value in .env.local"
    );
  }
  return secret;
};

const getKey = (secret: string) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

export const createSessionToken = async (
  payload: Omit<SessionPayload, "exp">
) => {
  const body: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const encoded = toBase64Url(encoder.encode(JSON.stringify(body)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(getSecret()),
    encoder.encode(encoded)
  );

  return `${encoded}.${toBase64Url(new Uint8Array(signature))}`;
};

export const verifySessionToken = async (
  token: string | undefined
): Promise<SessionPayload | null> => {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(getSecret()),
      fromBase64Url(signature),
      encoder.encode(encoded)
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encoded))
    ) as SessionPayload;

    if (!payload.uid || payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
};

import { createHash, randomBytes } from "node:crypto";

export function generateSecureToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSecureToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isSecureTokenActive({
  expiresAt,
  revokedAt,
  now = new Date(),
}: {
  expiresAt: string;
  revokedAt: string | null;
  now?: Date;
}) {
  if (revokedAt) return false;
  const expiry = new Date(expiresAt);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() > now.getTime();
}

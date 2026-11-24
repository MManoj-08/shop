import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export const RESET_TTL_MIN = 30; // a reset link works for 30 minutes
export const RESETS_PER_HOUR = 3; // at most this many links per account per hour

// The secret in the link is random; only its hash is stored
export const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// The address put into the email. It comes from .env, never from the request, so a forged
// Host header cannot point a customer's reset link at someone else's website.
export function siteUrl(): string | null {
  const url = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (url) return url;
  return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
}

// The reset behind this link, if it is real, unused and not expired
export async function findValidReset(token: string) {
  if (!token || token.length > 100) return null;
  const reset = await db.passwordReset.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, role: true } } },
  });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return null;
  // only shop customers reset by email; the owner's password is changed with the script
  if (reset.user.role !== "CUSTOMER") return null;
  return reset;
}

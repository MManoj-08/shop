"use server";

import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { mailConfigured, sendMail } from "@/lib/mail";
import { findValidReset, hashToken, newToken, RESETS_PER_HOUR, RESET_TTL_MIN, siteUrl } from "@/lib/reset";

export type ForgotState = { done?: boolean; error?: string; phone?: string; devLink?: string };
export type ResetState = { error?: string };

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((p) => Buffer.byteLength(p) <= 72, "Password is too long (72 characters at most).");

// Step 1: the customer gives their mobile number and we email them a link.
// The answer is the same whether or not the number is registered, so this page cannot be used
// to find out who shops here.
export async function requestReset(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneSchema.safeParse(phoneRaw);
  if (!phone.success) return { phone: phoneRaw, error: phone.error.issues[0].message };

  const sent: ForgotState = { done: true, phone: phone.data };
  const user = await db.user.findUnique({ where: { phone: phone.data } });
  if (!user || user.role !== "CUSTOMER" || !user.email) return sent;

  // a few links per hour at most, so the form cannot be used to flood someone's inbox
  const recent = await db.passwordReset.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
  });
  if (recent >= RESETS_PER_HOUR) return sent;

  const base = siteUrl();
  const unavailable = { phone: phone.data, error: "Password reset by email is not available right now. Please call the shop and we will help you." };
  if (!base || (!mailConfigured() && process.env.NODE_ENV === "production")) return unavailable;

  const token = newToken();
  const reset = await db.passwordReset.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000) },
  });
  const link = `${base}/reset-password?token=${token}`;

  if (!mailConfigured()) {
    // development only: there is no mail account yet, so show the link here instead
    console.log(`[password reset] ${phone.data}: ${link}`);
    return { ...sent, devLink: link };
  }
  try {
    await sendMail({
      to: user.email,
      subject: "Reset your Mangalore Stores password",
      text:
        `Hello${user.name ? " " + user.name : ""},\n\n` +
        `Someone asked to reset the password for the Mangalore Stores account with the mobile number ending ${user.phone.slice(-4)}.\n\n` +
        `To choose a new password, open this link within ${RESET_TTL_MIN} minutes:\n${link}\n\n` +
        `If you did not ask for this, ignore this email. Your password stays the same.\n`,
    });
  } catch (e) {
    console.error("[password reset] email failed:", e instanceof Error ? e.message : e);
    await db.passwordReset.delete({ where: { id: reset.id } }).catch(() => {});
    return { phone: phone.data, error: "We could not send the email just now. Please try again in a few minutes, or call the shop." };
  }
  return sent;
}

// Step 2: the customer opens the link and chooses a new password. It replaces the password
// stored on that same customer record.
export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const pw = passwordSchema.safeParse(password);
  if (!pw.success) return { error: pw.error.issues[0].message };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const reset = await findValidReset(token);
  if (!reset) return { error: "This link has expired or was already used. Please ask for a new one." };

  const newHash = await hash(password, 12);
  const used = await db.$transaction(async (tx) => {
    // the link can be used once: only the first request to mark it used goes through
    const mark = await tx.passwordReset.updateMany({ where: { id: reset.id, usedAt: null }, data: { usedAt: new Date() } });
    if (mark.count === 0) return false;
    await tx.user.update({
      where: { id: reset.userId },
      data: { passwordHash: newHash, failedLogins: 0, lockedUntil: null },
    });
    // any other link sent earlier stops working too
    await tx.passwordReset.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: new Date() } });
    return true;
  });
  if (!used) return { error: "This link has expired or was already used. Please ask for a new one." };
  redirect("/login?reset=1");
}

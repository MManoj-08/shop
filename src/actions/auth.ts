"use server";

import { redirect } from "next/navigation";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

export type AuthState = { error?: string; phone?: string; name?: string; email?: string };

const MAX_FAILED = 5; // wrong passwords allowed before the account is locked
const LOCK_MINUTES = 15;

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
const nameSchema = z.string().trim().min(2, "Please enter your name (at least 2 characters).").max(60, "That name is too long.");
// the email is where a forgotten-password link is sent
const emailSchema = z.string().trim().toLowerCase().max(100, "That email is too long.").email("Enter a valid email address, for example name@gmail.com.");
// bcrypt only looks at the first 72 bytes, so longer passwords are refused instead of being silently cut
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((p) => Buffer.byteLength(p) <= 72, "Password is too long (72 characters at most).");

// Only allow going to a page on this site (never to another website)
function safeNext(next: string, fallback = "/") {
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback;
}

// A real bcrypt hash that matches nothing. Checking against it when the number is not
// registered makes "unknown number" take as long as "wrong password".
const dummyHash = hash("this-matches-no-real-password", 12);

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const nameRaw = String(formData.get("name") ?? "");
  const emailRaw = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = String(formData.get("next") ?? "/");
  const keep = { phone: phoneRaw, name: nameRaw, email: emailRaw };

  const phone = phoneSchema.safeParse(phoneRaw);
  if (!phone.success) return { ...keep, error: phone.error.issues[0].message };
  const name = nameSchema.safeParse(nameRaw);
  if (!name.success) return { ...keep, error: name.error.issues[0].message };
  const email = emailSchema.safeParse(emailRaw);
  if (!email.success) return { ...keep, error: email.error.issues[0].message };
  const pw = passwordSchema.safeParse(password);
  if (!pw.success) return { ...keep, error: pw.error.issues[0].message };
  if (password !== confirm) return { ...keep, error: "The two passwords do not match." };

  if (phone.data === process.env.ADMIN_PHONE) {
    return { ...keep, error: "This number belongs to the shop owner. Please use the “Shop owner login” button on this page." };
  }
  if (await db.user.findUnique({ where: { phone: phone.data } })) {
    return { ...keep, error: "This number is already registered. Please log in instead." };
  }

  let user;
  try {
    user = await db.user.create({
      data: { phone: phone.data, name: name.data, email: email.data, role: "CUSTOMER", passwordHash: await hash(password, 12) },
    });
  } catch {
    // two sign-ups with the same number at the same moment
    return { ...keep, error: "This number is already registered. Please log in instead." };
  }
  await createSession(user.id);
  redirect(safeNext(next));
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  const ownerLogin = formData.get("mode") === "owner";
  const keep = { phone: phoneRaw };
  const wrong = { ...keep, error: "Wrong mobile number or password." };

  const phone = phoneSchema.safeParse(phoneRaw);
  if (!phone.success) return { ...keep, error: phone.error.issues[0].message };
  if (!password || password.length > 200) return wrong;

  const user = await db.user.findUnique({ where: { phone: phone.data } });
  if (!user?.passwordHash) {
    await compare(password, await dummyHash);
    return wrong;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { ...keep, error: `Too many wrong attempts. Please try again in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  if (!(await compare(password, user.passwordHash))) {
    const failed = user.failedLogins + 1;
    await db.user.update({
      where: { id: user.id },
      data:
        failed >= MAX_FAILED
          ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
          : { failedLogins: failed },
    });
    return wrong;
  }

  // The two logins are kept apart: owners use /admin, customers use the shop login
  const isStaff = user.role === "OWNER" || user.role === "STAFF";
  if (ownerLogin && !isStaff) return wrong;
  if (!ownerLogin && isStaff) {
    return { ...keep, error: "This number belongs to the shop owner. Please use the “Shop owner login” button on this page." };
  }

  if (user.failedLogins > 0 || user.lockedUntil) {
    await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  }
  await createSession(user.id);
  if (ownerLogin) {
    const target = safeNext(next, "/admin");
    redirect(target.startsWith("/admin") && target !== "/admin/login" ? target : "/admin");
  }
  redirect(safeNext(next));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function ownerLogout() {
  await destroySession();
  redirect("/admin/login");
}

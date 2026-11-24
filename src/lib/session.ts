import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET!);
const SESSION_COOKIE = "session";

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(key());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const userId = payload.userId as string;
    return await db.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

// The signed-in shop customer. The owner and staff are not customers: on the shop side
// they count as logged out, and they use their own login at /admin.
export async function getCustomer() {
  const user = await getCurrentUser();
  return user && user.role === "CUSTOMER" ? user : null;
}

export async function getOwner() {
  const user = await getCurrentUser();
  return user && (user.role === "OWNER" || user.role === "STAFF") ? user : null;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "OWNER" && user.role !== "STAFF")) {
    throw new Error("Not allowed");
  }
  return user;
}

// Call this FIRST in every owner page, before reading any data. The layout also checks, but
// Next.js can start rendering a page before the layout's redirect takes effect, so a page
// that fetches customer data without its own check would leak it to logged-out visitors.
export async function requireOwnerPage() {
  const owner = await getOwner();
  if (!owner) redirect("/admin/login");
  return owner;
}

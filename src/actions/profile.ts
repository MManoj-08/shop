"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export type ProfileState = { ok?: boolean; error?: string };

const nameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your name (at least 2 characters).")
  .max(60, "That name is too long.");

export async function updateName(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in again." };
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name" };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(100, "That email is too long.")
  .email("Enter a valid email address, for example name@gmail.com.");

// Where a forgotten-password link is sent
export async function updateEmail(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in again." };
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  await db.user.update({ where: { id: user.id }, data: { email: parsed.data } });
  revalidatePath("/profile");
  return { ok: true };
}

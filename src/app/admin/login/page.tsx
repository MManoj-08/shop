import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwner } from "@/lib/session";
import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata: Metadata = {
  title: "Owner login | Mangalore Stores",
  robots: { index: false, follow: false },
};

export default async function OwnerLoginPage() {
  if (await getOwner()) redirect("/admin");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-green-950/10 bg-white p-8">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Shop owner</span>
        <h1 className="mt-4 font-display text-3xl font-medium text-green-950">Owner login</h1>
        <p className="mb-6 mt-1 text-stone-500">Log in with the owner&apos;s mobile number and password to manage orders and products.</p>
        <LoginForm next="/admin" mode="owner" />
      </div>
    </div>
  );
}

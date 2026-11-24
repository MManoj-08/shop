import type { Metadata } from "next";
import Link from "next/link";
import { findValidReset } from "@/lib/reset";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Choose a new password | Kudla Santhe",
  robots: { index: false, follow: false },
  // the secret is in this page's address, so never pass it on to another site
  referrer: "no-referrer",
};

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const reset = await findValidReset(token);

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-green-950/10 bg-white p-8">
      {reset ? (
        <>
          <h1 className="font-display text-3xl font-medium text-green-950">Choose a new password</h1>
          <p className="mb-6 mt-1 text-stone-500">
            {reset.user.name ? `Hello ${reset.user.name}. ` : ""}Pick a password you will remember.
          </p>
          <ResetForm token={token} />
        </>
      ) : (
        <div className="space-y-4">
          <h1 className="font-display text-3xl font-medium text-green-950">This link does not work</h1>
          <p className="text-stone-600">
            It may have expired (links last 30 minutes) or already been used. You can ask for a new one.
          </p>
          <Link
            href="/forgot-password"
            className="block w-full rounded-full bg-green-900 px-4 py-3.5 text-center font-semibold text-white transition hover:bg-green-700"
          >
            Get a new link
          </Link>
        </div>
      )}
    </div>
  );
}

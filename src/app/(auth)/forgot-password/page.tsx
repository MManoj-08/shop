import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password | Mangalore Stores", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-green-950/10 bg-white p-8">
      <h1 className="font-display text-3xl font-medium text-green-950">Forgot your password?</h1>
      <p className="mb-6 mt-1 text-stone-500">
        Enter your mobile number. We will email you a link to choose a new one.
      </p>
      <ForgotForm shopPhone={process.env.SHOP_PHONE || undefined} />
    </div>
  );
}

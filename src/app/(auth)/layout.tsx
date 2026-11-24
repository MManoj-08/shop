import { Suspense } from "react";
import { CartProvider } from "@/components/cart";
import { Header } from "@/components/header";

// The log in, sign up and password pages: the shop header and the form, nothing else.
// No footer links or "Shop now" button, so nothing pulls the customer away from the form.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <Suspense fallback={<div className="h-[68px]" aria-hidden />}>
        <Header />
      </Suspense>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Suspense>{children}</Suspense>
      </main>
    </CartProvider>
  );
}

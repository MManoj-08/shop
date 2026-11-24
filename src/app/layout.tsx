import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kudla Santhe - Fruits, Vegetables & Coastal Snacks, Sanjanagar, Bangalore",
  description:
    "Fresh fruits, vegetables and authentic Mangalore-Udupi snacks, delivered to your home in Bangalore.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}

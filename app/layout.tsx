import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { Lang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Devalayam — Temples of Telangana & Andhra Pradesh",
  description: "Discover temples, deities, timings, events and donations across Telangana and Andhra Pradesh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = (cookies().get("lang")?.value as Lang) ?? "en";
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Mukta:wght@300;400;500;600&family=Noto+Serif+Telugu:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen flex flex-col">
        <Header lang={lang} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang} />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CookieBanner } from "@/components/CookieBanner";
import { AccessTracker } from "@/components/AccessTracker";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { PageTransition } from "@/components/PageTransition";
import { getRequestLocale } from "@/lib/i18n-server";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SZA POWER | Compact Mobile Power",
    template: "%s | SZA POWER"
  },
  description:
    "SZA POWER designs polished compact power banks with refined finishes, USB-C charging, and everyday mobile energy.",
  alternates: { languages: { en: "/en", "zh-CN": "/cn" } },

  openGraph: {
    title: "SZA POWER | Compact Mobile Power",
    description: "Pocket-size power, polished for every day.",
    type: "website",
    siteName: "SZA POWER"
  },
  twitter: {
    card: "summary_large_image",
    title: "SZA POWER | Compact Mobile Power",
    description: "Pocket-size power, polished for every day."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8f8"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale === "cn" ? "zh-CN" : "en"} translate="no">
      <body className="notranslate antialiased" suppressHydrationWarning>
        <AccessTracker />
        <AppErrorBoundary><PageTransition>{children}</PageTransition></AppErrorBoundary>
        <CookieBanner />
      </body>
    </html>
  );
}

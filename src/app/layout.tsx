import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CookieBanner } from "@/components/CookieBanner";
import { AccessTracker } from "@/components/AccessTracker";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { PageTransition } from "@/components/PageTransition";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getRequestLocale } from "@/lib/i18n-server";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const canonical = `/${locale}`;
  const description =
    locale === "cn"
      ? "SZA POWER 专注于精致紧凑的 USB-C 移动电源，为日常携带、零售与合作项目提供多样配色与可靠电力。"
      : "SZA POWER designs polished compact USB-C power banks for everyday carry, retail, and business projects.";
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "BarryT | Compact Mobile Power",
      template: "%s | BarryT",
    },
    description,
    alternates: {
      canonical,
      languages: { en: "/en", "zh-CN": "/cn", "x-default": "/en" },
    },
    openGraph: {
      title: "BarryT | Compact Mobile Power",
      description,
      type: "website",
      siteName: "BarryT",
      url: canonical,
      locale: locale === "cn" ? "zh_CN" : "en_US",
      alternateLocale: locale === "cn" ? ["en_US"] : ["zh_CN"],
      images: [
        {
          url: "/og.png",
          width: 1536,
          height: 902,
          alt: "BarryT SZA POWER compact mobile power products",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "BarryT | Compact Mobile Power",
      description,
      images: ["/og.png"],
    },
  };
}

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
  const websiteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "BarryT",
        alternateName: "SZA POWER",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: new URL("/barry-t-wordmark.png", siteUrl).toString(),
        },
        email: "sales@sza-power.com",
        knowsAbout: [
          "USB-C power banks",
          "mobile power products",
          "wholesale distribution",
          "OEM and ODM projects",
          "corporate gifting",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "BarryT",
        alternateName: "SZA POWER",
        url: siteUrl,
        inLanguage: ["en", "zh-CN"],
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <html lang={locale === "cn" ? "zh-CN" : "en"} translate="no">
      <body className="notranslate antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c"),
          }}
        />
        <LocaleProvider initialLocale={locale}>
          <AccessTracker />
          <AppErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </AppErrorBoundary>
          <CookieBanner />
        </LocaleProvider>
      </body>
    </html>
  );
}

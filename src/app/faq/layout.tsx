import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { getSiteContent } from "@/lib/db";
import { getRequestLocale } from "@/lib/i18n-server";
import { buildPageMetadata } from "@/lib/seo";

export const runtime = "nodejs";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

export async function generateMetadata() {
  return buildPageMetadata(await getRequestLocale(), "faq");
}

export default async function FaqLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  const content = getSiteContent(locale);
  const faqs = [...(content.faq.faqs ?? []), ...(content.support.faqs ?? [])].filter(
    (item, index, list) =>
      list.findIndex((candidate) => candidate.question === item.question) ===
      index,
  );
  const url = `${siteUrl}/${locale}/faq`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: locale === "cn" ? "首页" : "Home",
              item: `${siteUrl}/${locale}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "FAQ",
              item: url,
            },
          ],
        }}
      />
      {children}
    </>
  );
}

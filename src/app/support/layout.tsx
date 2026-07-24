import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/i18n-server";
import { buildPageMetadata } from "@/lib/seo";
import { PageStructuredData } from "@/components/PageStructuredData";
import { JsonLd } from "@/components/JsonLd";
import { getSiteContent } from "@/lib/db";

export const runtime = "nodejs";

export async function generateMetadata() {
  return buildPageMetadata(await getRequestLocale(), "support");
}

export default async function SupportLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  const faqs = getSiteContent(locale).support.faqs ?? [];
  return (
    <PageStructuredData locale={locale} page="support">
      {faqs.length ? (
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
      ) : null}
      {children}
    </PageStructuredData>
  );
}

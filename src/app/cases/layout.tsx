import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { caseContent } from "@/lib/industry-content";
import { getRequestLocale } from "@/lib/i18n-server";
import { buildPageMetadata } from "@/lib/seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

export async function generateMetadata() {
  return buildPageMetadata(await getRequestLocale(), "cases");
}

export default async function CasesLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  const content = caseContent[locale];
  const url = `${siteUrl}/${locale}/cases`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: content.title,
          description: content.description,
          url,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: content.scenarios.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.title,
              description: item.summary,
            })),
          },
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
              name: locale === "cn" ? "合作场景" : "Cooperation scenarios",
              item: url,
            },
          ],
        }}
      />
      {children}
    </>
  );
}

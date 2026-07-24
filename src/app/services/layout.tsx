import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { servicesContent } from "@/lib/industry-content";
import { getRequestLocale } from "@/lib/i18n-server";
import { buildPageMetadata } from "@/lib/seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

export async function generateMetadata() {
  return buildPageMetadata(await getRequestLocale(), "services");
}

export default async function ServicesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getRequestLocale();
  const content = servicesContent[locale];
  const url = `${siteUrl}/${locale}/services`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name:
            locale === "cn"
              ? "SZA POWER 商业与产品服务"
              : "SZA POWER business and product services",
          description: content.description,
          provider: { "@type": "Organization", name: "SZA POWER" },
          areaServed: "Worldwide",
          url,
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: locale === "cn" ? "服务目录" : "Service catalog",
            itemListElement: content.items.map((item) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: item.title,
                description: item.summary,
              },
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
              name: locale === "cn" ? "服务" : "Services",
              item: url,
            },
          ],
        }}
      />
      {children}
    </>
  );
}

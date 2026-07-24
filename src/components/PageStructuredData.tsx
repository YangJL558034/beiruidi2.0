import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import type { SeoPage } from "@/lib/seo";
import type { Locale } from "@/lib/navigation";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
const names: Record<SeoPage, Record<Locale, string>> = {
  products: { en: "Products", cn: "产品" },
  shop: { en: "BarryT Store", cn: "BarryT 商城" },
  news: { en: "Customer reviews", cn: "用户评价" },
  services: { en: "Services", cn: "服务" },
  cases: { en: "Cooperation scenarios", cn: "合作场景" },
  faq: { en: "FAQ", cn: "常见问题" },
  about: { en: "About us", cn: "关于我们" },
  support: { en: "Product support", cn: "产品支持" },
  contact: { en: "Contact and inquiry", cn: "联系与询盘" },
  privacy: { en: "Privacy policy", cn: "隐私政策" },
  terms: { en: "Terms of use", cn: "使用条款" },
};

export function PageStructuredData({
  children,
  locale,
  page,
}: {
  children: ReactNode;
  locale: Locale;
  page: SeoPage;
}) {
  const url = `${siteUrl}/${locale}/${page}`;
  const name = names[page][locale];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name,
          url,
          inLanguage: locale === "cn" ? "zh-CN" : "en",
          isPartOf: {
            "@type": "WebSite",
            name: "BarryT",
            url: siteUrl,
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
              name,
              item: url,
            },
          ],
        }}
      />
      {children}
    </>
  );
}

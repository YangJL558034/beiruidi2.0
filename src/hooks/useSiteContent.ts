"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/content-types";
import type { Locale } from "@/lib/navigation";
import { pageText } from "@/lib/i18n";

const fallback = (locale: Locale): SiteContent => ({
  home: {
    eyebrow: "SZA POWER",
    title:
      locale === "cn"
        ? "口袋尺寸，随身电力，精湛工艺。"
        : "Pocket-size power. Polished for every day.",
    subtitle:
      locale === "cn"
        ? "以色彩、材质与 USB-C 充电打造的精致随身电力。"
        : "Compact mobile energy with thoughtful color, material, and USB-C charging.",
  },
  products: {
    eyebrow: pageText[locale].productsEyebrow,
    title: pageText[locale].productsTitle,
    subtitle: pageText[locale].productsSubtitle,
  },
  shop: {
    eyebrow:
      locale === "cn" ? "BarryT 独立商城" : "BarryT independent store",
    title:
      locale === "cn"
        ? "找到适合你的随身电力。"
        : "Find power that fits your day.",
    subtitle:
      locale === "cn"
        ? "浏览在售产品、规格与供应状态，加入采购清单后一次提交询价。批量、定制和区域价格由销售确认。"
        : "Browse available products, specifications, and supply status. Add products to one inquiry list for confirmed volume, custom, and regional pricing.",
  },
  services: {
    eyebrow: locale === "cn" ? "商业服务" : "Business services",
    title:
      locale === "cn"
        ? "从产品选择到项目交付，路径清晰。"
        : "A clear path from product selection to delivery.",
    subtitle: "",
  },
  cases: {
    eyebrow: locale === "cn" ? "合作场景" : "Cooperation scenarios",
    title:
      locale === "cn"
        ? "围绕真实采购需求组织产品方案。"
        : "Product solutions shaped around real buying needs.",
    subtitle: "",
  },
  faq: {
    eyebrow: "FAQ",
    title:
      locale === "cn"
        ? "关于产品、报价与合作的清晰回答。"
        : "Clear answers about products, pricing, and cooperation.",
    subtitle: "",
  },
  news: {
    eyebrow: locale === "cn" ? "用户评价" : "Customer reviews",
    title:
      locale === "cn"
        ? "来自客户与合作伙伴的真实评价。"
        : "Trusted by customers and partners.",
    subtitle:
      locale === "cn"
        ? "展示经过确认的用户、零售商、分销商及项目合作伙伴反馈。"
        : "Published feedback from customers, retailers, distributors, and project partners.",
    testimonials: [],
  },
  about: {
    eyebrow: pageText[locale].aboutEyebrow,
    title: pageText[locale].aboutTitle,
    subtitle: pageText[locale].aboutSubtitle,
  },
  support: {
    eyebrow: pageText[locale].supportEyebrow,
    title: pageText[locale].supportTitle,
    subtitle: "",
  },
  contact: {
    eyebrow: pageText[locale].contactEyebrow,
    title: pageText[locale].contactTitle,
    subtitle: pageText[locale].contactSubtitle,
  },
  privacy: {
    eyebrow: locale === "cn" ? "隐私政策" : "Privacy",
    title:
      locale === "cn"
        ? "您的信息只用于明确的用途。"
        : "Your information stays purposeful.",
    subtitle: "",
  },
  terms: {
    eyebrow: locale === "cn" ? "使用条款" : "Terms",
    title:
      locale === "cn"
        ? "清晰的网站使用约定。"
        : "Clear terms for using this website.",
    subtitle: "",
  },
});
export function useSiteContent(locale: Locale) {
  const [loaded, setLoaded] = useState<{
    locale: Locale;
    content: SiteContent;
  } | null>(null);
  const content = loaded?.locale === locale ? loaded.content : fallback(locale);
  useEffect(() => {
    let active = true;
    const preview =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview") === "1";
    fetch(
      `/api/site-content?locale=${locale}${preview ? "&preview=1" : ""}`,
      { cache: "no-store" },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.content)
          setLoaded({ locale, content: data.content });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [locale]);
  return content;
}

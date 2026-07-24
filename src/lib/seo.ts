import type { Metadata } from "next";
import type { Locale } from "@/lib/navigation";

export type SeoPage =
  | "products"
  | "shop"
  | "news"
  | "services"
  | "cases"
  | "faq"
  | "about"
  | "support"
  | "contact"
  | "privacy"
  | "terms";

const seoCopy: Record<
  SeoPage,
  Record<Locale, { title: string; description: string }>
> = {
  products: {
    en: {
      title: "Compact Power Banks",
      description:
        "Explore compact USB-C power banks in retail-ready colors and finishes.",
    },
    cn: {
      title: "移动电源产品",
      description: "探索多种配色与表面工艺的紧凑型 USB-C 移动电源。",
    },
  },
  shop: {
    en: {
      title: "BarryT Store and Purchase Inquiries",
      description:
        "Browse BarryT power products, build an inquiry bag, and request confirmed pricing for retail, wholesale, and OEM purchases.",
    },
    cn: {
      title: "BarryT 商城与采购询价",
      description:
        "浏览 BarryT 在售移动电源，加入采购清单，并提交零售、批发或 OEM 报价需求。",
    },
  },
  news: {
    en: {
      title: "Customer Reviews and Partner Feedback",
      description:
        "Read verified feedback from SZA POWER customers, retailers, distributors, and project partners.",
    },
    cn: {
      title: "用户评价与合作伙伴反馈",
      description:
        "查看经过确认的 SZA POWER 用户、零售商、分销商及项目合作伙伴评价。",
    },
  },
  services: {
    en: {
      title: "Wholesale, OEM and Product Services",
      description:
        "Explore SZA POWER wholesale, distribution, OEM / ODM, corporate gifting, and after-sales support for compact USB-C power products.",
    },
    cn: {
      title: "批发、OEM 与产品服务",
      description:
        "了解 SZA POWER 面向紧凑型 USB-C 移动电源的批发、分销、OEM / ODM、企业礼赠和售后支持。",
    },
  },
  cases: {
    en: {
      title: "Product Cooperation Scenarios",
      description:
        "See how SZA POWER products support retail distribution, OEM / ODM, and corporate gifting requirements without unverified claims.",
    },
    cn: {
      title: "产品合作场景",
      description:
        "了解 SZA POWER 产品如何支持零售分销、OEM / ODM 和企业礼赠需求，不使用未经核实的案例数据。",
    },
  },
  faq: {
    en: {
      title: "Power Bank, Wholesale and OEM FAQ",
      description:
        "Clear answers about SZA POWER products, quotations, wholesale, OEM / ODM, inventory, delivery, and product support.",
    },
    cn: {
      title: "移动电源、批发与 OEM 常见问题",
      description:
        "查看有关 SZA POWER 产品、报价、批发、OEM / ODM、库存、交付和产品支持的清晰回答。",
    },
  },
  about: {
    en: {
      title: "About SZA POWER",
      description:
        "Learn how SZA POWER develops compact mobile power products for retail, distribution, and OEM projects.",
    },
    cn: {
      title: "关于 SZA POWER",
      description: "了解 SZA POWER 面向零售、分销与 OEM 项目的移动电源产品开发。",
    },
  },
  support: {
    en: {
      title: "Product Support",
      description:
        "Find charging, battery care, warranty, and distribution support for SZA POWER products.",
    },
    cn: {
      title: "产品支持",
      description: "获取充电、电池保养、质保与分销支持信息。",
    },
  },
  contact: {
    en: {
      title: "Contact Sales",
      description:
        "Contact SZA POWER for product, wholesale, OEM, distribution, or after-sales inquiries.",
    },
    cn: {
      title: "联系销售",
      description: "提交产品、批发、OEM、分销或售后服务需求。",
    },
  },
  privacy: {
    en: {
      title: "Privacy Policy",
      description:
        "Read how this website collects, uses, and protects submitted information.",
    },
    cn: {
      title: "隐私政策",
      description: "了解本网站如何收集、使用和保护您提交的信息。",
    },
  },
  terms: {
    en: {
      title: "Terms of Use",
      description: "Read the terms that apply when using this website.",
    },
    cn: {
      title: "使用条款",
      description: "了解使用本网站时适用的条款。",
    },
  },
};

export function buildPageMetadata(
  locale: Locale,
  page: SeoPage,
): Metadata {
  const copy = seoCopy[page][locale];
  const path = `/${page}`;
  const canonical = `/${locale}${path}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        en: `/en${path}`,
        "zh-CN": `/cn${path}`,
        "x-default": `/en${path}`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: "website",
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
      title: copy.title,
      description: copy.description,
      images: ["/og.png"],
    },
  };
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { MessageCircle, Music2, Tv, Video } from "lucide-react";
import { usePathname } from "next/navigation";
import type { FooterContent } from "@/lib/content-types";
import { externalHref, getLocaleFromPathname, isExternalHref, isHttpExternalHref, withLocale } from "@/lib/i18n";
import { EditableSection } from "@/components/EditableSection";

type Locale = "cn" | "en";

type FooterLinkProps = {
  href: string;
  locale: Locale;
  className?: string;
  children: ReactNode;
};

function FooterLink({ href, locale, className, children }: FooterLinkProps) {
  const resolvedHref = isExternalHref(href) ? externalHref(href) : withLocale(href, locale);
  if (isExternalHref(href)) {
    return (
      <a
        href={resolvedHref}
        target={isHttpExternalHref(href) ? "_blank" : undefined}
        rel={isHttpExternalHref(href) ? "noopener noreferrer" : undefined}
        className={className}
      >
        {children}
      </a>
    );
  }
  return <Link href={resolvedHref} className={className}>{children}</Link>;
}

function SocialIcon({ platform }: { platform: NonNullable<FooterContent["socialLinks"]>[number]["platform"] }) {
  const props = { size: 18, strokeWidth: 1.8 };
  if (platform === "youtube") return <Video {...props} />;
  if (platform === "instagram") return <span className="text-[10px] font-bold leading-none">IG</span>;
  if (platform === "facebook") return <span className="text-[17px] font-bold leading-none">f</span>;
  if (platform === "bilibili") return <Tv {...props} />;
  if (platform === "kuaishou") return <Video {...props} />;
  if (platform === "weibo") return <MessageCircle {...props} />;
  if (platform === "x") return <span className="text-[15px] font-bold leading-none">X</span>;
  return <Music2 {...props} />;
}

function fallbackFooter(locale: Locale): FooterContent {
  if (locale === "cn") return {
    disclaimer: "SZA POWER 产品与服务会根据市场、项目类型及当地电气标准配置。产品图片仅用于展示。",
    copyright: "Copyright 2026 SZA POWER。保留所有权利。",
    legalLinks: [{ label: "隐私政策", href: "/privacy" }, { label: "使用条款", href: "/terms" }, { label: "联系我们", href: "/contact" }],
    columns: [
      { title: "选购与了解", links: [{ label: "产品", href: "/products" }, { label: "USB-C 电源", href: "/products/orange-edition" }, { label: "彩色系列", href: "/products/pastel-stack" }, { label: "支持", href: "/support" }] },
      { title: "服务", links: [{ label: "批发", href: "/contact" }, { label: "OEM 项目", href: "/contact" }, { label: "零售陈列", href: "/products" }, { label: "产品保养", href: "/support" }] },
      { title: "商业合作", links: [{ label: "分销商", href: "/contact" }, { label: "零售商", href: "/contact" }, { label: "企业礼品", href: "/contact" }] },
      { title: "关于 SZA", links: [{ label: "公司介绍", href: "/about" }, { label: "资讯", href: "/news" }, { label: "联系我们", href: "/contact" }] }
    ]
  };
  return {
    disclaimer: "SZA POWER products and services are configured according to market, project, and local electrical requirements. Product images are for presentation only.",
    copyright: "Copyright 2026 SZA POWER. All rights reserved.",
    legalLinks: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Contact", href: "/contact" }],
    columns: [
      { title: "Shop and learn", links: [{ label: "Products", href: "/products" }, { label: "USB-C Power", href: "/products/orange-edition" }, { label: "Color Series", href: "/products/pastel-stack" }, { label: "Support", href: "/support" }] },
      { title: "Services", links: [{ label: "Wholesale", href: "/contact" }, { label: "OEM Projects", href: "/contact" }, { label: "Retail Display", href: "/products" }, { label: "Product Care", href: "/support" }] },
      { title: "For business", links: [{ label: "Distributors", href: "/contact" }, { label: "Retailers", href: "/contact" }, { label: "Corporate Gifts", href: "/contact" }] },
      { title: "About SZA", links: [{ label: "Company", href: "/about" }, { label: "News", href: "/news" }, { label: "Contact", href: "/contact" }] }
    ]
  };
}

export function SiteFooter() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const [loaded, setLoaded] = useState<{ locale: Locale; content: FooterContent } | null>(null);
  const fallback = fallbackFooter(locale);
  const content = loaded?.locale === locale ? loaded.content : fallback;

  useEffect(() => {
    let active = true;
    fetch(`/api/footer?locale=${locale}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data?.content) setLoaded({ locale, content: data.content }); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [locale]);

  return (
    <footer className="relative bg-[#f5f5f7] px-5 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-xs leading-5 text-[#6e6e73]">
      <EditableSection footer label={locale === "cn" ? "编辑底部" : "Edit footer"}/>
      <div className="mx-auto max-w-5xl">
        <p className="break-words border-b border-black/10 pb-5">{content.disclaimer}</p>
        <div className="grid gap-7 border-b border-black/10 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.columns.map((column) => (
            <div key={column.title}>
              <h2 className="mb-2 font-semibold text-[#1d1d1f]">{column.title}</h2>
              <ul className="grid gap-1">
                {column.links.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <FooterLink href={item.href} locale={locale} className="break-words hover:underline">{item.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>{content.copyright}</span>{content.icpNumber ? <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-[#6e6e73] hover:text-[#1d1d1f] hover:underline">{content.icpNumber}</a> : null}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {content.legalLinks.map((item) => (
              <FooterLink key={`${item.href}-${item.label}`} href={item.href} locale={locale} className="hover:underline">{item.label}</FooterLink>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-4 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(content.socialLinks ?? []).filter((item) => item.href).map((item) => (
              <a key={`${item.platform}-${item.href}`} href={externalHref(item.href)} target="_blank" rel="noopener noreferrer" aria-label={item.label} title={item.label} className="grid size-9 place-items-center rounded-full border border-black/10 bg-white text-[#1d1d1f] transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-[#1d1d1f] hover:text-white">
                <SocialIcon platform={item.platform} />
              </a>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
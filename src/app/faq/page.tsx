"use client";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConversionBand } from "@/components/ConversionBand";
import { FaqSection } from "@/components/PageBusinessBlocks";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function FaqPage() {
  const locale = useLocale();
  const siteContent = useSiteContent(locale);
  const faqs = [
    ...(siteContent.faq.faqs ?? []),
    ...(siteContent.support.faqs ?? []),
  ].filter(
    (item, index, list) =>
      list.findIndex((candidate) => candidate.question === item.question) ===
      index,
  );

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[{ label: "FAQ" }]}
        className="border-b border-black/[0.06] bg-white"
      />
      <section className="bg-white px-5 pb-10 pt-14 text-center sm:pb-14 sm:pt-20">
        <p className="text-sm font-semibold text-[#0071e3]">
          {siteContent.faq.eyebrow || "FAQ"}
        </p>
        <h1 className="mx-auto mt-3 max-w-5xl text-balance text-[42px] font-semibold leading-[1.06] sm:text-[68px]">
          {siteContent.faq.title}
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-8 text-[#5f6670]">
          {siteContent.faq.subtitle}
        </p>
      </section>
      <FaqSection
        locale={locale}
        content={{ ...siteContent.support, faqs }}
      />
      <ConversionBand locale={locale} />
      <SiteFooter />
    </main>
  );
}

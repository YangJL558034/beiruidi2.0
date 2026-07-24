"use client";

import { BatteryCharging, Cable, ShieldCheck, Truck } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { ContentSectionList } from "@/components/ContentSectionList";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageText } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { EditableSection } from "@/components/EditableSection";
import { PageMedia } from "@/components/PageMedia";
import { PageContentActions } from "@/components/PageContentActions";
import { useSiteContent } from "@/hooks/useSiteContent";
import {
  FaqSection,
  PageNotice,
  ResourceSection,
} from "@/components/PageBusinessBlocks";

export default function SupportPage() {
  const locale = useLocale();
  const t = pageText[locale];
  const siteContent = useSiteContent(locale);

  const section = (id: string) =>
    siteContent.support.sections?.find((item) => item.id === id);
  const supportItems = [
    {
      content: section("charging"),
      title: section("charging")?.title || t.chargingBasics,
      copy: section("charging")?.subtitle || t.chargingBasicsCopy,
      icon: Cable,
    },
    {
      content: section("battery"),
      title: section("battery")?.title || t.batteryCare,
      copy: section("battery")?.subtitle || t.batteryCareCopy,
      icon: BatteryCharging,
    },
    {
      content: section("warranty"),
      title: section("warranty")?.title || t.warrantySupport,
      copy: section("warranty")?.subtitle || t.warrantySupportCopy,
      icon: ShieldCheck,
    },
    {
      content: section("distribution"),
      title: section("distribution")?.title || t.distributionHelp,
      copy: section("distribution")?.subtitle || t.distributionHelpCopy,
      icon: Truck,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[{ label: locale === "cn" ? "产品支持" : "Product support" }]}
        className="border-b border-black/[0.06] bg-white"
      />
      <PageNotice content={siteContent.support} />
      <section className="relative bg-white px-5 py-20 text-center sm:py-28">
        <EditableSection
          label={
            locale === "cn"
              ? "\u7f16\u8f91\u652f\u6301\u9875"
              : "Edit support page"
          }
        />
        <p className="text-[21px] font-semibold">
          {siteContent.support.eyebrow || t.supportEyebrow}
        </p>
        <h1 className="mx-auto mt-2 max-w-4xl text-balance text-[44px] font-semibold leading-[1.05] sm:text-[72px]">
          {siteContent.support.title || t.supportTitle}
        </h1>
        {siteContent.support.subtitle ? (
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6e6e73]">
            {siteContent.support.subtitle}
          </p>
        ) : null}
        <PageContentActions content={siteContent.support} locale={locale} />
      </section>
      <PageMedia
        media={siteContent.support.media}
        className="mx-3 mb-3 h-[360px] rounded-[8px] sm:h-[500px]"
      />
      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {supportItems.filter((item) => item.content?.visible !== false).map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="overflow-hidden rounded-[8px] bg-white"
              >
                <PageMedia
                  media={item.content?.media}
                  className="h-56 w-full"
                />
                <div className="p-7">
                  <Icon size={28} strokeWidth={1.7} />
                  <h2 className="mt-8 text-2xl font-semibold">{item.title}</h2>
                  <p className="mt-3 text-base leading-7 text-[#6e6e73]">
                    {item.copy}
                  </p>
                  {item.content ? (
                    <PageContentActions
                      content={item.content}
                      locale={locale}
                      className="justify-start"
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <ContentSectionList
        sections={siteContent.support.sections}
        locale={locale}
        excludeIds={["charging", "battery", "warranty", "distribution"]}
      />
      <FaqSection content={siteContent.support} locale={locale} />
      <ResourceSection content={siteContent.support} locale={locale} />
      <SiteFooter />
    </main>
  );
}

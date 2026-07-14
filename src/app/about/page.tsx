"use client";

import Image from "next/image";
import { CheckCircle2, Factory, Globe2 } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { ContentSectionList } from "@/components/ContentSectionList";
import { SiteHeader } from "@/components/SiteHeader";
import { pageText, getLocaleFromPathname } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { EditableSection } from "@/components/EditableSection";
import { PageMedia } from "@/components/PageMedia";
import { PageContentActions } from "@/components/PageContentActions";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function AboutPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = pageText[locale];
  const siteContent = useSiteContent(locale);

  const section = (id:string) => siteContent.about.sections?.find((item) => item.id === id);
  const values = [
    { content: section("company"), title: section("company")?.title || t.designLed, copy: section("company")?.subtitle || t.designLedCopy, icon: CheckCircle2 },
    { content: section("philosophy"), title: section("philosophy")?.title || t.retailReady, copy: section("philosophy")?.subtitle || t.retailReadyCopy, icon: Factory },
    { content: section("cooperation"), title: section("cooperation")?.title || t.globalMinded, copy: section("cooperation")?.subtitle || t.globalMindedCopy, icon: Globe2 }
  ];

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <section className="relative grid min-h-[720px] bg-white lg:grid-cols-2">
        <EditableSection label={locale === "cn" ? "编辑关于页" : "Edit about page"} />
        <div className="flex flex-col justify-center px-5 py-16 text-center lg:px-14 lg:text-left">
          <p className="text-[21px] font-semibold">{siteContent.about.eyebrow || t.aboutEyebrow}</p>
          <h1 className="mt-3 text-balance text-[44px] font-semibold leading-[1.06] sm:text-[72px]">
            {siteContent.about.title || t.aboutTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-balance text-[22px] leading-[1.32] text-[#4a4a4f]">
            {siteContent.about.subtitle || t.aboutSubtitle}
          </p>
          <PageContentActions content={siteContent.about} locale={locale} className="lg:justify-start" />
        </div>
        <div className="relative min-h-[420px] overflow-hidden">
          <Image src="/products/web/power-stack-blue.webp" alt="SZA POWER product family" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-center" />
        </div>
      </section>
      <PageMedia media={siteContent.about.media} className="mx-3 mb-3 h-[360px] rounded-[8px] sm:h-[500px]" />
      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="overflow-hidden rounded-[8px] bg-white">
                <PageMedia media={value.content?.media} className="h-56 w-full" />
                <div className="p-7">
                <Icon size={26} strokeWidth={1.7} />
                <h2 className="mt-8 text-2xl font-semibold">{value.title}</h2>
                  <p className="mt-3 text-base leading-7 text-[#6e6e73]">{value.copy}</p>
                  {value.content ? <PageContentActions content={value.content} locale={locale} className="justify-start" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <ContentSectionList sections={siteContent.about.sections} locale={locale} excludeIds={["company","philosophy","cooperation"]} />
      <SiteFooter />
    </main>
  );
}

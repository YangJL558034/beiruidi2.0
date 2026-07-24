"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConversionBand } from "@/components/ConversionBand";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import { withLocale } from "@/lib/i18n";
import { useSiteContent } from "@/hooks/useSiteContent";
import { PageMedia } from "@/components/PageMedia";

export default function CasesPage() {
  const locale = useLocale();
  const content = useSiteContent(locale).cases;
  const scenarios = (content.sections ?? []).filter(
    (item) => item.visible !== false,
  );

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: locale === "cn" ? "合作场景" : "Cooperation scenarios" },
        ]}
        className="border-b border-black/[0.06] bg-white"
      />
      <section className="bg-white px-5 pb-16 pt-14 text-center sm:pb-24 sm:pt-20">
        <p className="text-sm font-semibold text-[#0071e3]">
          {content.eyebrow}
        </p>
        <h1 className="mx-auto mt-3 max-w-5xl text-balance text-[42px] font-semibold leading-[1.06] sm:text-[68px]">
          {content.title}
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-8 text-[#5f6670]">
          {content.subtitle}
        </p>
        <p className="mx-auto mt-6 inline-flex max-w-3xl items-start gap-2 rounded-[8px] bg-[#f5f7fb] px-4 py-3 text-left text-sm leading-6 text-[#5f6670]">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[#0071e3]"
            aria-hidden="true"
          />
          {content.notice}
        </p>
      </section>
      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-5">
          {scenarios.map((scenario, index) => (
            <article
              id={scenario.id}
              key={scenario.id}
              className="grid scroll-mt-24 overflow-hidden rounded-[12px] bg-white lg:grid-cols-2"
            >
              <div
                className={`relative min-h-[320px] ${index % 2 ? "lg:order-2" : ""}`}
              >
                <PageMedia
                  media={scenario.media}
                  className="min-h-[320px] w-full lg:h-full"
                />
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <p className="text-sm font-semibold text-[#0071e3]">
                  {scenario.eyebrow}
                </p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight">
                  {scenario.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-[#6e6e73]">
                  {scenario.subtitle}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {(scenario.items ?? []).map((need) => (
                    <li
                      key={need}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f6ff] px-3 py-1.5 text-xs font-semibold text-[#0059a8]"
                    >
                      <CheckCircle2 size={14} aria-hidden="true" />
                      {need}
                    </li>
                  ))}
                </ul>
                <Link
                  href={withLocale(scenario.primaryHref || "/contact", locale)}
                  target={scenario.primaryTarget}
                  rel={scenario.primaryTarget === "_blank" ? "noopener noreferrer" : undefined}
                  className="mt-7 inline-flex items-center gap-1 text-sm font-semibold text-[#0071e3]"
                >
                  {scenario.primaryLabel ||
                    (locale === "cn" ? "了解相关方案" : "Explore the solution")}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <ConversionBand locale={locale} />
      <SiteFooter />
    </main>
  );
}

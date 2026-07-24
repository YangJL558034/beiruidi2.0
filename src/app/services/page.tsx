"use client";

import {
  Boxes,
  Building2,
  Gift,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConversionBand } from "@/components/ConversionBand";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import { useSiteContent } from "@/hooks/useSiteContent";

const icons = [Boxes, Building2, Gift, Headphones];

export default function ServicesPage() {
  const locale = useLocale();
  const content = useSiteContent(locale).services;
  const serviceItems = (content.sections ?? []).filter(
    (item) => item.visible !== false && !item.id.startsWith("process-"),
  );
  const process = (content.sections ?? []).filter(
    (item) => item.visible !== false && item.id.startsWith("process-"),
  );

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[{ label: locale === "cn" ? "服务" : "Services" }]}
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
      </section>

      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="max-w-4xl text-lg leading-8 text-[#3f3f43]">
            {content.labels?.intro}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {serviceItems.map((item, index) => {
              const Icon = icons[index] ?? Boxes;
              return (
                <article
                  id={item.id}
                  key={item.id}
                  className="scroll-mt-24 rounded-[12px] bg-white p-6 sm:p-8"
                >
                  <Icon size={28} strokeWidth={1.7} aria-hidden="true" />
                  <h2 className="mt-7 text-2xl font-semibold">{item.title}</h2>
                  <p className="mt-3 text-base leading-7 text-[#6e6e73]">
                    {item.subtitle}
                  </p>
                  <ul className="mt-6 grid gap-3">
                    {(item.items ?? []).map((deliverable) => (
                      <li
                        key={deliverable}
                        className="flex items-start gap-2 text-sm leading-6 text-[#3f3f43]"
                      >
                        <CheckCircle2
                          size={17}
                          className="mt-1 shrink-0 text-[#0071e3]"
                          aria-hidden="true"
                        />
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-[#0071e3]">
            {locale === "cn" ? "合作流程" : "Process"}
          </p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {content.labels?.processTitle}
          </h2>
          <ol className="mt-9 grid gap-4 md:grid-cols-4">
            {process.map((step, index) => (
              <li
                key={step.title}
                className="rounded-[12px] border border-black/[0.08] p-5"
              >
                <span className="grid size-9 place-items-center rounded-full bg-[#eaf3ff] text-sm font-semibold text-[#0071e3]">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6e6e73]">{step.subtitle}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <ConversionBand locale={locale} />
      <SiteFooter />
    </main>
  );
}

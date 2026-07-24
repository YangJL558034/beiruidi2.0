"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import type { SitePageContent } from "@/lib/content-types";
import { withLocale } from "@/lib/i18n";

export function PageNotice({ content }: { content: SitePageContent }) {
  if (!content.notice) return null;
  return (
    <div className="border-b border-black/[0.08] bg-[#eef6ff] px-5 py-3 text-center text-sm font-medium text-[#0059a8]">
      {content.notice}
    </div>
  );
}

export function MetricsStrip({ content }: { content: SitePageContent }) {
  if (!content.metrics?.length) return null;
  return (
    <section className="border-y border-black/[0.08] bg-white px-5 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
        {content.metrics.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="text-center sm:border-r sm:border-black/[0.08] sm:last:border-0"
          >
            <p className="text-2xl font-semibold sm:text-3xl">{item.value}</p>
            <p className="mt-1 text-sm text-[#6e6e73]">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FaqSection({
  content,
  locale,
}: {
  content: SitePageContent;
  locale: "cn" | "en";
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value
      ? content.faqs?.filter((item) =>
          `${item.question} ${item.answer}`.toLowerCase().includes(value),
        )
      : content.faqs;
  }, [content.faqs, query]);
  if (!content.faqs?.length) return null;
  return (
    <section className="bg-white px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#0071e3]">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
              {locale === "cn" ? "常见问题" : "Frequently asked questions"}
            </h2>
          </div>
          <label className="relative sm:w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e73]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === "cn" ? "搜索问题" : "Search questions"}
              aria-label={
                locale === "cn" ? "搜索常见问题" : "Search frequently asked questions"
              }
              className="min-h-11 w-full rounded-md border border-black/10 pl-9 pr-3 text-sm outline-none focus:border-[#0071e3]"
            />
          </label>
        </div>
        <div className="mt-8 grid gap-2">
          {visible?.map((item, index) => (
            <details
              key={`${item.question}-${index}`}
              className="group rounded-md border border-black/[0.08] bg-[#fbfbfd] px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.question}
                <ChevronDown
                  size={17}
                  className="shrink-0 transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6e6e73]">
                {item.answer}
              </p>
            </details>
          ))}
          {!visible?.length ? (
            <p className="py-10 text-center text-sm text-[#6e6e73]">
              {locale === "cn" ? "没有匹配的问题。" : "No matching questions."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ResourceSection({
  content,
  locale,
}: {
  content: SitePageContent;
  locale: "cn" | "en";
}) {
  if (!content.resources?.length) return null;
  return (
    <section className="px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold">
          {locale === "cn" ? "服务与资源" : "Services and resources"}
        </h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {content.resources.map((item, index) => (
            <Link
              key={`${item.title}-${index}`}
              href={withLocale(item.href, locale)}
              className="group rounded-md border border-black/[0.08] bg-white p-6 hover:border-[#0071e3]/30"
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6e6e73]">
                {item.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0071e3]">
                {item.label}
                <ArrowRight
                  size={15}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

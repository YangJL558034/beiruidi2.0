import { PageContentActions } from "@/components/PageContentActions";
import { PageMedia } from "@/components/PageMedia";
import type { SiteContentSection } from "@/lib/content-types";

export function ContentSectionList({
  sections,
  locale,
  excludeIds = []
}: {
  sections?: SiteContentSection[];
  locale: "cn" | "en";
  excludeIds?: string[];
}) {
  const visible = (sections ?? []).filter((section) => !excludeIds.includes(section.id));
  if (!visible.length) return null;

  return (
    <section className="grid gap-5 bg-[#f5f5f7] p-3 sm:gap-3">
      {visible.map((section, index) => (
        <article key={section.id} className="overflow-hidden rounded-[28px] bg-white lg:grid lg:min-h-[520px] lg:grid-cols-2">
          <div className={`flex flex-col justify-center px-6 py-14 text-center sm:px-12 lg:px-16 lg:text-left ${index % 2 ? "lg:order-2" : ""}`}>
            {section.eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6e6e73]">{section.eyebrow}</p> : null}
            <h2 className="mt-3 text-balance text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[54px]">{section.title}</h2>
            {section.subtitle ? <p className="mt-4 text-[18px] leading-8 text-[#6e6e73]">{section.subtitle}</p> : null}
            <PageContentActions content={section} locale={locale} className="lg:justify-start" />
          </div>
          {section.media?.src ? (
            <PageMedia media={section.media} className={`min-h-[300px] h-[min(76vw,420px)] sm:h-[420px] lg:h-full ${index % 2 ? "lg:order-1" : ""}`} />
          ) : (
            <div className={`min-h-[260px] bg-gradient-to-br from-[#eef4ff] via-[#f5f5f7] to-[#e7e7eb] ${index % 2 ? "lg:order-1" : ""}`} />
          )}
        </article>
      ))}
    </section>
  );
}

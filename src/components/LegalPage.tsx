"use client";

import { usePathname } from "next/navigation";
import { EditableSection } from "@/components/EditableSection";
import { PageContentActions } from "@/components/PageContentActions";
import { PageMedia } from "@/components/PageMedia";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import { getLocaleFromPathname } from "@/lib/i18n";
import type { SiteContentSection } from "@/lib/content-types";

const fallback: Record<"privacy" | "terms", Record<"cn" | "en", { eyebrow:string; title:string; intro:string; sections:SiteContentSection[] }>> = {
  privacy: {
    en: { eyebrow:"Privacy", title:"Your information stays purposeful.", intro:"This policy explains what information SZA POWER collects through this website and how it is used.", sections:[
      {id:"information",title:"Information we collect",subtitle:"When you submit an inquiry, we collect the contact and project information you provide."},
      {id:"usage",title:"How we use it",subtitle:"Inquiry details are used to reply to product, wholesale, OEM, and support requests. We do not sell personal information."},
      {id:"storage",title:"Storage and contact",subtitle:"Records are retained only as needed for business follow-up and legal obligations."}
    ] },
    cn: { eyebrow:"隐私政策", title:"您的信息只用于明确的用途。", intro:"本政策说明 SZA POWER 通过本网站收集哪些信息，以及如何使用这些信息。", sections:[
      {id:"information",title:"我们收集的信息",subtitle:"当您提交询盘时，我们会收集您主动填写的联系方式与项目信息。"},
      {id:"usage",title:"信息用途",subtitle:"询盘信息仅用于回复产品、批发、OEM 与售后需求。我们不会出售个人信息。"},
      {id:"storage",title:"保存与联系",subtitle:"记录仅在业务跟进和法律要求所需期限内保存。"}
    ] }
  },
  terms: {
    en: { eyebrow:"Terms", title:"Clear terms for using this website.", intro:"By using this website, you agree to the following basic terms.", sections:[
      {id:"website",title:"Website content",subtitle:"Product images, descriptions, and specifications are for presentation and may change by market or project."},
      {id:"acceptable",title:"Acceptable use",subtitle:"Do not misuse the website, attempt unauthorized access, or submit unlawful or harmful content."},
      {id:"liability",title:"Liability and updates",subtitle:"The website is provided as available. SZA POWER may update these terms and website content."}
    ] },
    cn: { eyebrow:"使用条款", title:"清晰的网站使用约定。", intro:"访问或使用本网站，即表示您同意以下基本条款。", sections:[
      {id:"website",title:"网站内容",subtitle:"产品图片、描述与参数用于展示，可能因市场或项目而调整。"},
      {id:"acceptable",title:"合理使用",subtitle:"请勿滥用网站、尝试未经授权的访问，或提交违法、有害内容。"},
      {id:"liability",title:"责任与更新",subtitle:"网站按现状提供。SZA POWER 可根据产品与服务发展更新本条款及网站内容。"}
    ] }
  }
};

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const locale = getLocaleFromPathname(usePathname());
  const siteContent = useSiteContent(locale);
  const content = siteContent[type];
  const defaults = fallback[type][locale];
  const sections = content.sections?.length ? content.sections : defaults.sections;

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <header className="relative bg-white px-5 py-20 text-center sm:py-28">
        <EditableSection label={locale === "cn" ? `编辑${type === "privacy" ? "隐私政策" : "使用条款"}` : `Edit ${type}`} />
        <p className="text-[21px] font-semibold">{content.eyebrow || defaults.eyebrow}</p>
        <h1 className="mx-auto mt-2 max-w-4xl text-balance text-[44px] font-semibold leading-[1.05] sm:text-[68px]">{content.title || defaults.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6e6e73]">{content.subtitle || defaults.intro}</p>
        <PageContentActions content={content} locale={locale} />
      </header>
      <PageMedia media={content.media} className="mx-3 mb-3 h-[320px] rounded-[28px] sm:h-[500px]" />
      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-4xl gap-4">
          {sections.map((section) => (
            <article key={section.id} className="overflow-hidden rounded-[18px] bg-white">
              <PageMedia media={section.media} className="h-64 w-full" />
              <div className="p-7">
                {section.eyebrow ? <p className="text-sm font-semibold text-[#0071e3]">{section.eyebrow}</p> : null}
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <p className="mt-3 text-base leading-7 text-[#6e6e73]">{section.subtitle}</p>
                <PageContentActions content={section} locale={locale} className="justify-start" />
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
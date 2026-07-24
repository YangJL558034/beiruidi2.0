"use client";

import { EditableSection } from "@/components/EditableSection";
import { PageContentActions } from "@/components/PageContentActions";
import { PageMedia } from "@/components/PageMedia";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useLocale } from "@/components/LocaleProvider";
import type { SiteContentSection } from "@/lib/content-types";
import { PageNotice, ResourceSection } from "@/components/PageBusinessBlocks";

const fallback: Record<
  "privacy" | "terms",
  Record<
    "cn" | "en",
    {
      eyebrow: string;
      title: string;
      intro: string;
      sections: SiteContentSection[];
    }
  >
> = {
  privacy: {
    en: {
      eyebrow: "Privacy",
      title: "Your information stays purposeful.",
      intro:
        "This policy explains what information SZA POWER collects through this website and how it is used.",
      sections: [
        {
          id: "information",
          title: "Information we collect",
          subtitle:
            "When you submit an inquiry, we collect the contact and project information you provide.",
        },
        {
          id: "usage",
          title: "How we use it",
          subtitle:
            "Inquiry details are used to reply to product, wholesale, OEM, and support requests. We do not sell personal information.",
        },
        {
          id: "storage",
          title: "Retention and security",
          subtitle:
            "Inquiry, access, and security records are retained only as needed for business follow-up, service security, abuse prevention, and legal obligations. Administrative access is restricted.",
        },
        {
          id: "analytics",
          title: "Access analytics and cookies",
          subtitle:
            "The website records limited access information such as the requested path, time, browser information, referrer, and network address for security and operational analytics. Essential cookies protect administrator sessions; preference cookies remember consent choices.",
        },
        {
          id: "rights",
          title: "Your choices and contact",
          subtitle:
            "You may ask about, correct, or request deletion of inquiry information, subject to applicable legal and operational retention requirements, by contacting sales@sza-power.com.",
        },
        {
          id: "customer-center",
          title: "Optional customer accounts and support chats",
          subtitle:
            "Registration is optional. If you create an account, we store your verified email, encrypted password, consent record, support messages, assignments, and authorized attachments so you can continue the same conversation. Private files are available only to you and authorized staff. The customer center provides self-service data export and permanent account deletion.",
        },
      ],
    },
    cn: {
      eyebrow: "隐私政策",
      title: "您的信息只用于明确的用途。",
      intro:
        "本政策说明 SZA POWER 通过本网站收集哪些信息，以及如何使用这些信息。",
      sections: [
        {
          id: "information",
          title: "我们收集的信息",
          subtitle:
            "当您提交询盘时，我们会收集您主动填写的联系方式与项目信息。",
        },
        {
          id: "usage",
          title: "信息用途",
          subtitle:
            "询盘信息仅用于回复产品、批发、OEM 与售后需求。我们不会出售个人信息。",
        },
        {
          id: "storage",
          title: "保存与安全",
          subtitle:
            "询盘、访问与安全记录仅在业务跟进、服务安全、滥用防护和法律要求所需期限内保存。后台访问受到权限控制。",
        },
        {
          id: "analytics",
          title: "访问统计与 Cookie",
          subtitle:
            "本网站会记录请求路径、时间、浏览器信息、来源页面和网络地址等有限访问数据，用于安全和运营统计。必要 Cookie 用于保护后台会话，偏好 Cookie 用于记住同意选择。",
        },
        {
          id: "rights",
          title: "您的选择与联系方式",
          subtitle:
            "在适用法律和必要保存要求允许的范围内，您可以通过 sales@sza-power.com 查询、更正或申请删除询盘信息。",
        },
        {
          id: "customer-center",
          title: "可选客户账号与在线客服",
          subtitle:
            "注册完全自愿。创建账号后，我们会保存已验证邮箱、加密密码、授权记录、客服消息、分配记录及您主动上传的附件，以便下次继续原会话。私有附件仅本人和获授权客服可访问；客户中心支持自助导出数据及永久删除账号。",
        },
      ],
    },
  },
  terms: {
    en: {
      eyebrow: "Terms",
      title: "Clear terms for using this website.",
      intro: "By using this website, you agree to the following basic terms.",
      sections: [
        {
          id: "website",
          title: "Website content",
          subtitle:
            "Product images, descriptions, and specifications are for presentation and may change by market or project.",
        },
        {
          id: "acceptable",
          title: "Acceptable use",
          subtitle:
            "Do not misuse the website, attempt unauthorized access, or submit unlawful or harmful content.",
        },
        {
          id: "liability",
          title: "Liability and updates",
          subtitle:
            "The website is provided as available. SZA POWER may update these terms and website content.",
        },
        {
          id: "commercial",
          title: "Quotations and commercial terms",
          subtitle:
            "Website prices, availability, delivery information, and project descriptions are not final offers. Binding specifications and commercial terms are confirmed separately in writing.",
        },
      ],
    },
    cn: {
      eyebrow: "使用条款",
      title: "清晰的网站使用约定。",
      intro: "访问或使用本网站，即表示您同意以下基本条款。",
      sections: [
        {
          id: "website",
          title: "网站内容",
          subtitle: "产品图片、描述与参数用于展示，可能因市场或项目而调整。",
        },
        {
          id: "acceptable",
          title: "合理使用",
          subtitle: "请勿滥用网站、尝试未经授权的访问，或提交违法、有害内容。",
        },
        {
          id: "liability",
          title: "责任与更新",
          subtitle:
            "网站按现状提供。SZA POWER 可根据产品与服务发展更新本条款及网站内容。",
        },
        {
          id: "commercial",
          title: "报价与商务条款",
          subtitle:
            "网站价格、供货、交付信息与项目说明不构成最终要约。具有约束力的规格与商务条款需另行书面确认。",
        },
      ],
    },
  },
};

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const locale = useLocale();
  const siteContent = useSiteContent(locale);
  const content = siteContent[type];
  const defaults = fallback[type][locale];
  const baseSections = content.sections?.length
    ? content.sections
    : defaults.sections;
  const requiredPrivacySection = fallback.privacy[locale].sections.find(
    (item) => item.id === "customer-center",
  );
  const sections =
    type === "privacy" &&
    requiredPrivacySection &&
    !baseSections.some((item) => item.id === "customer-center")
      ? [...baseSections, requiredPrivacySection]
      : baseSections;

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[
          {
            label:
              type === "privacy"
                ? locale === "cn"
                  ? "隐私政策"
                  : "Privacy policy"
                : locale === "cn"
                  ? "使用条款"
                  : "Terms of use",
          },
        ]}
        className="border-b border-black/[0.06] bg-white"
      />
      <PageNotice content={content} />
      <header className="relative bg-white px-5 py-20 text-center sm:py-28">
        <EditableSection
          label={
            locale === "cn"
              ? `编辑${type === "privacy" ? "隐私政策" : "使用条款"}`
              : `Edit ${type}`
          }
        />
        <p className="text-[21px] font-semibold">
          {content.eyebrow || defaults.eyebrow}
        </p>
        <h1 className="mx-auto mt-2 max-w-4xl text-balance text-[44px] font-semibold leading-[1.05] sm:text-[68px]">
          {content.title || defaults.title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6e6e73]">
          {content.subtitle || defaults.intro}
        </p>
        {content.lastUpdated ? (
          <p className="mt-5 text-sm text-[#6e6e73]">
            {locale === "cn" ? "最后更新" : "Last updated"}:{" "}
            {content.lastUpdated}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-5 min-h-10 rounded-md border border-black/10 px-4 text-sm font-semibold hover:bg-[#f5f5f7]"
        >
          {locale === "cn" ? "打印 / 保存 PDF" : "Print / Save PDF"}
        </button>
        <PageContentActions content={content} locale={locale} />
      </header>
      <PageMedia
        media={content.media}
        className="mx-3 mb-3 h-[320px] rounded-[28px] sm:h-[500px]"
      />
      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-4xl gap-4">
          {sections.filter((section) => section.visible !== false).map((section) => (
            <article
              key={section.id}
              className="overflow-hidden rounded-[18px] bg-white"
            >
              <PageMedia media={section.media} className="h-64 w-full" />
              <div className="p-7">
                {section.eyebrow ? (
                  <p className="text-sm font-semibold text-[#0071e3]">
                    {section.eyebrow}
                  </p>
                ) : null}
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <p className="mt-3 text-base leading-7 text-[#6e6e73]">
                  {section.subtitle}
                </p>
                <PageContentActions
                  content={section}
                  locale={locale}
                  className="justify-start"
                />
              </div>
            </article>
          ))}
        </div>
      </section>
      <ResourceSection content={content} locale={locale} />
      <SiteFooter />
    </main>
  );
}

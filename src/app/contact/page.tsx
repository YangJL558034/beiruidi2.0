"use client";

import { useEffect, useState } from "react";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { SiteFooter } from "@/components/SiteFooter";
import { ContentSectionList } from "@/components/ContentSectionList";
import { SiteHeader } from "@/components/SiteHeader";
import { pageText, getLocaleFromPathname } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { EditableSection } from "@/components/EditableSection";
import { PageMedia } from "@/components/PageMedia";
import { PageContentActions } from "@/components/PageContentActions";
import { useSiteContent } from "@/hooks/useSiteContent";

type PublicSettings = { siteName: string; contactEmail: string; contactLocation: string; contactDescription: string };

export default function ContactPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = pageText[locale];
  const siteContent = useSiteContent(locale);
  const [settings, setSettings] = useState<PublicSettings>({
    siteName: t.contactSzaPower,
    contactEmail: t.salesEmail,
    contactLocation: t.locationText,
    contactDescription: t.contactDescription
  });

  useEffect(() => {
    let active = true;
    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (active && data) setSettings(data); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <section className="relative bg-white px-5 py-20 text-center sm:py-28">
        <EditableSection label={locale === "cn" ? "编辑联系页" : "Edit contact page"} />
        <p className="text-[21px] font-semibold">{siteContent.contact.eyebrow || t.contactEyebrow}</p>
        <h1 className="mx-auto mt-2 max-w-4xl text-balance text-[44px] font-semibold leading-[1.05] sm:text-[72px]">{siteContent.contact.title || t.contactTitle}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6e6e73]">{siteContent.contact.subtitle || t.contactSubtitle}</p>
        <PageContentActions content={siteContent.contact} locale={locale} />
      </section>
      <PageMedia media={siteContent.contact.media} className="mx-3 mb-3 h-[360px] rounded-[8px] sm:h-[500px]" />
      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-[8px] bg-white p-7">
            <h2 className="text-2xl font-semibold">{settings.siteName}</h2>
            <div className="mt-8 grid gap-6 text-sm leading-6 text-[#6e6e73]">
              <a className="flex gap-3 hover:text-[#0071e3]" href={`mailto:${settings.contactEmail}`}><Mail size={19} className="mt-0.5 shrink-0 text-[#1d1d1f]" />{settings.contactEmail}</a>
              <p className="flex gap-3"><MapPin size={19} className="mt-0.5 shrink-0 text-[#1d1d1f]" />{settings.contactLocation}</p>
              <p className="flex gap-3"><MessageSquare size={19} className="mt-0.5 shrink-0 text-[#1d1d1f]" />{settings.contactDescription}</p>
            </div>
          </aside>
          <div className="rounded-[8px] bg-white p-5 sm:p-7"><ContactForm /></div>
        </div>
      </section>
      <ContentSectionList sections={siteContent.contact.sections} locale={locale} />
      <SiteFooter />
    </main>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Headphones, Mail, MapPin, Phone, QrCode, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

type ContactSettings = {
  contactEmail: string;
  contactLocation: string;
  contactPhone: string;
  contactWidgetEnabled: boolean;
  contactWidgetTitleCn: string;
  contactWidgetTitleEn: string;
  contactWidgetSubtitleCn: string;
  contactWidgetSubtitleEn: string;
  contactWidgetButtonCn: string;
  contactWidgetButtonEn: string;
  contactQrCode: string;
  contactQrLabelCn: string;
  contactQrLabelEn: string;
};

const fallback: ContactSettings = {
  contactEmail: "sales@sza-power.com",
  contactLocation: "International mobile power brand",
  contactPhone: "",
  contactWidgetEnabled: true,
  contactWidgetTitleCn: "联系我们",
  contactWidgetTitleEn: "Contact us",
  contactWidgetSubtitleCn: "我们很乐意为您提供帮助",
  contactWidgetSubtitleEn: "We are happy to help",
  contactWidgetButtonCn: "联系我们",
  contactWidgetButtonEn: "Contact us",
  contactQrCode: "",
  contactQrLabelCn: "扫码联系我们",
  contactQrLabelEn: "Scan to contact us"
};

function Item({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = <><span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#edf2ff] to-[#ded8ff] text-[#596cf3] shadow-sm">{icon}</span><span className="min-w-0"><span className="block text-xs text-[#86868b]">{label}</span><span className="mt-0.5 block break-words text-sm font-medium text-[#1d1d1f]">{value}</span></span></>;
  const classes = "flex min-h-[72px] items-center gap-3 rounded-2xl border border-black/[0.05] bg-white/90 px-4 py-3 text-left shadow-[0_8px_30px_rgba(46,55,92,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(46,55,92,0.14)]";
  return href ? <a className={classes} href={href}>{content}</a> : <div className={classes}>{content}</div>;
}

export function FloatingContact() {
  const pathname = usePathname();
  const locale = useLocale();
  const [settings, setSettings] = useState<ContactSettings>(fallback);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data) setSettings({ ...fallback, ...data }); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  if (pathname.startsWith("/admin") || !settings.contactWidgetEnabled) return null;

  const cn = locale === "cn";
  const title = cn ? settings.contactWidgetTitleCn : settings.contactWidgetTitleEn;
  const subtitle = cn ? settings.contactWidgetSubtitleCn : settings.contactWidgetSubtitleEn;
  const button = cn ? settings.contactWidgetButtonCn : settings.contactWidgetButtonEn;
  const qrLabel = cn ? settings.contactQrLabelCn : settings.contactQrLabelEn;
  const phoneHref = settings.contactPhone ? `tel:${settings.contactPhone.replace(/[^+\d]/g, "")}` : undefined;

  return <>
    {open ? <button type="button" aria-label={cn ? "关闭联系窗口" : "Close contact window"} onClick={() => setOpen(false)} className="fixed inset-0 z-[81] bg-black/15 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none" /> : null}
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-[82] flex flex-col items-end sm:bottom-6 sm:right-6">
      {open ? <section role="dialog" aria-modal="true" aria-label={title} className="mb-3 max-h-[calc(100dvh-7rem)] w-[calc(100vw-1.5rem)] max-w-[350px] overflow-y-auto rounded-[26px] border border-white/70 bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(245,247,255,0.96))] p-5 shadow-[0_24px_80px_rgba(40,48,90,0.25)] backdrop-blur-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">{title}</h2><p className="mt-1 text-sm leading-6 text-[#6e6e73]">{subtitle}</p></div>
          <button type="button" onClick={() => setOpen(false)} className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#515154] shadow-sm transition hover:bg-[#f0f0f2]" aria-label={cn ? "关闭" : "Close"}><X size={18}/></button>
        </div>
        <div className="mt-5 grid gap-3">
          {settings.contactPhone ? <Item icon={<Phone size={19}/>} label={cn ? "电话" : "Phone"} value={settings.contactPhone} href={phoneHref}/> : null}
          {settings.contactEmail ? <Item icon={<Mail size={19}/>} label={cn ? "邮箱" : "Email"} value={settings.contactEmail} href={`mailto:${settings.contactEmail}`}/> : null}
          {settings.contactLocation ? <Item icon={<MapPin size={19}/>} label={cn ? "地址" : "Address"} value={settings.contactLocation}/> : null}
        </div>
        {settings.contactQrCode ? <div className="mt-4 rounded-2xl border border-black/[0.05] bg-white/90 p-4 text-center shadow-[0_8px_30px_rgba(46,55,92,0.08)]"><div className="relative mx-auto aspect-square w-36 overflow-hidden rounded-xl bg-white"><Image unoptimized src={settings.contactQrCode} alt={qrLabel} fill sizes="144px" className="object-contain"/></div><p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-[#3f3f43]"><QrCode size={16}/>{qrLabel}</p></div> : null}
      </section> : null}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={button} className="group flex min-h-14 items-center gap-2 rounded-full border border-white/80 bg-gradient-to-br from-[#4778ff] via-[#6666f5] to-[#8d68eb] px-4 text-white shadow-[0_12px_34px_rgba(83,91,234,0.42)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(83,91,234,0.52)] sm:min-h-16 sm:px-5"><span className="grid size-9 place-items-center rounded-full bg-white/18 ring-1 ring-white/35"><Headphones size={20}/></span><span className="pr-1 text-sm font-medium">{button}</span></button>
    </div>
  </>;
}

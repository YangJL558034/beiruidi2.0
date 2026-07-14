"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { commonText, getLocaleFromPathname, withLocale } from "@/lib/i18n";

const consentCookie = "sza_cookie_consent";

function setCookie(value: "accepted" | "necessary") {
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `${consentCookie}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function hasCookie() {
  return document.cookie.split(";").some((item) => item.trim().startsWith(`${consentCookie}=`));
}

export function CookieBanner() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = commonText[locale];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(!hasCookie());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (pathname.startsWith("/admin")) return null;
  if (!visible) return null;

  return (
    <section className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-5xl rounded-[8px] border border-black/10 bg-white/92 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.14)] backdrop-blur-2xl sm:flex sm:items-center sm:justify-between sm:gap-5">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">{t.cookieTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#5f6670]">
          {t.cookieBody}
          <Link href={withLocale("/privacy", locale)} className="ml-1 text-[#0071e3] hover:underline">
            {t.cookieLearnMore}
          </Link>
        </p>
      </div>
      <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
        <button
          type="button"
          onClick={() => {
            setCookie("necessary");
            setVisible(false);
          }}
          className="min-h-10 rounded-full border border-black/10 px-4 text-sm font-medium text-[#1d1d1f] hover:bg-black/[0.04]"
        >
          {t.cookieNecessary}
        </button>
        <button
          type="button"
          onClick={() => {
            setCookie("accepted");
            setVisible(false);
          }}
          className="min-h-10 rounded-full bg-[#0071e3] px-4 text-sm font-medium text-white hover:bg-[#0077ed]"
        >
          {t.cookieAccept}
        </button>
      </div>
    </section>
  );
}

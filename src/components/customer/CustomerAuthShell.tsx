"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import { withLocale } from "@/lib/i18n";

type AuthMode = "default" | "login" | "register";

export function CustomerAuthShell({
  title,
  subtitle,
  children,
  mode = "default",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  mode?: AuthMode;
}) {
  const locale = useLocale();
  const [visual, setVisual] = useState("");

  useEffect(() => {
    if (mode === "default") return;
    let active = true;
    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (!active || !settings) return;
        setVisual(
          String(
            mode === "login"
              ? settings.customerLoginImage || ""
              : settings.customerRegisterImage || "",
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [mode]);

  if (mode !== "default")
    return (
      <main className="flex min-h-screen flex-col bg-[#f7f8fb] text-[#1d1d1f]">
        <SiteHeader />
        <div className="border-y border-[#0071e3]/10 bg-[#eef7ff] px-5 py-3 text-center text-xs font-medium text-[#0066cc] sm:text-sm">
          {locale === "cn"
            ? "全球批发、OEM 与零售合作咨询已开放。"
            : "Global wholesale, OEM, and retail inquiries are now open."}
        </div>
        <section className="flex flex-1 items-center px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          <div className="mx-auto grid w-full max-w-[1060px] overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(45,64,105,0.09)] lg:grid-cols-2">
            <div className="relative flex min-h-[270px] flex-col overflow-hidden bg-[linear-gradient(145deg,#e9edff_0%,#dbe3ff_52%,#cbd6fb_100%)] sm:min-h-[360px] lg:min-h-[610px]">
              <div
                aria-hidden="true"
                className="absolute -left-20 top-24 size-72 rounded-full bg-white/35 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute -right-16 bottom-10 size-72 rounded-full bg-[#849cf0]/25 blur-3xl"
              />
              <div className="relative z-10 px-7 pb-2 pt-7 sm:px-12 sm:pt-12">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#315ab4]">
                  BarryT {locale === "cn" ? "客户中心" : "Customer center"}
                </p>
                <h1 className="mt-4 text-[30px] font-semibold tracking-[-0.035em] sm:text-[38px]">
                  {title}
                </h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-[#3f4655] sm:text-base">
                  {subtitle}
                </p>
              </div>
              <div className="relative z-[1] min-h-36 flex-1 sm:min-h-52">
                {visual ? (
                  <Image
                    unoptimized
                    src={visual}
                    alt={
                      mode === "login"
                        ? locale === "cn"
                          ? "客户登录页面展示图"
                          : "Customer login visual"
                        : locale === "cn"
                          ? "客户注册页面展示图"
                          : "Customer registration visual"
                    }
                    fill
                    priority
                    sizes="(min-width:1024px) 530px, 100vw"
                    className="object-contain object-bottom px-5 pt-3 sm:px-10"
                  />
                ) : (
                  <div className="absolute inset-x-8 bottom-8 top-5 rounded-[40px] border border-white/45 bg-[linear-gradient(145deg,rgba(255,255,255,0.7),rgba(99,123,210,0.16))] shadow-[0_28px_70px_rgba(54,78,150,0.18)] sm:inset-x-16">
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid size-20 place-items-center rounded-[26px] bg-[#1d3f8e] text-3xl font-semibold text-white shadow-xl">
                        B
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative z-10 h-10 border-t border-white/50 bg-white/20" />
            </div>
            <div className="flex items-center p-6 sm:p-10 lg:p-12">
              <div className="w-full">{children}</div>
            </div>
          </div>
        </section>
        <footer className="border-t border-black/[0.06] px-5 py-5 text-center text-xs text-[#9898a0]">
          © {new Date().getFullYear()} SZA-Barry-T.{" "}
          {locale === "cn" ? "保留所有权利。" : "All rights reserved."}
        </footer>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <section className="px-5 py-12 sm:py-20">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[30px] border border-black/[0.06] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)] lg:grid-cols-[0.8fr_1.2fr]">
          <div className="bg-[#0f1b32] p-8 text-white sm:p-12">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#2f6df6]">
              <ShieldCheck size={24} aria-hidden="true" />
            </span>
            <p className="mt-8 text-sm font-semibold text-blue-300">
              BarryT {locale === "cn" ? "客户中心" : "Customer center"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">
              {title}
            </h1>
            <p className="mt-5 leading-7 text-white/68">{subtitle}</p>
            <ul className="mt-8 grid gap-3 text-sm text-white/75">
              <li>
                ✓{" "}
                {locale === "cn"
                  ? "历史消息永久绑定本人账号"
                  : "Conversation history tied to your account"}
              </li>
              <li>
                ✓{" "}
                {locale === "cn"
                  ? "附件经过类型与恶意内容检测"
                  : "Validated and malware-scanned attachments"}
              </li>
              <li>
                ✓{" "}
                {locale === "cn"
                  ? "无需注册也可继续浏览和提交询盘"
                  : "Browsing and inquiries remain registration-free"}
              </li>
            </ul>
          </div>
          <div className="p-7 sm:p-12">{children}</div>
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[#6e6e73]">
          {locale === "cn"
            ? "登录表示你同意仅将客户中心用于合法的产品咨询。"
            : "By signing in, you agree to use the customer center for legitimate product inquiries."}{" "}
          <Link
            href={withLocale("/privacy", locale)}
            className="text-[#0071e3] hover:underline"
          >
            {locale === "cn" ? "隐私政策" : "Privacy policy"}
          </Link>
        </p>
      </section>
    </main>
  );
}

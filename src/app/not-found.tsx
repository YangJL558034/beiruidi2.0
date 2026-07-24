import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getRequestLocale } from "@/lib/i18n-server";
import { withLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: "Page not found | BarryT" },
  alternates: { canonical: null, languages: {} },
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const locale = await getRequestLocale();
  const chinese = locale === "cn";
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <section className="grid min-h-[70vh] place-items-center px-5 py-24 text-center">
        <div>
          <p className="text-sm font-semibold text-[#0071e3]">404</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-6xl">
            {chinese ? "没有找到这个页面" : "Page not found"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[#6e6e73]">
            {chinese
              ? "页面可能已移动、删除，或地址输入有误。"
              : "The page may have moved, been removed, or the address may be incorrect."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={withLocale("/", locale)}
              className="rounded-full bg-[#0071e3] px-6 py-3 font-medium text-white"
            >
              {chinese ? "返回首页" : "Back to home"}
            </Link>
            <Link
              href={withLocale("/products", locale)}
              className="rounded-full border border-[#0071e3] px-6 py-3 font-medium text-[#0071e3]"
            >
              {chinese ? "查看产品" : "View products"}
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

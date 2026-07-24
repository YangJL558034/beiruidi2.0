import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/navigation";

export function ConversionBand({
  locale,
  title,
  description,
}: {
  locale: Locale;
  title?: string;
  description?: string;
}) {
  return (
    <section className="px-5 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-7 rounded-[16px] bg-[#101828] px-6 py-10 text-white sm:px-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-[#8ec5ff]">
            {locale === "cn" ? "开始合作" : "Start a project"}
          </p>
          <h2 className="mt-2 max-w-3xl text-3xl font-semibold sm:text-4xl">
            {title ??
              (locale === "cn"
                ? "告诉我们产品、数量、定制和交付需求。"
                : "Tell us the product, quantity, customization, and delivery requirements.")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            {description ??
              (locale === "cn"
                ? "信息越完整，销售团队越能准确匹配产品并确认报价。"
                : "Complete requirements help the sales team match products and confirm an accurate quotation.")}
          </p>
        </div>
        <Link
          href={withLocale("/contact", locale)}
          className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#101828] transition hover:bg-[#e9f2ff]"
        >
          {locale === "cn" ? "提交询盘" : "Send an inquiry"}
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

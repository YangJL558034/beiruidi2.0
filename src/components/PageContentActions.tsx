import Link from "next/link";
import { withLocale } from "@/lib/i18n";

type ActionContent = { primaryLabel?: string; primaryHref?: string; secondaryLabel?: string; secondaryHref?: string };

export function PageContentActions({ content, locale, className = "" }: { content: ActionContent; locale: "cn" | "en"; className?: string }) {
  const primary = content.primaryLabel && content.primaryHref;
  const secondary = content.secondaryLabel && content.secondaryHref;
  if (!primary && !secondary) return null;
  return (
    <div className={`mt-6 flex flex-wrap justify-center gap-3 ${className}`}>
      {primary ? <Link href={withLocale(content.primaryHref!, locale)} className="inline-flex min-h-11 items-center rounded-full bg-[#0071e3] px-5 text-[16px] font-medium text-white hover:bg-[#0077ed]">{content.primaryLabel}</Link> : null}
      {secondary ? <Link href={withLocale(content.secondaryHref!, locale)} className="inline-flex min-h-11 items-center rounded-full border border-[#0071e3] px-5 text-[16px] font-medium text-[#0071e3] hover:bg-[#0071e3] hover:text-white">{content.secondaryLabel}</Link> : null}
    </div>
  );
}

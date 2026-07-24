import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/navigation";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  locale,
  className = "",
}: {
  items: BreadcrumbItem[];
  locale: Locale;
  className?: string;
}) {
  return (
    <nav
      aria-label={locale === "cn" ? "面包屑导航" : "Breadcrumb"}
      className={`px-5 ${className}`}
    >
      <ol className="mx-auto flex min-h-11 max-w-6xl items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-[#6e6e73]">
        <li>
          <Link href={withLocale("/", locale)} className="hover:text-[#0071e3]">
            {locale === "cn" ? "首页" : "Home"}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            <ChevronRight size={13} aria-hidden="true" />
            {item.href ? (
              <Link
                href={withLocale(item.href, locale)}
                className="hover:text-[#0071e3]"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-[#3f3f43]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

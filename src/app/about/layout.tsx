import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/i18n-server";
import { buildPageMetadata } from "@/lib/seo";
import { PageStructuredData } from "@/components/PageStructuredData";

export async function generateMetadata() {
  return buildPageMetadata(await getRequestLocale(), "about");
}

export default async function AboutLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  return <PageStructuredData locale={locale} page="about">{children}</PageStructuredData>;
}

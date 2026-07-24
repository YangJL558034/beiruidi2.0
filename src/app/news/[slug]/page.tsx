import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getPostBySlug, getPosts } from "@/lib/db";
import { getRequestLocale } from "@/lib/i18n-server";
import { withLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"
).replace(/\/+$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const post = getPostBySlug(slug, false, locale);
  if (!post)
    return {
      title: locale === "cn" ? "资讯未找到" : "Article not found",
      robots: { index: false, follow: false },
    };
  const canonical = `/${locale}/news/${post.slug}`;
  return {
    title: { absolute: `${post.title} | BarryT` },
    description: post.excerpt,
    alternates: {
      canonical,
      languages: {
        en: `/en/news/${post.slug}`,
        "zh-CN": `/cn/news/${post.slug}`,
        "x-default": `/en/news/${post.slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: canonical,
      locale: locale === "cn" ? "zh_CN" : "en_US",
      publishedTime: post.publishedAt,
      images: post.image ? [{ url: post.image, alt: post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const post = getPostBySlug(slug, false, locale);
  if (!post) notFound();
  const related = getPosts({ locale })
    .filter((item) => item.slug !== slug)
    .slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: post.image,
    inLanguage: locale === "cn" ? "zh-CN" : "en",
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: "SZA POWER",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "SZA POWER",
      url: siteUrl,
    },
    mainEntityOfPage: `${siteUrl}/${locale}/news/${post.slug}`,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "cn" ? "首页" : "Home",
        item: `${siteUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "cn" ? "洞察与博客" : "Insights and blog",
        item: `${siteUrl}/${locale}/news`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${siteUrl}/${locale}/news/${post.slug}`,
      },
    ],
  };
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[
          {
            label: locale === "cn" ? "洞察与博客" : "Insights and blog",
            href: "/news",
          },
          { label: post.title },
        ]}
        className="border-b border-black/[0.06] bg-white"
      />
      <article>
        <header className="bg-white px-5 pb-14 pt-24 sm:pb-20 sm:pt-32">
          <div className="mx-auto max-w-4xl">
            <Link
              href={withLocale("/news", locale)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0071e3]"
            >
              <ArrowLeft size={15} />
              {locale === "cn" ? "返回资讯" : "Back to news"}
            </Link>
            <p className="mt-10 text-sm font-semibold text-[#0071e3]">
              {post.category}
            </p>
            <h1 className="mt-3 text-[42px] font-semibold leading-[1.08] sm:text-[64px]">
              {post.title}
            </h1>
            <p className="mt-5 text-xl leading-8 text-[#6e6e73]">
              {post.excerpt}
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm text-[#6e6e73]">
              <CalendarDays size={16} />
              {new Date(post.publishedAt).toLocaleDateString(
                locale === "cn" ? "zh-CN" : "en-US",
              )}
            </p>
          </div>
        </header>
        <div className="relative mx-auto aspect-[16/8] max-w-6xl overflow-hidden bg-white">
          <Image
            unoptimized
            src={post.image}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <div className="whitespace-pre-wrap text-[17px] leading-8 text-[#3f3f43]">
            {post.content}
          </div>
        </div>
      </article>
      {related.length ? (
        <section className="border-t border-black/[0.08] bg-white px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-semibold">
              {locale === "cn" ? "更多资讯" : "More stories"}
            </h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={withLocale(`/news/${item.slug}`, locale)}
                  className="group rounded-md bg-[#f5f5f7] p-5"
                >
                  <p className="text-xs font-semibold text-[#0071e3]">
                    {item.category}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6e6e73]">
                    {item.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0071e3]">
                    {locale === "cn" ? "阅读全文" : "Read article"}
                    <ArrowRight size={15} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <SiteFooter />
    </main>
  );
}

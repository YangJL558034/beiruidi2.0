"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { ContentSectionList } from "@/components/ContentSectionList";
import { SiteHeader } from "@/components/SiteHeader";
import type { LocalizedPost as Post } from "@/lib/content-types";
import { pageText, commonText, getLocaleFromPathname, withLocale } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { EditableSection } from "@/components/EditableSection";
import { PageMedia } from "@/components/PageMedia";
import { PageContentActions } from "@/components/PageContentActions";
import { useSiteContent } from "@/hooks/useSiteContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function NewsPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = pageText[locale];
  const siteContent = useSiteContent(locale);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch(`/api/posts?locale=${locale}`);
      const data = await res.json();
      setPosts(data.posts);
      setLoading(false);
    }
    fetchPosts();
  }, [locale]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-xl">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <section className="relative bg-white px-5 py-20 text-center sm:py-28">
        <EditableSection label={locale === "cn" ? "\u7f16\u8f91\u8d44\u8baf\u9875" : "Edit news page"} />
        <p className="text-[21px] font-semibold">{siteContent.news.eyebrow || t.newsEyebrow}</p>
        <h1 className="mx-auto mt-2 max-w-4xl text-balance text-[44px] font-semibold leading-[1.05] sm:text-[72px]">
          {siteContent.news.title || t.newsTitle}
        </h1>
        {siteContent.news.subtitle ? <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6e6e73]">{siteContent.news.subtitle}</p> : null}
        <PageContentActions content={siteContent.news} locale={locale} />
      </section>
      <PageMedia media={siteContent.news.media} className="mx-3 mb-3 h-[360px] rounded-[8px] sm:h-[500px]" />
      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <Link key={post.id} href={withLocale(`/news/${post.slug}`, locale)} className="group overflow-hidden rounded-[8px] bg-white">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image unoptimized src={post.image} alt={post.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold text-[#0071e3]">{post.category}</p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight">{post.title}</h2>
                <p className="mt-3 text-base leading-7 text-[#6e6e73]">{post.excerpt}</p>
                <span className="mt-5 inline-flex items-center text-[#0071e3]">
                  {commonText[locale].readMore}
                  <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <ContentSectionList sections={siteContent.news.sections} locale={locale} />
      <SiteFooter />
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, SlidersHorizontal, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { PageMedia } from "@/components/PageMedia";
import { PageContentActions } from "@/components/PageContentActions";
import { SiteFooter } from "@/components/SiteFooter";
import { ContentSectionList } from "@/components/ContentSectionList";
import { SiteHeader } from "@/components/SiteHeader";
import type { LocalizedProduct as Product } from "@/lib/content-types";
import { commonText, getLocaleFromPathname, pageText, withLocale } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { useSiteContent } from "@/hooks/useSiteContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductFilter = "all" | "featured";
type ProductSort = "featured" | "name" | "price";

function priceValue(value: string) {
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function ProductShopCard({ product, locale }: { product: Product; locale: "cn" | "en" }) {
  const t = commonText[locale];
  const contactHref = withLocale("/contact", locale);
  const detailHref = withLocale(`/products/${product.slug}`, locale);
  const priceLabel = product.price || (locale === "cn" ? "\u8054\u7cfb\u54a8\u8be2" : "Contact us");

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] transition duration-500 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.1)]">
      <div className="flex min-w-0 items-start justify-between gap-4 px-6 pb-3 pt-7 sm:px-8 sm:pt-8">
        <div>
          {product.featured ? (
            <span className="inline-flex rounded-full bg-[#e8f3ff] px-3 py-1 text-xs font-semibold text-[#0071e3]">
              {locale === "cn" ? "\u7cbe\u9009\u7cfb\u5217" : "Featured"}
            </span>
          ) : null}
          <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#1d1d1f] sm:text-[32px]">{product.name}</h2>
          <p className="mt-2 max-w-[18rem] text-[16px] leading-6 text-[#6e6e73] sm:text-[17px]">{product.subtitle}</p>
        </div>
        <p className="shrink-0 whitespace-nowrap pt-1 text-right text-sm font-semibold text-[#1d1d1f]">{priceLabel}</p>
      </div>

      <div className="relative mx-4 aspect-[1.18] overflow-hidden rounded-[22px] bg-[#f5f5f7] sm:mx-5">
        <Image
          unoptimized
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 94vw"
          className="object-cover object-center transition duration-700 group-hover:scale-[1.04]"
        />
      </div>

      <div className="mt-auto flex flex-col gap-5 px-6 pb-7 pt-5 sm:px-8 sm:pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 grid gap-1 text-sm text-[#6e6e73]">
          <p>{product.color}</p>
          <p>{product.capacity}</p>
          <p>{product.input}{"\u00b7"}{product.output}</p>
        </div>
        <div className="flex w-full items-center gap-3 text-[15px] font-medium xl:w-auto xl:justify-end">
          <Link href={detailHref} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[#0071e3] hover:underline">
            {t.learnMoreBtn}
            <ChevronRight size={15} />
          </Link>
          <Link href={contactHref} className="inline-flex min-h-10 min-w-[88px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#0071e3] px-4 text-white transition hover:bg-[#0077ed]">
            {t.buyBtn}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const fallback = pageText[locale];
  const siteContent = useSiteContent(locale);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [sort, setSort] = useState<ProductSort>("featured");

  useEffect(() => {
    let mounted = true;
    fetch(`/api/products?locale=${locale}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data) => {
        if (mounted) setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [locale]);

  const visibleProducts = useMemo(() => {
    const next = products.filter((product) => filter === "all" || product.featured);
    return [...next].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, locale === "cn" ? "zh-CN" : "en");
      if (sort === "price") return priceValue(a.price) - priceValue(b.price);
      return Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder;
    });
  }, [filter, locale, products, sort]);

  const labels = locale === "cn" ? {
    eyebrow: "SZA POWER \u5546\u5e97",
    title: "\u9009\u8d2d\u4f60\u7684\u968f\u8eab\u7535\u529b\u3002",
    subtitle: "\u6bcf\u4e00\u79cd\u914d\u8272\uff0c\u90fd\u662f\u4e3a\u65e5\u5e38\u79fb\u52a8\u5145\u7535\u6253\u9020\u7684\u7cbe\u81f4\u9009\u62e9\u3002",
    allModels: "\u6240\u6709\u4ea7\u54c1",
    allModelsCopy: "\u6311\u9009\u9002\u5408\u4f60\u751f\u6d3b\u8282\u594f\u7684\u79fb\u52a8\u7535\u6e90\u3002",
    all: "\u5168\u90e8\u4ea7\u54c1",
    featured: "\u7cbe\u9009\u7cfb\u5217",
    sort: "\u6392\u5e8f\u65b9\u5f0f",
    sortFeatured: "\u63a8\u8350\u6392\u5e8f",
    sortName: "\u6309\u540d\u79f0",
    sortPrice: "\u6309\u4ef7\u683c",
    guides: "\u9009\u8d2d\u6307\u5357",
    guidesCopy: "\u4e0d\u77e5\u9053\u4ece\u54ea\u4e00\u6b3e\u5f00\u59cb\uff1f\u5148\u4ece\u4f7f\u7528\u573a\u666f\u548c\u989c\u8272\u504f\u597d\u51fa\u53d1\u3002",
    daily: "\u65e5\u5e38\u968f\u8eab",
    dailyCopy: "\u8f7b\u8584\u3001\u597d\u63e1\uff0c\u653e\u8fdb\u901a\u52e4\u5305\u5373\u53ef\u968f\u65f6\u8865\u7535\u3002",
    retail: "\u96f6\u552e\u9648\u5217",
    retailCopy: "\u7edf\u4e00\u8272\u5f69\u548c\u5c55\u793a\u8bed\u8a00\uff0c\u9002\u5408\u95e8\u5e97\u4e0e\u793c\u8d60\u573a\u666f\u3002",
    support: "\u9700\u8981\u5e2e\u52a9\uff1f",
    supportCopy: "\u6211\u4eec\u7684\u56e2\u961f\u53ef\u4ee5\u4e3a\u4ea7\u54c1\u9009\u62e9\u3001\u6279\u53d1\u548c OEM \u9879\u76ee\u63d0\u4f9b\u5efa\u8bae\u3002",
    contact: "\u8054\u7cfb\u9500\u552e",
    empty: "\u6682\u65f6\u6ca1\u6709\u7b26\u5408\u6761\u4ef6\u7684\u4ea7\u54c1\u3002",
    loading: "\u6b63\u5728\u52a0\u8f7d\u4ea7\u54c1..."
  } : {
    eyebrow: "SZA POWER Store",
    title: "Shop power for every carry.",
    subtitle: "A refined choice for everyday mobile charging, in every finish.",
    allModels: "All products",
    allModelsCopy: "Choose the compact power bank that fits your rhythm.",
    all: "All products",
    featured: "Featured",
    sort: "Sort by",
    sortFeatured: "Recommended",
    sortName: "Name",
    sortPrice: "Price",
    guides: "Shopping guides",
    guidesCopy: "Not sure where to start? Begin with how you carry and how you charge.",
    daily: "Everyday carry",
    dailyCopy: "Slim, tactile, and ready to top up your phone anywhere.",
    retail: "Retail-ready",
    retailCopy: "A consistent color system for stores, gifting, and distribution.",
    support: "Need help choosing?",
    supportCopy: "Our team can help with product selection, wholesale, and OEM projects.",
    contact: "Contact sales",
    empty: "No products match this filter yet.",
    loading: "Loading products..."
  };

  const section = (id: string) => siteContent.products.sections?.find((item) => item.id === id);
  const catalog = section("catalog");
  const guides = section("guides");
  const daily = section("daily");
  const retail = section("retail");
  const help = section("help");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />

      <section className="bg-[#f5f5f7] px-5 pb-14 pt-20 sm:pb-20 sm:pt-28">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6e6e73]">{siteContent.products.eyebrow || labels.eyebrow}</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-balance text-[48px] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[76px]">{siteContent.products.title || labels.title || fallback.productsTitle}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-[20px] leading-7 text-[#6e6e73] sm:text-[25px]">{siteContent.products.subtitle || labels.subtitle || fallback.productsSubtitle}</p>
          <PageContentActions content={siteContent.products} locale={locale} />
        </div>
      </section>

      <PageMedia media={siteContent.products.media} className="mx-3 mb-3 h-[300px] rounded-[28px] sm:h-[470px]" />

      <section id="all-products" className="border-y border-black/[0.08] bg-white px-5 py-7 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">{catalog?.eyebrow || labels.allModels}</p>
            <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">{catalog?.title || labels.allModelsCopy}</p>
          </div>
          {catalog?.subtitle ? <p className="max-w-xl text-sm leading-6 text-[#6e6e73]">{catalog.subtitle}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-[#f5f5f7] p-1">
              {(["all", "featured"] as ProductFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`min-h-9 rounded-full px-4 text-sm font-medium transition ${filter === item ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}
                >
                  {item === "all" ? labels.all : labels.featured}
                </button>
              ))}
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-full border border-black/[0.1] bg-white px-4 text-sm text-[#6e6e73]">
              <SlidersHorizontal size={15} />
              <span className="sr-only">{labels.sort}</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as ProductSort)} className="appearance-none bg-transparent pr-5 font-medium text-[#1d1d1f] outline-none">
                <option value="featured">{labels.sortFeatured}</option>
                <option value="name">{labels.sortName}</option>
                <option value="price">{labels.sortPrice}</option>
              </select>
              <ChevronDown size={14} className="-ml-5 pointer-events-none" />
            </label>
          </div>
        </div>
      </section>
      <PageMedia media={catalog?.media} className="mx-3 mt-3 h-[260px] rounded-[28px] sm:h-[420px]" />

      <section className="px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-[560px] animate-pulse rounded-[28px] bg-white" />)}
            </div>
          ) : visibleProducts.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => <ProductShopCard key={product.id} product={product} locale={locale} />)}
            </div>
          ) : (
            <div className="rounded-[28px] bg-white px-6 py-20 text-center text-[#6e6e73]">{labels.empty}</div>
          )}
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6e6e73]">{guides?.eyebrow || labels.guides}</p>
            <h2 className="mt-3 text-[38px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[56px]">{guides?.title || labels.guidesCopy}</h2>
            {guides?.subtitle ? <p className="mt-4 text-[17px] leading-7 text-[#6e6e73]">{guides.subtitle}</p> : null}
          </div>
          <PageMedia media={guides?.media} className="mt-10 h-[260px] rounded-[28px] sm:h-[420px]" />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <button type="button" onClick={() => { setFilter("all"); document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" }); }} className="group rounded-[28px] bg-[#f5f5f7] p-7 text-left transition hover:bg-[#ededf0] sm:p-9">
              <Sparkles size={24} strokeWidth={1.7} />
              <PageMedia media={daily?.media} className="mt-6 h-48 rounded-[20px]" />
              <h3 className="mt-16 text-[28px] font-semibold tracking-[-0.02em]">{daily?.title || labels.daily}</h3>
              <p className="mt-2 max-w-md text-[17px] leading-7 text-[#6e6e73]">{daily?.subtitle || labels.dailyCopy}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-[15px] font-medium text-[#0071e3]">{daily?.primaryLabel || labels.all}<ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </button>
            <Link href={withLocale(retail?.primaryHref || "/contact", locale)} className="group rounded-[28px] bg-[#1d1d1f] p-7 text-left text-white transition hover:bg-[#2c2c2e] sm:p-9">
              <Truck size={24} strokeWidth={1.7} />
              <PageMedia media={retail?.media} className="mt-6 h-48 rounded-[20px]" />
              <h3 className="mt-16 text-[28px] font-semibold tracking-[-0.02em]">{retail?.title || labels.retail}</h3>
              <p className="mt-2 max-w-md text-[17px] leading-7 text-white/70">{retail?.subtitle || labels.retailCopy}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-[15px] font-medium text-[#66b8ff]">{retail?.primaryLabel || labels.contact}<ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f7] px-5 py-20 text-center sm:py-24">
        <PageMedia media={help?.media} className="mx-auto mb-8 h-[240px] max-w-4xl rounded-[28px] sm:h-[420px]" />
        <ShieldCheck className="mx-auto" size={28} strokeWidth={1.6} />
        <h2 className="mt-5 text-[32px] font-semibold tracking-[-0.03em] sm:text-[44px]">{help?.title || labels.support}</h2>
        <p className="mx-auto mt-3 max-w-xl text-[17px] leading-7 text-[#6e6e73]">{help?.subtitle || labels.supportCopy}</p>
        <Link href={withLocale(help?.primaryHref || "/contact", locale)} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0071e3] px-5 text-[16px] font-medium text-white hover:bg-[#0077ed]">
          {labels.contact}
          <ArrowRight size={17} />
        </Link>
      </section>

      <ContentSectionList sections={siteContent.products.sections} locale={locale} excludeIds={["catalog","guides","daily","retail","help"]} />
      <SiteFooter />
    </main>
  );
}
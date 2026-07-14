"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BatteryCharging, ChevronRight, Globe2, ShieldCheck, SunMedium, Zap } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { ContentSectionList } from "@/components/ContentSectionList";
import { SiteHeader } from "@/components/SiteHeader";
import { commonText, getLocaleFromPathname, withLocale } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { EditableSection } from "@/components/EditableSection";
import { PageMedia } from "@/components/PageMedia";
import { useSiteContent } from "@/hooks/useSiteContent";
import type { LocalizedProduct } from "@/lib/content-types";

const productImages: Record<string, { src: string; alt: string; position?: string }> = {
  stackBlue: {
    src: "/products/web/power-stack-blue.webp",
    alt: "SZA POWER compact power banks in blue, orange, and dark finishes",
    position: "object-[54%_50%] sm:object-center"
  },
  stackPinkVertical: {
    src: "/products/web/power-stack-pink-vertical.webp",
    alt: "SZA POWER pastel compact power banks stacked on a display surface",
    position: "object-[54%_66%] sm:object-[50%_62%]"
  },
  stackOrange: {
    src: "/products/web/power-stack-orange.webp",
    alt: "SZA POWER orange compact power bank stacked above blue and dark units",
    position: "object-[54%_54%] sm:object-center"
  },
  stackPink: {
    src: "/products/web/power-stack-pink.webp",
    alt: "SZA POWER pink compact power bank with green and teal finishes behind it",
    position: "object-[55%_55%] sm:object-center"
  },
  bankOrange: {
    src: "/products/web/power-bank-orange.webp",
    alt: "SZA POWER orange compact power bank with USB-C port and indicator lights",
    position: "object-[56%_56%] sm:object-center"
  }
};

function PosterLink({ children, href, filled = false, onDark = false }: { children: ReactNode; href: string; filled?: boolean; onDark?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[17px] font-normal transition ${
        filled
          ? "bg-[#0071e3] text-white hover:bg-[#0077ed]"
          : onDark ? "border border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3] hover:text-white md:border-white md:text-white md:hover:bg-white md:hover:text-[#1d1d1f]" : "border border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3] hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function ProductArtwork({ variant }: { variant: string }) {
  const image = productImages[variant] ?? productImages.stackBlue;

  return (
    <div className="relative h-[300px] w-full overflow-hidden sm:h-[400px] md:absolute md:inset-x-0 md:bottom-0 md:h-[60%] md:min-h-[360px]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={variant === "stackBlue"}
        sizes="100vw"
        className={`object-cover ${image.position ?? "object-center"}`}
      />
    </div>
  );
}

function PromoVisual({ variant }: { variant: string }) {
  const image = productImages[variant] ?? productImages.stackBlue;

  return (
    <div className="relative h-[260px] overflow-hidden sm:h-[350px]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className={`object-cover ${image.position ?? "object-center"} transition duration-700 group-hover:scale-[1.03]`}
      />
    </div>
  );
}
function HeroPoster({
  poster,
  index,
  locale,
}: {
  poster: { eyebrow: string; title: string; subtitle: string; theme: string; primary: string; secondary: string; primaryHref: string; secondaryHref: string; visual: string; media?: { type: "image" | "video"; src: string; poster?: string; alt?: string } };
  index: number;
  locale: "cn" | "en";
}) {
  const isDark = poster.theme === "dark";
  const hasMedia = Boolean(poster.media?.src);

  return (
    <section
      className={`relative mb-5 overflow-hidden text-center md:mb-3 md:min-h-[760px] ${
        hasMedia ? "bg-white text-[#1d1d1f] md:bg-black md:text-white" : isDark ? "bg-[#1d1d1f] text-white" : "bg-white text-[#1d1d1f]"
      }`}
    >
      <EditableSection label={locale === "cn" ? "\u7f16\u8f91\u9996\u9875\u5185\u5bb9" : "Edit home content"} />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 pb-8 pt-12 sm:px-8 md:pb-0 md:pt-[96px]">
        {poster.eyebrow ? (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.04 }}
            className={`mb-1 text-[15px] font-semibold sm:text-[17px] ${isDark ? "text-white" : hasMedia ? "text-[#1d1d1f] md:text-white" : "text-[#1d1d1f]"}`}
          >
            {poster.eyebrow}
          </motion.p>
        ) : null}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.04 + index * 0.04 }}
          className="max-w-[22rem] text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:max-w-4xl sm:text-[50px]"
        >
          {poster.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1 + index * 0.04 }}
          className={`mt-3 max-w-[21rem] text-balance text-[16px] leading-[1.45] sm:max-w-3xl sm:text-[22px] sm:leading-[1.3] ${
            isDark ? "text-white/86" : hasMedia ? "text-[#1d1d1f] md:text-white/90" : "text-[#1d1d1f]"
          }`}
        >
          {poster.subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.16 + index * 0.04 }}
          className="mt-5 flex flex-wrap justify-center gap-3 sm:gap-4"
        >
          <PosterLink href={withLocale(poster.primaryHref, locale)} filled onDark={hasMedia}>{poster.primary}</PosterLink>
          <PosterLink href={withLocale(poster.secondaryHref, locale)} onDark={hasMedia}>{poster.secondary}</PosterLink>
        </motion.div>
      </div>
      {hasMedia ? <><div className="relative z-0 h-[340px] w-full sm:h-[440px] md:absolute md:inset-0 md:h-auto"><PageMedia media={poster.media} className="h-full w-full" /></div><div className="absolute inset-0 z-[1] hidden bg-gradient-to-b from-black/60 via-black/10 to-black/70 md:block" /></> : <ProductArtwork variant={poster.visual} />}
    </section>
  );
}

function PromoTile({
  tile,
  locale,
  t
}: {
  tile: { title: string; subtitle: string; icon: typeof Zap; theme: string; visual: string; primary?: string; secondary?: string; primaryHref?: string; secondaryHref?: string; media?: { type: "image" | "video"; src: string; poster?: string; alt?: string } };
  locale: "cn" | "en";
  t: Record<string, string>;
}) {
  const Icon = tile.icon;
  const dark = tile.theme === "dark";
  const background = dark ? "bg-[#1d1d1f] text-white" : "bg-white";
  const textColor = dark ? "text-white" : "text-[#1d1d1f]";
  const mutedColor = dark ? "text-white/80" : "text-[#1d1d1f]";
  const linkColor = dark ? "text-white" : "text-[#0071e3]";

  return (
    <article className={`group flex flex-col overflow-hidden ${background}`}>
      <div className="order-2 md:order-1">{tile.media?.src ? <PageMedia media={tile.media} className="h-[240px] sm:h-[350px]" /> : <PromoVisual variant={tile.visual} />}</div>
      <div className={`relative z-10 order-1 flex min-h-[200px] flex-col items-center justify-center px-5 py-8 text-center sm:min-h-[214px] sm:py-10 md:order-2 ${textColor}`}>
        <div className="mb-2 flex items-center gap-2 text-[18px] font-semibold sm:text-[19px]">
          <Icon size={23} strokeWidth={1.8} />
          {tile.title}
        </div>
        <p className={`max-w-md text-balance text-[16px] leading-[1.35] sm:text-[18px] ${mutedColor}`}>
          {tile.subtitle}
        </p>
        <div className="mt-4 flex justify-center gap-6 text-[17px]">
          <Link href={withLocale(tile.primaryHref || `/products/${tile.visual === "bankOrange" ? "orange-edition" : tile.visual === "stackPinkVertical" ? "pastel-stack" : "blue-titanium"}`, locale)} className={`inline-flex items-center ${linkColor} hover:underline`}>
            {tile.primary || t.learnMore}
            <ChevronRight size={16} />
          </Link>
          <Link href={withLocale(tile.secondaryHref || "/contact", locale)} className={`inline-flex items-center ${linkColor} hover:underline`}>
            {tile.secondary || t.buy}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export default function HomePage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = commonText[locale];
  const siteContent = useSiteContent(locale);
  const [homepageProducts, setHomepageProducts] = useState<LocalizedProduct[]>([]);

  useEffect(() => {
    let active = true;
    const loadProducts = () => {
      fetch(`/api/products?locale=${locale}`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : { products: [] })
        .then((data) => { if (active) setHomepageProducts(Array.isArray(data.products) ? data.products.slice(0, 6) : []); })
        .catch(() => undefined);
    };
    loadProducts();
    window.addEventListener("focus", loadProducts);
    return () => { active = false; window.removeEventListener("focus", loadProducts); };
  }, [locale]);
  const homeEyebrow = siteContent.home.eyebrow || "";
  const homeSubtitle = siteContent.home.subtitle || (locale === "cn" ? "\u53e3\u888b\u5c3a\u5bf8\uff0c\u968f\u8eab\u7535\u529b\uff0c\u7cbe\u6e5b\u5de5\u827a\u3002" : "Pocket-size power. Polished for every day.");
  const homeSection = (id:string) => siteContent.home.sections?.find((section) => section.id === id);

  const heroPosters = [
    {
      eyebrow: homeEyebrow,
      title: siteContent.home.title || "SZA POWER",
      subtitle: homeSubtitle,
      theme: "light",
      primary: siteContent.home.primaryLabel || t.learnMore,
      secondary: siteContent.home.secondaryLabel || t.viewAll,
      primaryHref: siteContent.home.primaryHref || "/products/blue-titanium",
      secondaryHref: siteContent.home.secondaryHref || "/products",
      visual: "stackBlue",
      media: siteContent.home.media
    },
    {
      eyebrow: homeSection("hero-color")?.eyebrow || t.colorSeriesEyebrow,
      title: homeSection("hero-color")?.title || t.colorSeriesTitle,
      subtitle: homeSection("hero-color")?.subtitle || t.colorSeriesSubtitle,
      theme: "soft",
      primary: homeSection("hero-color")?.primaryLabel || t.learnMore,
      secondary: homeSection("hero-color")?.secondaryLabel || t.buy,
      primaryHref: homeSection("hero-color")?.primaryHref || "/products/pastel-stack",
      secondaryHref: homeSection("hero-color")?.secondaryHref || "/contact",
      visual: "stackPink",
      media: homeSection("hero-color")?.media
    },
    {
      eyebrow: homeSection("hero-orange")?.eyebrow || t.orangeEditionEyebrow,
      title: homeSection("hero-orange")?.title || t.orangeEditionTitle,
      subtitle: homeSection("hero-orange")?.subtitle || t.orangeEditionSubtitle,
      theme: "soft",
      primary: homeSection("hero-orange")?.primaryLabel || t.learnMore,
      secondary: homeSection("hero-orange")?.secondaryLabel || t.contactSales,
      primaryHref: homeSection("hero-orange")?.primaryHref || "/products/orange-edition",
      secondaryHref: homeSection("hero-orange")?.secondaryHref || "/contact",
      visual: "bankOrange",
      media: homeSection("hero-orange")?.media
    }
  ];

  const promoTiles = [
    { id:"promo-blue", title:homeSection("promo-blue")?.title || t.blueTitanium, subtitle:homeSection("promo-blue")?.subtitle || t.blueTitaniumSubtitle, icon:Zap, theme:"light", visual:"stackBlue" },
    { id:"promo-pastel", title:homeSection("promo-pastel")?.title || t.pastelStack, subtitle:homeSection("promo-pastel")?.subtitle || t.pastelStackSubtitle, icon:BatteryCharging, theme:"light", visual:"stackPinkVertical" },
    { id:"promo-orange", title:homeSection("promo-orange")?.title || t.orange, subtitle:homeSection("promo-orange")?.subtitle || t.orangeSubtitle, icon:SunMedium, theme:"sun", visual:"stackOrange" },
    { id:"promo-rose", title:homeSection("promo-rose")?.title || t.rose, subtitle:homeSection("promo-rose")?.subtitle || t.roseSubtitle, icon:ShieldCheck, theme:"light", visual:"stackPink" },
    { id:"promo-usb", title:homeSection("promo-usb")?.title || t.usbCReady, subtitle:homeSection("promo-usb")?.subtitle || t.usbCReadySubtitle, icon:Globe2, theme:"blue", visual:"bankOrange" },
    { id:"promo-multi", title:homeSection("promo-multi")?.title || t.multiColor, subtitle:homeSection("promo-multi")?.subtitle || t.multiColorSubtitle, icon:BatteryCharging, theme:"light", visual:"stackBlue" }
  ].map((tile) => ({
    ...tile,
    media: homeSection(tile.id)?.media,
    primary: homeSection(tile.id)?.primaryLabel,
    primaryHref: homeSection(tile.id)?.primaryHref,
    secondary: homeSection(tile.id)?.secondaryLabel,
    secondaryHref: homeSection(tile.id)?.secondaryHref
  }));

  const productTiles = homepageProducts.length ? homepageProducts.slice(0, 6).map((product, index) => ({
    id: `product-${product.id}`,
    title: product.name,
    subtitle: product.subtitle,
    icon: [Zap, BatteryCharging, SunMedium, ShieldCheck, Globe2, BatteryCharging][index % 6],
    theme: "light",
    visual: "stackBlue",
    media: product.image ? { type: "image" as const, src: product.image, alt: product.name } : undefined,
    primary: t.learnMore,
    primaryHref: `/products/${product.slug}`,
    secondary: t.buy,
    secondaryHref: "/contact"
  })) : promoTiles.slice(0, 6);
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />

      {heroPosters.map((poster, index) => (
        <HeroPoster key={poster.title} poster={poster} index={index} locale={locale} />
      ))}

      <section className="grid gap-5 px-0 pb-5 sm:gap-3 sm:px-3 sm:pb-3 md:grid-cols-2">
        {productTiles.map((tile) => (
          <PromoTile key={tile.title} tile={tile} locale={locale} t={t} />
        ))}
      </section>

      <ContentSectionList sections={siteContent.home.sections} locale={locale} excludeIds={["hero-color","hero-orange","promo-blue","promo-pastel","promo-orange","promo-rose","promo-usb","promo-multi"]} />
      <SiteFooter />
    </main>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BatteryCharging, CheckCircle2, Cpu, Palette } from "lucide-react";
import { EditableSection } from "@/components/EditableSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { LocalizedProduct as Product } from "@/lib/content-types";
import { commonText, pageText, withLocale } from "@/lib/i18n";

export function ProductDetailClient({ product, related, locale }: { product: Product; related: Product[]; locale: "cn" | "en" }) {
  const t = commonText[locale];
  const reduceMotion = useReducedMotion();
  const images = product.images?.length ? product.images : [product.image];
  const [activeImage, setActiveImage] = useState(images[0] || product.image);
  const specs = [
    { label: pageText[locale].color, value: product.color, icon: Palette },
    { label: pageText[locale].capacity, value: product.capacity, icon: BatteryCharging },
    { label: pageText[locale].input, value: product.input, icon: Cpu },
    { label: pageText[locale].output, value: product.output, icon: CheckCircle2 }
  ];

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <section className="relative grid min-h-[720px] bg-white lg:grid-cols-2">
        <EditableSection label={locale === "cn" ? "编辑产品" : "Edit product"}/>
        <div className="flex flex-col justify-center px-5 py-16 text-center lg:px-14 lg:text-left">
          <p className="text-[21px] font-semibold">{pageText[locale].productsEyebrow}</p>
          <h1 className="mt-3 text-balance text-[48px] font-semibold leading-[1.04] sm:text-[72px]">{product.name}</h1>
          <p className="mt-5 max-w-2xl text-balance text-[22px] leading-[1.28] text-[#3f3f43] sm:text-[28px]">{product.subtitle}</p>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#6e6e73]">{product.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href={withLocale("/contact", locale)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0071e3] px-5 text-[17px] text-white transition hover:bg-[#0077ed] hover:shadow-lg">{t.contactSales}<ArrowRight size={17}/></Link>
            <Link href={withLocale("/products", locale)} className="inline-flex min-h-11 items-center rounded-full border border-[#0071e3] px-5 text-[17px] text-[#0071e3] transition hover:bg-[#0071e3] hover:text-white">{t.viewAll}</Link>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden bg-[#fbfbfd]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeImage}
              className="absolute inset-0"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.035, filter: "blur(7px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.985, filter: "blur(4px)" }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image unoptimized src={activeImage || product.image} alt={product.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[54%_55%]"/>
            </motion.div>
          </AnimatePresence>

          {images.length > 1 ? (
            <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto rounded-2xl bg-white/85 p-2 shadow-lg backdrop-blur">
              {images.map((src, index) => (
                <motion.button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(src)}
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.04 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                  className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${activeImage === src ? "border-[#0071e3] shadow-md" : "border-transparent hover:border-black/15"}`}
                  aria-label={`${locale === "cn" ? "查看产品图片" : "View product image"} ${index + 1}`}
                  aria-pressed={activeImage === src}
                >
                  <Image unoptimized src={src} alt={`${product.name} ${index + 1}`} fill sizes="64px" className="object-cover"/>
                </motion.button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {specs.map((spec) => {
            const Icon = spec.icon;
            return <div key={spec.label} className="rounded-[8px] bg-white p-6"><Icon size={24} strokeWidth={1.7}/><p className="mt-5 text-sm text-[#6e6e73]">{spec.label}</p><p className="mt-1 text-lg font-semibold">{spec.value}</p></div>;
          })}
        </div>
      </section>

      <section className="bg-white px-5 py-16 text-center sm:py-24">
        <h2 className="text-[36px] font-semibold leading-tight sm:text-[56px]">{pageText[locale].moreInSeries}</h2>
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
          {related.map((item) => (
            <Link key={item.id} href={withLocale(`/products/${item.slug}`, locale)} className="group rounded-[8px] bg-[#f5f5f7] p-4 text-left transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-white"><Image unoptimized src={item.image} alt={item.name} fill sizes="33vw" className="object-cover transition duration-500 group-hover:scale-105"/></div>
              <h3 className="mt-4 text-xl font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm leading-6 text-[#6e6e73]">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
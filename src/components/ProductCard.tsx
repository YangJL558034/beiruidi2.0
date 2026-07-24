"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LocalizedProduct } from "@/lib/content-types";
import { commonText } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { EditableSection } from "@/components/EditableSection";

export function ProductCard({
  product,
  compact = false,
}: {
  product: LocalizedProduct;
  compact?: boolean;
}) {
  const locale = useLocale();
  const t = commonText[locale];

  return (
    <article
      className={`relative overflow-hidden bg-white text-center ${compact ? "min-h-[500px]" : "min-h-[560px]"}`}
    >
      <EditableSection label={locale === "cn" ? "编辑产品" : "Edit product"} />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-5 pt-10 sm:pt-12">
        <h2 className="text-[28px] font-semibold leading-tight text-[#1d1d1f] sm:text-[36px]">
          {product.name}
        </h2>
        <p className="mt-2 max-w-md text-balance text-[19px] leading-[1.25] text-[#1d1d1f] sm:text-[21px]">
          {product.subtitle}
        </p>
        <div className="mt-4 flex justify-center gap-6 text-[17px]">
          <Link
            href={`/${locale}/products/${product.slug}`}
            className="inline-flex items-center text-[#0071e3] hover:underline"
          >
            {t.learnMoreBtn}
            <ChevronRight size={16} />
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center text-[#0071e3] hover:underline"
          >
            {t.buyBtn}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[58%] overflow-hidden sm:h-[62%]">
        {product.video ? (
          <video
            src={product.video}
            poster={product.image}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover object-[54%_55%] sm:object-center"
          />
        ) : (
          <Image
            unoptimized
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[54%_55%] sm:object-center"
          />
        )}
      </div>
    </article>
  );
}

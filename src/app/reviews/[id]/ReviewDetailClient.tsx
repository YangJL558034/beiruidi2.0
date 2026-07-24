"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Images,
  Quote,
  Star,
  UserRound,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import { useSiteContent } from "@/hooks/useSiteContent";
import { withLocale } from "@/lib/i18n";

export function ReviewDetailClient({ reviewId }: { reviewId: string }) {
  const locale = useLocale();
  const content = useSiteContent(locale);
  const reduceMotion = useReducedMotion();
  const [activeImage, setActiveImage] = useState(0);
  const [settled, setSettled] = useState(false);
  const review = (content.news.testimonials ?? []).find(
    (item) => item.id === reviewId && item.visible !== false,
  );
  const images = useMemo(
    () =>
      review?.images?.length
        ? review.images
        : review?.media?.type === "image"
          ? [review.media]
          : [],
    [review],
  );
  const preview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!review && !settled) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
        <SiteHeader />
        <div className="mx-auto min-h-[65vh] max-w-6xl animate-pulse px-5 py-20">
          <div className="h-5 w-28 rounded bg-black/10" />
          <div className="mt-8 h-16 max-w-2xl rounded bg-black/10" />
          <div className="mt-12 aspect-[16/9] rounded-[28px] bg-black/10" />
        </div>
      </main>
    );
  }

  if (!review) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
        <SiteHeader />
        <section className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-20 text-center">
          <div>
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#eef5ff] text-[#0071e3]">
              <Quote size={28} aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-3xl font-semibold">
              {locale === "cn" ? "没有找到这条评价" : "Review not found"}
            </h1>
            <p className="mt-3 leading-7 text-[#6e6e73]">
              {locale === "cn"
                ? "这条评价可能尚未发布、已隐藏或链接已失效。"
                : "This review may be unpublished, hidden, or no longer available."}
            </p>
            <Link
              href={withLocale(`/news${preview ? "?preview=1" : ""}`, locale)}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0071e3] px-5 font-semibold text-white"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              {locale === "cn" ? "返回用户评价" : "Back to reviews"}
            </Link>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const identity = [review.role, review.company, review.country]
    .filter(Boolean)
    .join(" · ");
  const selectedImage = images[Math.min(activeImage, images.length - 1)];
  const detailUrl = `/${locale}/reviews/${encodeURIComponent(review.id)}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    url: detailUrl,
    author: { "@type": "Person", name: review.name },
    itemReviewed: { "@type": "Organization", name: "BarryT" },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.quote,
    image: images.map((item) => item.src),
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[
          {
            label: locale === "cn" ? "用户评价" : "Customer reviews",
            href: withLocale(`/news${preview ? "?preview=1" : ""}`, locale),
          },
          { label: review.name },
        ]}
        className="border-b border-black/[0.06] bg-white"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="bg-white px-5 py-14 sm:py-20">
        <motion.div
          className="mx-auto max-w-5xl"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55 }}
        >
          <div className="flex items-center gap-4">
            <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eef5ff] text-[#0071e3] ring-1 ring-black/[0.05] sm:size-20">
              {review.avatar?.type === "image" && review.avatar.src ? (
                <Image
                  unoptimized
                  src={review.avatar.src}
                  alt={review.avatar.alt || review.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                  style={{ objectPosition: review.avatar.position || "50% 50%" }}
                />
              ) : (
                <UserRound size={30} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold sm:text-3xl">{review.name}</h1>
              {identity ? (
                <p className="mt-1 text-sm leading-6 text-[#6e6e73] sm:text-base">
                  {identity}
                </p>
              ) : null}
            </div>
          </div>

          <div
            className="mt-8 flex gap-1 text-[#ff9f0a]"
            aria-label={`${review.rating} ${locale === "cn" ? "星评价" : "star review"}`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                size={21}
                aria-hidden="true"
                className={index < review.rating ? "fill-current" : "text-black/10"}
              />
            ))}
          </div>
          <blockquote className="relative mt-6 max-w-4xl text-balance text-[30px] font-semibold leading-[1.35] tracking-[-0.025em] sm:text-[46px]">
            <Quote
              aria-hidden="true"
              className="absolute -left-2 -top-7 text-[#0071e3]/15 sm:-left-10"
              size={44}
            />
            “{review.quote}”
          </blockquote>
        </motion.div>
      </section>

      {selectedImage ? (
        <section className="px-5 py-12 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#0071e3]">
                  <Images size={17} aria-hidden="true" />
                  {locale === "cn" ? "产品评价图片" : "Product review photos"}
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {locale === "cn"
                    ? `共 ${images.length} 张真实图片`
                    : `${images.length} verified ${images.length === 1 ? "photo" : "photos"}`}
                </h2>
              </div>
              {images.length > 1 ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((current) =>
                        (current - 1 + images.length) % images.length,
                      )
                    }
                    className="grid size-11 place-items-center rounded-full border border-black/10 bg-white hover:bg-black/[0.03]"
                    aria-label={locale === "cn" ? "上一张图片" : "Previous photo"}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((current) => (current + 1) % images.length)
                    }
                    className="grid size-11 place-items-center rounded-full border border-black/10 bg-white hover:bg-black/[0.03]"
                    aria-label={locale === "cn" ? "下一张图片" : "Next photo"}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              ) : null}
            </div>
            <motion.div
              key={selectedImage.src}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-[#ececf0]"
            >
              <Image
                unoptimized
                src={selectedImage.src}
                alt={selectedImage.alt || `${review.name} 的产品评价图片`}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover"
                style={{ objectPosition: selectedImage.position || "50% 50%" }}
              />
            </motion.div>
            {images.length > 1 ? (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image.src}-${index}`}
                    onClick={() => setActiveImage(index)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-white ${
                      index === activeImage
                        ? "border-[#0071e3]"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`${locale === "cn" ? "查看第" : "View photo"} ${index + 1}`}
                  >
                    <Image
                      unoptimized
                      src={image.src}
                      alt=""
                      fill
                      sizes="180px"
                      className="object-cover"
                      style={{ objectPosition: image.position || "50% 50%" }}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="px-5 pb-20 pt-4">
        <div className="mx-auto max-w-6xl border-t border-black/10 pt-8">
          <Link
            href={withLocale(`/news${preview ? "?preview=1" : ""}`, locale)}
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#0071e3]"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            {locale === "cn" ? "返回全部用户评价" : "Back to all reviews"}
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

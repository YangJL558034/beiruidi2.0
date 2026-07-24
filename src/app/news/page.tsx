"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Images, Quote, Star, UserRound } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContentSectionList } from "@/components/ContentSectionList";
import { EditableSection } from "@/components/EditableSection";
import { PageNotice } from "@/components/PageBusinessBlocks";
import { PageContentActions } from "@/components/PageContentActions";
import { PageMedia } from "@/components/PageMedia";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import { useSiteContent } from "@/hooks/useSiteContent";
import type { Testimonial } from "@/lib/content-types";
import { withLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ReviewCard({
  review,
  index,
  locale,
  preview,
}: {
  review: Testimonial;
  index: number;
  locale: "cn" | "en";
  preview: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const identity = [review.role, review.company, review.country]
    .filter(Boolean)
    .join(" · ");
  const reviewImages =
    review.images?.length
      ? review.images
      : review.media?.type === "image"
        ? [review.media]
        : [];
  const cover = reviewImages[0];

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{
        duration: reduceMotion ? 0 : 0.5,
        delay: reduceMotion ? 0 : Math.min(index * 0.06, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
    >
      <Link
        href={withLocale(
          `/reviews/${encodeURIComponent(review.id)}${preview ? "?preview=1" : ""}`,
          locale,
        )}
        className="flex h-full min-h-[360px] flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0071e3]"
        aria-label={
          locale === "cn"
            ? `查看 ${review.name} 的完整评价`
            : `Read the full review from ${review.name}`
        }
      >
        {cover?.src ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-[#ececf0]">
            <Image
              unoptimized
              src={cover.src}
              alt={cover.alt || `${review.name} 的产品评价图片`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-[1.025]"
              style={{ objectPosition: cover.position || "50% 50%" }}
            />
            {reviewImages.length > 1 ? (
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Images size={14} aria-hidden="true" />
                {reviewImages.length}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-1 flex-col p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div
              className="flex gap-1 text-[#ff9f0a]"
              aria-label={`${review.rating} ${locale === "cn" ? "星评价" : "star review"}`}
            >
              {Array.from({ length: 5 }, (_, starIndex) => (
                <Star
                  key={starIndex}
                  size={18}
                  aria-hidden="true"
                  className={
                    starIndex < review.rating
                      ? "fill-current"
                      : "text-black/10"
                  }
                />
              ))}
            </div>
            <Quote
              size={30}
              aria-hidden="true"
              className="text-[#0071e3]/18 transition duration-300 group-hover:text-[#0071e3]/35"
            />
          </div>

          <blockquote className="mt-6 line-clamp-4 flex-1 text-[20px] font-medium leading-[1.55] tracking-[-0.01em] text-[#1d1d1f] sm:text-[22px]">
            “{review.quote}”
          </blockquote>

          <footer className="mt-7 flex items-center gap-4 border-t border-black/[0.06] pt-5">
            <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eef5ff] text-[#0071e3] ring-1 ring-black/[0.05]">
              {review.avatar?.type === "image" && review.avatar.src ? (
                <Image
                  unoptimized
                  src={review.avatar.src}
                  alt={review.avatar.alt || review.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                  style={{
                    objectPosition: review.avatar.position || "50% 50%",
                  }}
                />
              ) : (
                <UserRound size={24} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[#1d1d1f]">
                {review.name}
              </p>
              {identity ? (
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6e6e73]">
                  {identity}
                </p>
              ) : null}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#0071e3]">
              {locale === "cn" ? "查看评价" : "Read review"}
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition group-hover:translate-x-1"
              />
            </span>
          </footer>
        </div>
      </Link>
    </motion.article>
  );
}

export default function ReviewsPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const siteContent = useSiteContent(locale);
  const reduceMotion = useReducedMotion();
  const content = siteContent.news;
  const preview = searchParams.get("preview") === "1";
  const reviews = (content.testimonials ?? []).filter(
    (item) => item.visible !== false,
  );
  const averageRating = reviews.length
    ? (
        reviews.reduce((total, item) => total + item.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "";
  const reviewSchema = reviews.map((review) => ({
    "@type": "Review",
    itemReviewed: {
      "@type": "Organization",
      name: "BarryT",
    },
    author: {
      "@type": "Person",
      name: review.name,
      ...(review.company
        ? { affiliation: { "@type": "Organization", name: review.company } }
        : {}),
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.quote,
  }));

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[
          {
            label: locale === "cn" ? "用户评价" : "Customer reviews",
          },
        ]}
        className="border-b border-black/[0.06] bg-white"
      />
      <PageNotice content={content} />

      {reviewSchema.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": reviewSchema,
            }).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      <section className="relative overflow-hidden bg-white px-5 py-20 text-center sm:py-28">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-72 w-[54rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,113,227,0.12),transparent_68%)]"
        />
        <div className="relative mx-auto max-w-5xl">
          <EditableSection
            label={
              locale === "cn"
                ? "编辑用户评价页面"
                : "Edit customer reviews page"
            }
          />
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45 }}
            className="text-[18px] font-semibold text-[#0071e3] sm:text-[21px]"
          >
            {content.eyebrow ||
              (locale === "cn" ? "用户评价" : "Customer reviews")}
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.58,
              delay: reduceMotion ? 0 : 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto mt-3 max-w-4xl text-balance text-[42px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[72px]"
          >
            {content.title ||
              (locale === "cn"
                ? "来自客户与合作伙伴的真实评价。"
                : "Trusted by customers and partners.")}
          </motion.h1>
          {content.subtitle ? (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.52,
                delay: reduceMotion ? 0 : 0.12,
              }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6e6e73]"
            >
              {content.subtitle}
            </motion.p>
          ) : null}
          {reviews.length ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.4,
                delay: reduceMotion ? 0 : 0.18,
              }}
              className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full border border-black/[0.06] bg-[#f5f5f7] px-5 py-3"
            >
              <span className="flex gap-1 text-[#ff9f0a]">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={17}
                    aria-hidden="true"
                    className="fill-current"
                  />
                ))}
              </span>
              <span className="text-sm font-semibold">
                {averageRating} / 5 · {reviews.length}{" "}
                {locale === "cn" ? "条已发布评价" : "published reviews"}
              </span>
            </motion.div>
          ) : null}
          <PageContentActions content={content} locale={locale} />
        </div>
      </section>

      <PageMedia
        media={content.media}
        className="mx-3 mb-3 h-[360px] rounded-[28px] sm:h-[500px]"
      />

      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {reviews.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {reviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  index={index}
                  locale={locale}
                  preview={preview}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[28px] border border-dashed border-black/10 bg-white px-6 py-20 text-center"
            >
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#eef5ff] text-[#0071e3]">
                <Quote size={28} aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold">
                {locale === "cn"
                  ? "真实评价正在整理中"
                  : "Verified reviews are being prepared"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-[#6e6e73]">
                {content.labels?.empty ||
                  (locale === "cn"
                    ? "暂时还没有已发布的用户评价。"
                    : "No customer reviews have been published yet.")}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      <ContentSectionList sections={content.sections} locale={locale} />
      <SiteFooter />
    </main>
  );
}

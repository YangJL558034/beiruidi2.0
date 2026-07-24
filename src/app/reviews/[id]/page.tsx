import type { Metadata } from "next";
import { ReviewDetailClient } from "./ReviewDetailClient";
import { getSiteContent } from "@/lib/db";
import { getRequestLocale } from "@/lib/i18n-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findPublishedReview(locale: "cn" | "en", id: string) {
  return (getSiteContent(locale).news.testimonials ?? []).find(
    (item) => item.id === id && item.visible !== false,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getRequestLocale();
  const review = findPublishedReview(locale, decodeURIComponent(id));
  const title = review
    ? locale === "cn"
      ? `${review.name} 的用户评价`
      : `Customer review from ${review.name}`
    : locale === "cn"
      ? "用户评价"
      : "Customer review";
  const description = review?.quote || (locale === "cn"
    ? "查看来自 BarryT 客户与合作伙伴的真实评价。"
    : "Read verified feedback from BarryT customers and partners.");
  const canonical = `/${locale}/reviews/${encodeURIComponent(id)}`;
  const images =
    review?.images?.filter((item) => item.type === "image").map((item) => item.src) ??
    [];

  return {
    title: { absolute: `${title} | BarryT` },
    description,
    robots: review ? undefined : { index: false, follow: true },
    alternates: {
      canonical,
      languages: {
        en: `/en/reviews/${encodeURIComponent(id)}`,
        "zh-CN": `/cn/reviews/${encodeURIComponent(id)}`,
        "x-default": `/en/reviews/${encodeURIComponent(id)}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      locale: locale === "cn" ? "zh_CN" : "en_US",
      images: images.length ? images.map((url) => ({ url })) : undefined,
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images: images.length ? images : undefined,
    },
  };
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReviewDetailClient reviewId={decodeURIComponent(id)} />;
}

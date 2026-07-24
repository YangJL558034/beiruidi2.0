import type { MetadataRoute } from "next";
import fs from "node:fs";
import { getDatabasePath, getPosts, getProducts } from "@/lib/db";

export const runtime = "nodejs";
const base = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"
).replace(/\/+$/, "");
const pages = [
  "products",
  "shop",
  "news",
  "services",
  "cases",
  "faq",
  "about",
  "support",
  "contact",
  "privacy",
  "terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const contentUpdatedAt = fs.statSync(getDatabasePath()).mtime;
  for (const locale of ["en", "cn"] as const) {
    entries.push({
      url: `${base}/${locale}`,
      lastModified: contentUpdatedAt,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${base}/en`,
          "zh-CN": `${base}/cn`,
          "x-default": `${base}/en`,
        },
      },
    });
    for (const page of pages)
      entries.push({
        url: `${base}/${locale}/${page}`,
        lastModified: contentUpdatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            en: `${base}/en/${page}`,
            "zh-CN": `${base}/cn/${page}`,
            "x-default": `${base}/en/${page}`,
          },
        },
      });
    for (const product of getProducts({ locale }))
      entries.push({
        url: `${base}/${locale}/products/${product.slug}`,
        lastModified: product.updatedAt
          ? new Date(product.updatedAt)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: {
            en: `${base}/en/products/${product.slug}`,
            "zh-CN": `${base}/cn/products/${product.slug}`,
            "x-default": `${base}/en/products/${product.slug}`,
          },
        },
      });
    for (const post of getPosts({ locale }))
      entries.push({
        url: `${base}/${locale}/news/${post.slug}`,
        lastModified: post.updatedAt
          ? new Date(post.updatedAt)
          : new Date(post.publishedAt),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: {
            en: `${base}/en/news/${post.slug}`,
            "zh-CN": `${base}/cn/news/${post.slug}`,
            "x-default": `${base}/en/news/${post.slug}`,
          },
        },
      });
  }
  return entries;
}

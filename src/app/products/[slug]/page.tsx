import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./ProductDetailClient";
import { getProductBySlug, getProducts } from "@/lib/db";
import { getRequestLocale } from "@/lib/i18n-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"
).replace(/\/+$/, "");

function jsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function numericPrice(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  return /^\d+(?:\.\d{1,2})?$/.test(normalized) ? normalized : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const product = getProductBySlug(slug, false, locale);
  if (!product)
    return {
      title: locale === "cn" ? "产品未找到" : "Product not found",
      robots: { index: false, follow: false },
    };
  const title = product.name;
  const description = product.description || product.subtitle;
  const canonical = `/${locale}/products/${product.slug}`;
  return {
    title: { absolute: `${title} | BarryT` },
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/products/${product.slug}`,
        "zh-CN": `/cn/products/${product.slug}`,
        "x-default": `/en/products/${product.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      locale: locale === "cn" ? "zh_CN" : "en_US",
      images: product.image
        ? [{ url: product.image, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const product = getProductBySlug(slug, false, locale);
  if (!product) notFound();
  const related = getProducts({ locale })
    .filter((item) => item.slug !== slug)
    .slice(0, 3);
  const price = numericPrice(product.price);
  const availability =
    product.inventoryStatus === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : product.inventoryStatus === "preorder"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku || undefined,
    category: "USB-C mobile power bank",
    brand: { "@type": "Brand", name: "SZA POWER" },
    url: `${siteUrl}/${locale}/products/${product.slug}`,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: locale === "cn" ? "颜色" : "Color",
        value: product.color,
      },
      {
        "@type": "PropertyValue",
        name: locale === "cn" ? "容量" : "Capacity",
        value: product.capacity,
      },
      {
        "@type": "PropertyValue",
        name: locale === "cn" ? "输入" : "Input",
        value: product.input,
      },
      {
        "@type": "PropertyValue",
        name: locale === "cn" ? "输出" : "Output",
        value: product.output,
      },
    ].filter((item) => item.value),
    offers: price
      ? {
          "@type": "Offer",
          priceCurrency: "USD",
          price,
          availability,
          url: `${siteUrl}/${locale}/products/${product.slug}`,
        }
      : undefined,
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
        name: locale === "cn" ? "产品" : "Products",
        item: `${siteUrl}/${locale}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteUrl}/${locale}/products/${product.slug}`,
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <ProductDetailClient
        product={product}
        related={related}
        locale={locale}
      />
    </>
  );
}

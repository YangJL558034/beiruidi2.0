import { NextRequest, NextResponse } from "next/server";
import { getProducts, getProductBySlug } from "@/lib/db";
import type { Locale } from "@/lib/navigation";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const locale = (request.nextUrl.searchParams.get("locale") || "en") as Locale;

  if (slug) {
    const product = getProductBySlug(slug, false, locale);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  }

  return NextResponse.json({ products: getProducts({ locale }) });
}

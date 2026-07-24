import { NextRequest, NextResponse } from "next/server";
import { getProducts, getProductBySlug } from "@/lib/db";
import { parseLocale } from "@/lib/navigation";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.slice(0, 160);
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const shopOnly = request.nextUrl.searchParams.get("shop") === "true";

  if (slug) {
    const product = getProductBySlug(slug, false, locale);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(
      { product },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { products: getProducts({ locale, shopOnly }) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

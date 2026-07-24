import { NextRequest, NextResponse } from "next/server";
import { getProducts, getPosts } from "@/lib/db";
import { parseLocale } from "@/lib/navigation";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 120);
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));

  if (!query) {
    return NextResponse.json(
      { products: [], posts: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const products = getProducts({ locale });
  const posts = getPosts({ locale });

  const searchQuery = query.toLowerCase();

  const matchedProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery) ||
        product.subtitle.toLowerCase().includes(searchQuery) ||
        product.description.toLowerCase().includes(searchQuery) ||
        product.color.toLowerCase().includes(searchQuery) ||
        product.capacity.toLowerCase().includes(searchQuery),
    )
    .slice(0, 8);

  const matchedPosts = posts
    .filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery) ||
        post.excerpt.toLowerCase().includes(searchQuery) ||
        post.content.toLowerCase().includes(searchQuery) ||
        post.category.toLowerCase().includes(searchQuery),
    )
    .slice(0, 8);

  return NextResponse.json(
    { products: matchedProducts, posts: matchedPosts },
    { headers: { "Cache-Control": "no-store" } },
  );
}

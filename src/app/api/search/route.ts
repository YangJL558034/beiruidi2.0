import { NextRequest, NextResponse } from "next/server";
import { getProducts, getPosts } from "@/lib/db";
import type { Locale } from "@/lib/navigation";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const locale = (request.nextUrl.searchParams.get("locale") || "en") as Locale;

  if (!query.trim()) {
    return NextResponse.json({ products: [], posts: [] });
  }

  const products = getProducts({ locale });
  const posts = getPosts({ locale });

  const searchQuery = query.toLowerCase();

  const matchedProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery) ||
      product.subtitle.toLowerCase().includes(searchQuery) ||
      product.description.toLowerCase().includes(searchQuery) ||
      product.color.toLowerCase().includes(searchQuery) ||
      product.capacity.toLowerCase().includes(searchQuery)
  );

  const matchedPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery) ||
      post.excerpt.toLowerCase().includes(searchQuery) ||
      post.content.toLowerCase().includes(searchQuery) ||
      post.category.toLowerCase().includes(searchQuery)
  );

  return NextResponse.json({ products: matchedProducts, posts: matchedPosts });
}

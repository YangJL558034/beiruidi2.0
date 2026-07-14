import { NextRequest, NextResponse } from "next/server";
import { getPosts, getPostBySlug } from "@/lib/db";
import type { Locale } from "@/lib/navigation";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const locale = (request.nextUrl.searchParams.get("locale") || "en") as Locale;

  if (slug) {
    const post = getPostBySlug(slug, false, locale);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  return NextResponse.json({ posts: getPosts({ locale }) });
}

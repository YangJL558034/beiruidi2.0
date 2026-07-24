import { NextRequest, NextResponse } from "next/server";
import { getPosts, getPostBySlug } from "@/lib/db";
import { parseLocale } from "@/lib/navigation";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.slice(0, 160);
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));

  if (slug) {
    const post = getPostBySlug(slug, false, locale);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(
      { post },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { posts: getPosts({ locale }) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

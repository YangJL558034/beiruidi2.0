import { NextRequest, NextResponse } from "next/server";
import { deletePost, getAdminPosts, savePost } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ posts: getAdminPosts() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const post = savePost(body);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save post." }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Post id is required." }, { status: 400 });
    const post = savePost(body);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update post." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Post id is required." }, { status: 400 });
  deletePost(id);
  return NextResponse.json({ ok: true });
}

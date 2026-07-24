import { NextRequest, NextResponse } from "next/server";
import {
  getContentWorkspace,
  publishSiteContent,
  restoreSiteContentVersion,
  saveSiteContentDraft,
} from "@/lib/db";
import {
  adminSessionCookie,
  readAdminSession,
} from "@/lib/auth-session";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const locale =
    request.nextUrl.searchParams.get("locale") === "cn" ? "cn" : "en";
  const workspace = getContentWorkspace(locale);
  return NextResponse.json({ ...workspace, content: workspace.published });
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const locale = body.locale === "cn" ? "cn" : "en";
    return NextResponse.json(
      saveSiteContentDraft(locale, body.content),
    );
  } catch {
    return NextResponse.json(
      { error: "草稿内容格式不正确。" },
      { status: 400 },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locale = body.locale === "cn" ? "cn" : "en";
    const session = await readAdminSession(
      request.cookies.get(adminSessionCookie)?.value,
    );
    return NextResponse.json(
      publishSiteContent(locale, body.content, session?.email),
    );
  } catch {
    return NextResponse.json(
      { error: "页面发布失败，请检查必填内容。" },
      { status: 400 },
    );
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const locale = body.locale === "cn" ? "cn" : "en";
    return NextResponse.json(
      restoreSiteContentVersion(locale, String(body.versionId ?? "")),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "版本恢复失败。" },
      { status: 400 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getContentWorkspace, getSiteContent } from "@/lib/db";
import {
  adminSessionCookie,
  readAdminSession,
} from "@/lib/auth-session";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const locale =
    request.nextUrl.searchParams.get("locale") === "cn" ? "cn" : "en";
  const wantsPreview = request.nextUrl.searchParams.get("preview") === "1";
  if (wantsPreview) {
    const session = await readAdminSession(
      request.cookies.get(adminSessionCookie)?.value,
    );
    if (session)
      return NextResponse.json({
        content: getContentWorkspace(locale).draft,
        preview: true,
      });
  }
  return NextResponse.json({ content: getSiteContent(locale) });
}

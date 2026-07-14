import { NextRequest, NextResponse } from "next/server";
import { getNavigationConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const locale =
    request.nextUrl.searchParams.get("locale") ||
    request.headers.get("x-sza-locale") ||
    request.cookies.get("sza_locale")?.value;

  return NextResponse.json({ navigation: getNavigationConfig(locale), locale: locale === "cn" ? "cn" : "en" }, { headers: { "Cache-Control": "no-store" } });
}

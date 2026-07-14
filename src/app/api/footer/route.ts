import { NextRequest, NextResponse } from "next/server";
import { getFooterContent } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { const locale=request.nextUrl.searchParams.get("locale")==="cn"?"cn":"en"; return NextResponse.json({content:getFooterContent(locale)}, { headers: { "Cache-Control": "no-store" } }); }

import { NextRequest, NextResponse } from "next/server";
import { getSiteContent } from "@/lib/db";

export const runtime = "nodejs";
export async function GET(request: NextRequest) { const locale=request.nextUrl.searchParams.get("locale")==="cn"?"cn":"en"; return NextResponse.json({content:getSiteContent(locale)}); }

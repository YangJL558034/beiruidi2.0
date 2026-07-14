import { NextRequest, NextResponse } from "next/server";
import { getSiteContent, saveSiteContent } from "@/lib/db";

export const runtime = "nodejs";
export async function GET(request: NextRequest) { const locale=request.nextUrl.searchParams.get("locale")==="cn"?"cn":"en"; return NextResponse.json({ content:getSiteContent(locale) }); }
export async function PUT(request: NextRequest) { try { const body=await request.json(); const locale=body.locale==="cn"?"cn":"en"; return NextResponse.json({ content:saveSiteContent(locale,body.content) }); } catch { return NextResponse.json({ error:"页面内容格式不正确。" },{status:400}); } }

import { NextRequest, NextResponse } from "next/server";
import { getFooterContent, saveFooterContent } from "@/lib/db";

export const runtime = "nodejs";
export async function GET(request: NextRequest) { const locale=request.nextUrl.searchParams.get("locale")==="cn"?"cn":"en"; return NextResponse.json({ content:getFooterContent(locale) }); }
export async function PUT(request: NextRequest) { try { const body=await request.json(); const locale=body.locale==="cn"?"cn":"en"; return NextResponse.json({ content:saveFooterContent(locale,body.content) }); } catch { return NextResponse.json({ error:"页脚内容格式不正确。" },{status:400}); } }

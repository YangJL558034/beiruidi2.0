import { NextRequest, NextResponse } from "next/server";
import { getSystemSettings, saveSystemSettings } from "@/lib/db";

export const runtime = "nodejs";
export async function GET() { return NextResponse.json({ settings:getSystemSettings() }); }
export async function PUT(request: NextRequest) { try { const body=await request.json(); return NextResponse.json({ settings:saveSystemSettings(body) }); } catch { return NextResponse.json({ error:"系统设置格式不正确。" },{status:400}); } }

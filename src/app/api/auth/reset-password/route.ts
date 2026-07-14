import { NextRequest, NextResponse } from "next/server";
import { resetAdminPassword } from "@/lib/db";

export const runtime = "nodejs";
export async function POST(request: NextRequest) { const body=await request.json().catch(()=>null); const ok=resetAdminPassword(String(body?.token??""),String(body?.password??"")); return ok?NextResponse.json({ok:true}):NextResponse.json({error:"链接无效、已过期，或新密码少于 10 位。"},{status:400}); }

import { NextRequest, NextResponse } from "next/server";
import { adminExists, createPasswordReset, getSystemSettings } from "@/lib/db";
import { sendConfiguredMail } from "@/lib/mail";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const body=await request.json().catch(()=>null); const email=String(body?.email??"").trim().toLowerCase();
  if(!email) return NextResponse.json({error:"请输入邮箱地址。"},{status:400});
  if(adminExists(email)) { const settings=getSystemSettings() as Record<string,unknown>; const token=createPasswordReset(email,Number(settings.passwordResetHours??2)); const origin=request.nextUrl.origin; await sendConfiguredMail({to:email,subject:"SZA POWER 后台密码重置",text:`请在有效期内打开此链接重置密码：${origin}/admin/reset-password?token=${token}`,html:`<p>请在有效期内点击链接重置密码：</p><p><a href="${origin}/admin/reset-password?token=${token}">重置后台密码</a></p>`}).catch(()=>undefined); }
  return NextResponse.json({ok:true});
}

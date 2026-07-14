import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, createInquiry, getSystemSettings, recordSecurityEvent } from "@/lib/db";
import { sendConfiguredMail } from "@/lib/mail";
import { cleanText, getRequestIp, validEmail } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip=getRequestIp(request);
  const rate=consumeRateLimit(`inquiry:${ip}`,10,60*60_000);
  if(!rate.allowed){
    recordSecurityEvent({type:"inquiry_rate_limited",severity:"warning",ip,detail:"Public inquiry submission limit exceeded."});
    return NextResponse.json({error:"提交过于频繁，请稍后再试。"},{status:429,headers:{"Retry-After":String(rate.retryAfterSeconds)}});
  }
  try {
    const body=await request.json();
    if(cleanText(body.website,200)) return NextResponse.json({ok:true},{status:201});
    const name=cleanText(body.name,120);
    const email=cleanText(body.email,254).toLowerCase();
    const message=cleanText(body.message,5000);
    const company=cleanText(body.company,200);
    const country=cleanText(body.country,120);
    const projectType=cleanText(body.projectType||"General inquiry",120);
    if(!name||!validEmail(email)||!message) return NextResponse.json({error:"请填写有效的姓名、邮箱和需求说明。"},{status:400});

    const inquiry=createInquiry({name,email,company,country,projectType,message});
    const settings=getSystemSettings() as Record<string,unknown>;
    const recipient=cleanText(settings.notificationEmail||settings.contactEmail,254);
    if(recipient&&validEmail(recipient)){
      const text=[`Name: ${name}`,`Email: ${email}`,`Company: ${company}`,`Country: ${country}`,`Project: ${projectType}`,"",message].join("\n");
      await sendConfiguredMail({to:recipient,subject:`[SZA POWER] New inquiry from ${name}`,text}).catch((error)=>recordSecurityEvent({type:"inquiry_email_failed",severity:"warning",ip,actor:email,detail:error instanceof Error?error.message:"Mail delivery failed"}));
    }
    return NextResponse.json({inquiry},{status:201});
  } catch {
    return NextResponse.json({error:"请求格式不正确。"},{status:400});
  }
}
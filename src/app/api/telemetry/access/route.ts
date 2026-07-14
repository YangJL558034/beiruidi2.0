import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, getSystemSettings, recordAccessLog, recordSecurityEvent } from "@/lib/db";
import { ensureAutomaticBackup } from "@/lib/backups";
import { cleanText, getRequestIp } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip=getRequestIp(request);
  const limit=consumeRateLimit(`access:${ip}`,120,60*60_000);
  if(!limit.allowed) return new NextResponse(null,{status:204});
  const body=await request.json().catch(()=>null);
  const path=cleanText(body?.path,500);
  if(!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null,{status:204});
  recordAccessLog({ip,path,method:"PAGE",userAgent:request.headers.get("user-agent")??"",referer:request.headers.get("referer")??""});
  const settings=getSystemSettings() as Record<string,unknown>;
  try{ensureAutomaticBackup(settings.automaticBackupEnabled!==false,Number(settings.automaticBackupHours??24));}catch(error){recordSecurityEvent({type:"automatic_backup_failed",severity:"critical",ip,detail:error instanceof Error?error.message:"Automatic backup failed"});}
  return new NextResponse(null,{status:204});
}
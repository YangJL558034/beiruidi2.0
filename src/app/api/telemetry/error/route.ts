import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, recordSecurityEvent } from "@/lib/db";
import { cleanText, getRequestIp } from "@/lib/request-security";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  const ip=getRequestIp(request);
  if(!consumeRateLimit(`error:${ip}`,20,10*60_000).allowed)return new NextResponse(null,{status:204});
  const body=await request.json().catch(()=>null);
  const message=cleanText(body?.message,1000);
  if(!message)return new NextResponse(null,{status:204});
  recordSecurityEvent({type:"runtime_error",severity:"critical",ip,actor:cleanText(body?.path,300),detail:`${message}\n${cleanText(body?.stack,3000)}\n${cleanText(body?.componentStack,1500)}`});
  return new NextResponse(null,{status:204});
}
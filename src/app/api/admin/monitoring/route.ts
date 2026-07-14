import { NextRequest, NextResponse } from "next/server";
import { getAccessLogs, getSecurityEvents } from "@/lib/db";

export const runtime="nodejs";
export async function GET(request:NextRequest){
  const limit=Math.max(20,Math.min(300,Number(request.nextUrl.searchParams.get("limit")??100)));
  return NextResponse.json({accessLogs:getAccessLogs(limit),securityEvents:getSecurityEvents(limit)},{headers:{"Cache-Control":"no-store"}});
}
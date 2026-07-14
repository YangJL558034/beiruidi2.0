import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createCaptchaRecord } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const answer=Array.from(crypto.randomBytes(5),(value)=>alphabet[value%alphabet.length]).join("");
  const id=createCaptchaRecord(answer);
  const lines=Array.from(crypto.randomBytes(4),(value,index)=>`<line x1="${index*34}" y1="${8+value%34}" x2="${160-index*19}" y2="${10+(value*3)%36}" stroke="#93a4bd" stroke-width="1"/>`).join("");
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="52" viewBox="0 0 160 52"><rect width="160" height="52" rx="8" fill="#f1f5f9"/>${lines}<text x="80" y="35" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" font-weight="700" letter-spacing="7" fill="#172033">${answer}</text></svg>`;
  const image=`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return NextResponse.json({id,image},{headers:{"Cache-Control":"no-store, private"}});
}
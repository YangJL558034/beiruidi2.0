import { NextRequest, NextResponse } from "next/server";
import { adminCsrfCookie, adminSessionCookie } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const secureCookies=request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set(adminSessionCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
    maxAge: 0
  });
  response.cookies.set(adminCsrfCookie, "", {
    httpOnly: false,
    sameSite: "strict",
    secure: secureCookies,
    path: "/",
    maxAge: 0
  });
  return response;
}

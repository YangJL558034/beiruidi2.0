import { NextRequest, NextResponse } from "next/server";
import { adminCsrfCookie, adminSessionCookie, createAdminCsrfToken, readAdminSession } from "@/lib/auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(adminSessionCookie)?.value;
  if (!sessionToken || !(await readAdminSession(sessionToken))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const csrfToken = await createAdminCsrfToken(sessionToken);
  const response = NextResponse.json({ csrfToken }, { headers: { "Cache-Control": "no-store" } });
  const secureCookies = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set(adminCsrfCookie, csrfToken, { httpOnly: false, sameSite: "strict", secure: secureCookies, path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
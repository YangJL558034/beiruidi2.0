import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = await readAdminSession(cookieStore.get(adminSessionCookie)?.value);
  return NextResponse.json(
    session ? { authenticated: true, email: session.email, role: session.role } : { authenticated: false },
    { headers: { "Cache-Control": "no-store" } }
  );
}

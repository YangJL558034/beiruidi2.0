import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookie,
  readAdminSession,
} from "@/lib/auth-session";
import { changeAdminPassword, recordSecurityEvent } from "@/lib/db";
import { getRequestIp } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await readAdminSession(
    request.cookies.get(adminSessionCookie)?.value,
  );
  if (!session)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    changeAdminPassword(
      session.email,
      String(body.currentPassword ?? ""),
      String(body.newPassword ?? ""),
    );
    recordSecurityEvent({
      type: "admin_password_changed",
      severity: "info",
      ip: getRequestIp(request),
      actor: session.email,
      detail: "Administrator changed password.",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "密码更新失败。" },
      { status: 400 },
    );
  }
}

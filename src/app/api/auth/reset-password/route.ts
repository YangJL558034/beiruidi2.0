import { NextRequest, NextResponse } from "next/server";
import {
  consumeRateLimit,
  recordSecurityEvent,
  resetAdminPassword,
} from "@/lib/db";
import { cleanText, getRequestIp } from "@/lib/request-security";
import {
  MAX_ADMIN_PASSWORD_LENGTH,
  MIN_ADMIN_PASSWORD_LENGTH,
} from "@/lib/security-constants";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const rate = consumeRateLimit(`password-reset-submit:${ip}`, 10, 60 * 60_000);
  if (!rate.allowed)
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试。" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );

  const body = await request.json().catch(() => null);
  const token = cleanText(body?.token, 256);
  const password = String(body?.password ?? "").slice(
    0,
    MAX_ADMIN_PASSWORD_LENGTH,
  );
  const ok = resetAdminPassword(token, password);
  if (!ok)
    return NextResponse.json(
      {
        error: `链接无效、已过期，或新密码少于 ${MIN_ADMIN_PASSWORD_LENGTH} 位。`,
      },
      { status: 400 },
    );

  recordSecurityEvent({
    type: "password_reset_success",
    severity: "info",
    ip,
    detail: "Administrator password was reset.",
  });
  return NextResponse.json({ ok: true });
}

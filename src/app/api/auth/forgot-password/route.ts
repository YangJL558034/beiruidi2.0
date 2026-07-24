import { NextRequest, NextResponse } from "next/server";
import {
  adminExists,
  consumeRateLimit,
  createPasswordReset,
  getSystemSettings,
  recordSecurityEvent,
} from "@/lib/db";
import { sendConfiguredMail } from "@/lib/mail";
import {
  cleanText,
  getRequestIp,
  validEmail,
} from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const rate = consumeRateLimit(`password-reset:${ip}`, 5, 60 * 60_000);
  if (!rate.allowed)
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试。" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );

  const body = await request.json().catch(() => null);
  const email = cleanText(body?.email, 254).toLowerCase();
  if (!validEmail(email))
    return NextResponse.json(
      { error: "请输入有效的邮箱地址。" },
      { status: 400 },
    );

  if (adminExists(email)) {
    const settings = getSystemSettings() as Record<string, unknown>;
    const token = createPasswordReset(
      email,
      Number(settings.passwordResetHours ?? 2),
    );
    const origin = new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin,
    ).origin;
    const resetUrl = `${origin}/admin/reset-password?token=${token}`;
    await sendConfiguredMail({
      to: email,
      subject: "SZA POWER 后台密码重置",
      text: `请在有效期内打开此链接重置密码：${resetUrl}`,
      html: `<p>请在有效期内点击链接重置密码：</p><p><a href="${resetUrl}">重置后台密码</a></p>`,
    }).catch((error) =>
      recordSecurityEvent({
        type: "password_reset_email_failed",
        severity: "warning",
        ip,
        actor: email,
        detail:
          error instanceof Error ? error.message : "Mail delivery failed",
      }),
    );
  }

  return NextResponse.json({ ok: true });
}

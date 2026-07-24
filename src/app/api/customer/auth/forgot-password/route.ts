import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/db";
import { randomOpaqueToken } from "@/lib/customer-session";
import { sendConfiguredMail } from "@/lib/mail";
import {
  cleanText,
  getRequestIp,
  requestOriginAllowed,
  validEmail,
} from "@/lib/request-security";
import {
  createCustomerPasswordReset,
  getCustomerByEmail,
} from "@/lib/support-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!requestOriginAllowed(request))
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const rate = consumeRateLimit(`customer-reset:${ip}`, 6, 60 * 60_000);
  if (!rate.allowed)
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试。" },
      { status: 429 },
    );
  const body = await request.json().catch(() => ({}));
  const email = cleanText(body.email, 254).toLowerCase();
  if (!validEmail(email))
    return NextResponse.json({ error: "请输入有效邮箱。" }, { status: 400 });
  const customer = getCustomerByEmail(email);
  if (customer) {
    const token = randomOpaqueToken();
    createCustomerPasswordReset(customer.id, token);
    const locale = body.locale === "cn" ? "cn" : "en";
    const base = (process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).replace(
      /\/+$/,
      "",
    );
    const url = `${base}/${locale}/account/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await sendConfiguredMail({
        to: email,
        subject:
          locale === "cn"
            ? "重置 BarryT 客户中心密码"
            : "Reset your BarryT customer center password",
        text:
          locale === "cn"
            ? `请在 30 分钟内打开此链接重置密码：${url}`
            : `Open this link within 30 minutes to reset your password: ${url}`,
        html: `<p>${locale === "cn" ? "请在 30 分钟内点击下方链接重置密码：" : "Use the link below within 30 minutes to reset your password:"}</p><p><a href="${url}">${url}</a></p>`,
      });
    } catch {}
  }
  return NextResponse.json({
    ok: true,
    message: "如果该邮箱已注册，密码重置链接将发送到邮箱。",
  });
}

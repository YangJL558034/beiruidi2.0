import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  consumeRateLimit,
  recordSecurityEvent,
} from "@/lib/db";
import { sendConfiguredMail } from "@/lib/mail";
import {
  cleanText,
  getRequestIp,
  requestOriginAllowed,
  validEmail,
} from "@/lib/request-security";
import {
  createVerificationCode,
  getCustomerByEmail,
} from "@/lib/support-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!requestOriginAllowed(request))
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const email = cleanText(body.email, 254).toLowerCase();
  const purpose = body.purpose === "login" ? "login" : "";
  if (!purpose)
    return NextResponse.json(
      { error: "注册已改用页面数字验证码，无需发送邮件。" },
      { status: 400 },
    );
  if (!validEmail(email))
    return NextResponse.json({ error: "请输入有效邮箱地址。" }, { status: 400 });
  const ipRate = consumeRateLimit(`customer-code-ip:${ip}`, 10, 60 * 60_000);
  const emailRate = consumeRateLimit(
    `customer-code-email:${email}`,
    5,
    60 * 60_000,
  );
  if (!ipRate.allowed || !emailRate.allowed)
    return NextResponse.json(
      { error: "验证码请求过于频繁，请稍后再试。" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(ipRate.retryAfterSeconds, emailRate.retryAfterSeconds),
          ),
        },
      },
    );
  const exists = Boolean(getCustomerByEmail(email));
  if (!exists)
    return NextResponse.json({
      ok: true,
      message: "如果该邮箱可用于此操作，验证码将发送到邮箱。",
    });
  const code = crypto.randomInt(100000, 1000000).toString();
  createVerificationCode(email, purpose, code);
  const locale = body.locale === "cn" ? "cn" : "en";
  try {
    const result = await sendConfiguredMail({
      to: email,
      subject:
        locale === "cn"
          ? "BarryT 客户中心邮箱验证码"
          : "BarryT customer center verification code",
      text:
        locale === "cn"
          ? `你的验证码是 ${code}，10 分钟内有效。请勿将验证码告诉任何人。`
          : `Your verification code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
      html:
        locale === "cn"
          ? `<p>你的 BarryT 客户中心验证码是：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>验证码 10 分钟内有效，请勿转发。</p>`
          : `<p>Your BarryT customer center verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. Do not share it.</p>`,
    });
    if (!result.sent)
      return NextResponse.json(
        { error: "邮件服务尚未配置，请联系网站管理员。" },
        { status: 503 },
      );
  } catch (error) {
    recordSecurityEvent({
      type: "customer_verification_mail_failed",
      severity: "warning",
      ip,
      actor: email,
      detail: error instanceof Error ? error.message : "Mail delivery failed",
    });
    return NextResponse.json(
      { error: "验证码邮件发送失败，请稍后重试。" },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    message: locale === "cn" ? "验证码已发送。" : "Verification code sent.",
  });
}

import { NextRequest, NextResponse } from "next/server";
import {
  customerCookieOptions,
  customerCsrfCookie,
  customerCsrfCookieOptions,
  customerSessionCookie,
  customerSessionMaxAge,
  randomOpaqueToken,
} from "@/lib/customer-session";
import {
  cleanText,
  getRequestIp,
  requestOriginAllowed,
  validEmail,
} from "@/lib/request-security";
import {
  auditSupport,
  createCustomer,
  createCustomerSession,
  getCustomerByEmail,
} from "@/lib/support-db";
import { consumeCaptcha, consumeRateLimit } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!requestOriginAllowed(request))
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const rate = consumeRateLimit(`customer-register:${ip}`, 8, 60 * 60_000);
  if (!rate.allowed)
    return NextResponse.json(
      { error: "注册尝试过于频繁，请稍后再试。" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  const body = await request.json().catch(() => ({}));
  const email = cleanText(body.email, 254).toLowerCase();
  const password = String(body.password ?? "");
  const captchaId = cleanText(body.captchaId, 80);
  const captcha = cleanText(body.captcha, 12);
  const name =
    cleanText(body.name, 120) ||
    cleanText(email.split("@")[0]?.replace(/[._-]+/g, " "), 120);
  if (!validEmail(email))
    return NextResponse.json(
      { error: "请填写有效邮箱地址。" },
      { status: 400 },
    );
  if (body.consent !== true)
    return NextResponse.json(
      { error: "注册前需要同意隐私政策和客户中心数据处理说明。" },
      { status: 400 },
    );
  if (getCustomerByEmail(email))
    return NextResponse.json(
      { error: "该邮箱已经注册，请直接登录。" },
      { status: 409 },
    );
  if (!captchaId || !captcha || !consumeCaptcha(captchaId, captcha))
    return NextResponse.json(
      {
        error: "数字验证码错误或已过期，请点击图片刷新后重试。",
        refreshCaptcha: true,
      },
      { status: 400 },
    );
  try {
    const customer = createCustomer({
      email,
      password,
      name,
      emailVerified: false,
    });
    if (!customer) throw new Error("Customer creation failed.");
    const token = randomOpaqueToken();
    const csrf = randomOpaqueToken();
    createCustomerSession({
      customerId: customer.id,
      token,
      maxAgeSeconds: customerSessionMaxAge,
      ip,
      userAgent: request.headers.get("user-agent") ?? "",
    });
    auditSupport({
      actorType: "customer",
      actorId: customer.id,
      action: "customer_registered",
      targetType: "customer",
      targetId: customer.id,
      ip,
    });
    const response = NextResponse.json({ customer }, { status: 201 });
    response.cookies.set(
      customerSessionCookie,
      token,
      customerCookieOptions(),
    );
    response.cookies.set(
      customerCsrfCookie,
      csrf,
      customerCsrfCookieOptions(),
    );
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "注册失败，请稍后重试。",
      },
      { status: 400 },
    );
  }
}

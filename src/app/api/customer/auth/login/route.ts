import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, recordSecurityEvent } from "@/lib/db";
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
  authenticateCustomer,
  consumeVerificationCode,
  createCustomerSession,
  markCustomerLogin,
} from "@/lib/support-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!requestOriginAllowed(request))
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const email = cleanText(body.email, 254).toLowerCase();
  const password = String(body.password ?? "");
  const code = cleanText(body.code, 12);
  if (!validEmail(email) || !password || !code)
    return NextResponse.json(
      { error: "请输入邮箱、密码和邮箱验证码。" },
      { status: 400 },
    );
  const ipRate = consumeRateLimit(`customer-login-ip:${ip}`, 20, 15 * 60_000);
  const accountRate = consumeRateLimit(
    `customer-login-email:${email}`,
    8,
    15 * 60_000,
  );
  if (!ipRate.allowed || !accountRate.allowed)
    return NextResponse.json(
      { error: "登录失败次数过多，请稍后再试。" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(ipRate.retryAfterSeconds, accountRate.retryAfterSeconds),
          ),
        },
      },
    );
  const customer = authenticateCustomer(email, password);
  const codeValid =
    customer && consumeVerificationCode(email, "login", code);
  if (!customer || !codeValid) {
    recordSecurityEvent({
      type: "customer_login_failed",
      severity: "warning",
      ip,
      actor: email,
      detail: "Customer credentials or email verification code rejected.",
    });
    return NextResponse.json(
      { error: "邮箱、密码或验证码错误。" },
      { status: 401 },
    );
  }
  markCustomerLogin(customer.id);
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
    action: "customer_login",
    targetType: "session",
    ip,
  });
  const response = NextResponse.json({ customer });
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
}

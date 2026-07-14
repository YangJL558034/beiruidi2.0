import { NextRequest, NextResponse } from "next/server";
import { adminCsrfCookie, adminSessionCookie, createAdminCsrfToken, createAdminSession } from "@/lib/auth-session";
import { clearLoginFailures, consumeCaptcha, getLoginIpLock, getAdminRole, getSystemSettings, recordLoginFailure, recordSecurityEvent, verifyAdmin } from "@/lib/db";
import { cleanText, getRequestIp, requestOriginAllowed, validEmail } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!requestOriginAllowed(request)) {
    recordSecurityEvent({ type: "csrf_rejected", severity: "warning", ip, detail: "Login request origin did not match the configured site origin." });
    return NextResponse.json({ error: "请求来源验证失败，请刷新页面重试。" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const email = cleanText(body.email, 254).toLowerCase();
    const password = String(body.password ?? "").slice(0, 512);
    const captchaId = cleanText(body.captchaId, 80);
    const captcha = cleanText(body.captcha, 12);
    if (!validEmail(email) || !password || !captchaId || !captcha) return NextResponse.json({ error: "请完整填写邮箱、密码和验证码。" }, { status: 400 });

    const settings = getSystemSettings() as Record<string, unknown>;
    const maxAttempts = Math.max(3, Math.min(10, Number(settings.loginMaxAttempts ?? 5)));
    const lockMinutes = Math.max(5, Math.min(1440, Number(settings.loginLockMinutes ?? 30)));
    const lock = getLoginIpLock(ip);
    if (lock.locked) {
      recordSecurityEvent({ type: "login_blocked", severity: "warning", ip, actor: email, detail: `IP locked until ${lock.lockedUntil}` });
      return NextResponse.json({ error: `登录尝试过多，该 IP 已锁定至 ${new Date(lock.lockedUntil).toLocaleString("zh-CN")}` }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((Date.parse(lock.lockedUntil) - Date.now()) / 1000))) } });
    }
    if (!consumeCaptcha(captchaId, captcha)) return NextResponse.json({ error: "验证码错误或已过期，请重新输入。", refreshCaptcha: true }, { status: 400 });

    if (!verifyAdmin(email, password)) {
      const failure = recordLoginFailure(ip, email, maxAttempts, lockMinutes);
      recordSecurityEvent({ type: failure.locked ? "login_ip_locked" : "login_failed", severity: failure.locked ? "critical" : "warning", ip, actor: email, detail: `Failed attempt ${failure.failedCount}/${maxAttempts}` });
      const message = failure.locked ? `密码连续错误 ${maxAttempts} 次，该 IP 已锁定 ${lockMinutes} 分钟。` : `邮箱或密码错误，还可尝试 ${Math.max(0, maxAttempts - failure.failedCount)} 次。`;
      return NextResponse.json({ error: message, refreshCaptcha: true }, { status: failure.locked ? 429 : 401 });
    }

    clearLoginFailures(ip);
    recordSecurityEvent({ type: "login_success", severity: "info", ip, actor: email, detail: "Administrator signed in." });
    const maxAge = 60 * 60 * 8;
    const sessionToken = await createAdminSession(email, getAdminRole(email), maxAge);
    const csrfToken = await createAdminCsrfToken(sessionToken);
    const response = NextResponse.json({ ok: true });
    const secureCookies = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(adminSessionCookie, sessionToken, { httpOnly: true, sameSite: "lax", secure: secureCookies, path: "/", maxAge });
    response.cookies.set(adminCsrfCookie, csrfToken, { httpOnly: false, sameSite: "strict", secure: secureCookies, path: "/", maxAge });
    return response;
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }
}
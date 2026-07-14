import { NextRequest, NextResponse } from "next/server";
import { adminCsrfCookie, adminSessionCookie, readAdminSession, verifyAdminCsrfToken } from "@/lib/auth-session";
import { isUnsafeMethod, requestOriginAllowed } from "@/lib/request-security";

const localeCookie = "sza_locale";

function isLocale(value: string): value is "cn" | "en" {
  return value === "cn" || value === "en";
}

function getCountry(request: NextRequest) {
  return (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("cloudfront-viewer-country") ||
    request.headers.get("x-country-code") ||
    ""
  ).toUpperCase();
}

function detectLocale(request: NextRequest) {
  const country = getCountry(request);
  if (country === "CN") return "cn";
  if (country && country !== "XX") return "en";
  const saved = request.cookies.get(localeCookie)?.value;
  if (isLocale(saved ?? "")) return saved as "cn" | "en";
  return request.headers.get("accept-language")?.toLowerCase().includes("zh") ? "cn" : "en";
}

function roleCanAccess(role: "owner" | "editor" | "support", pathname: string) {
  if(role === "owner") return true;
  if(role === "support") return pathname === "/api/admin/inquiries" || pathname === "/api/admin/monitoring";
  return pathname === "/api/admin/products" || pathname === "/api/admin/posts" || pathname === "/api/admin/site-content" || pathname === "/api/admin/inquiries" || pathname === "/api/admin/monitoring";
}
function isPublicFile(pathname: string) {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

function withLocaleHeader(request: NextRequest, locale: "cn" | "en", pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-sza-locale", locale);
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  response.cookies.set(localeCookie, locale, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 180 });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || isPublicFile(pathname)) return NextResponse.next();

  const session = await readAdminSession(request.cookies.get(adminSessionCookie)?.value);
  const hasSession = Boolean(session);
  const isLogin = pathname === "/admin/login";
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/forgot-password" || pathname === "/admin/reset-password";
  const isAdminPage = pathname.startsWith("/admin") && !isAuthPage;
  const isAdminApi = pathname.startsWith("/api/admin");
  const unsafe = isUnsafeMethod(request.method);

  if (unsafe && (isAdminApi || pathname.startsWith("/api/auth")) && !requestOriginAllowed(request)) {
    return NextResponse.json({ error: "Request origin validation failed." }, { status: 403 });
  }

  if (isAdminApi && hasSession && !roleCanAccess(session?.role ?? "owner", pathname)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  if (unsafe && (isAdminApi || pathname === "/api/auth/logout") && hasSession) {
    const sessionToken=request.cookies.get(adminSessionCookie)?.value;
    const csrfValid=await verifyAdminCsrfToken(sessionToken,request.cookies.get(adminCsrfCookie)?.value,request.headers.get("x-sza-csrf"));
    if(!csrfValid) return NextResponse.json({error:"CSRF validation failed."},{status:403});
  }

  if ((isAdminPage || isAdminApi) && !hasSession) {
    if (isAdminApi) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/admin")) return NextResponse.next();

  const rewrittenLocale = request.headers.get("x-sza-locale");
  if (isLocale(rewrittenLocale ?? "")) return NextResponse.next();

  const firstSegment = pathname.split("/")[1];
  if (isLocale(firstSegment)) {
    const withoutLocale = pathname === `/${firstSegment}` ? "/" : pathname.slice(firstSegment.length + 1);
    return withLocaleHeader(request, firstSegment, withoutLocale);
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next).*)"] };

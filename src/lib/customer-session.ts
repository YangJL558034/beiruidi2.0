import crypto from "node:crypto";

export const customerSessionCookie = "sza_customer_session";
export const customerCsrfCookie = "sza_customer_csrf";
export const customerSessionMaxAge = 60 * 60 * 24 * 30;

export function randomOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function secureTokenEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function customerCookieOptions(maxAge = customerSessionMaxAge) {
  const secure =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}

export function customerCsrfCookieOptions(maxAge = customerSessionMaxAge) {
  const secure =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  return {
    httpOnly: false,
    sameSite: "strict" as const,
    secure,
    path: "/",
    maxAge,
  };
}

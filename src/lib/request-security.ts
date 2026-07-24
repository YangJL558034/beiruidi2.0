import type { NextRequest } from "next/server";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function getTargetOrigin(request: NextRequest) {
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(/:$/, "");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim();
  if (!host || !["http", "https"].includes(protocol)) return "";
  return normalizeOrigin(`${protocol}://${host}`);
}

export function getRequestIp(request: NextRequest) {
  const raw =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("true-client-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";
  const clean = raw
    .trim()
    .replace(/[^0-9a-fA-F:.[\]-]/g, "")
    .slice(0, 64);
  return clean || "unknown";
}

export function requestOriginAllowed(request: NextRequest) {
  const source =
    normalizeOrigin(request.headers.get("origin")) ||
    normalizeOrigin(request.headers.get("referer"));
  if (!source) return process.env.NODE_ENV !== "production";

  const configured = [
    getTargetOrigin(request),
    request.nextUrl.origin,
    process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.SZA_TRUSTED_ORIGINS ?? "").split(","),
  ]
    .map((value) => normalizeOrigin(value?.trim()))
    .filter(Boolean);
  return new Set(configured).has(source);
}

export function isUnsafeMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function cleanText(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

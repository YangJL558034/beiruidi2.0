const encoder = new TextEncoder();

export const adminSessionCookie = "sza_admin_session";
export const adminCsrfCookie = "sza_admin_csrf";

import type { AdminRole } from "@/lib/content-types";

export type SessionPayload = {
  email: string;
  role: AdminRole;
  expiresAt: number;
  nonce: string;
};

function sessionSecret() {
  const secret = process.env.SZA_SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) throw new Error("SZA_SESSION_SECRET is required in production.");
  return secret ?? "sza-power-local-development-session-secret";
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createAdminSession(email: string, role: AdminRole = "owner", maxAgeSeconds = 60 * 60 * 8) {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    role,
    expiresAt: Date.now() + maxAgeSeconds * 1000,
    nonce: crypto.randomUUID()
  };
  const encodedPayload = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(encodedPayload));
  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function readAdminSession(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [encodedPayload, encodedSignature, ...rest] = token.split(".");
  if (!encodedPayload || !encodedSignature || rest.length) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      decodeBase64Url(encodedSignature),
      encoder.encode(encodedPayload)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as SessionPayload;
    if (!payload.email || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    const { getActiveAdminSessionState } = await import("@/lib/db");
    const current = getActiveAdminSessionState(payload.email);
    if (!current) return null;
    return { ...payload, role: current.role };
  } catch {
    return null;
  }
}
export async function createAdminCsrfToken(sessionToken: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    encoder.encode("csrf:" + sessionToken)
  );
  return encodeBase64Url(new Uint8Array(signature));
}

export async function verifyAdminCsrfToken(
  sessionToken: string | null | undefined,
  cookieToken: string | null | undefined,
  headerToken: string | null | undefined
) {
  if (!sessionToken || !cookieToken || !headerToken || cookieToken !== headerToken) return false;
  if (headerToken.length !== 43) return false;
  return crypto.subtle.verify(
    "HMAC",
    await getKey(),
    decodeBase64Url(headerToken),
    encoder.encode("csrf:" + sessionToken)
  );
}

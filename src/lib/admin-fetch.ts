"use client";

const adminCsrfCookie = "sza_admin_csrf";

function readCookie(name: string) {
  const prefix = encodeURIComponent(name) + "=";
  const item = document.cookie.split("; ").find((value) => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : "";
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return fetch(input, init);
  let csrf = "";
  const tokenResponse = await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" });
  if (tokenResponse.ok) csrf = String((await tokenResponse.json()).csrfToken ?? "");
  if (!csrf) csrf = readCookie(adminCsrfCookie);
  const headers = new Headers(init.headers);
  if (csrf) headers.set("x-sza-csrf", csrf);
  return fetch(input, { ...init, credentials: "same-origin", headers });
}
"use client";

function readCookie(name: string) {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function customerFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  const method = String(init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = decodeURIComponent(readCookie("sza_customer_csrf") ?? "");
    if (csrf) headers.set("x-sza-customer-csrf", csrf);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
}

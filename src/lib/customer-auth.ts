import type { NextRequest } from "next/server";
import {
  customerCsrfCookie,
  customerSessionCookie,
  secureTokenEqual,
} from "@/lib/customer-session";
import { customerForSession } from "@/lib/support-db";

export function getCustomerFromRequest(request: NextRequest) {
  return customerForSession(
    request.cookies.get(customerSessionCookie)?.value ?? "",
  );
}

export function customerCsrfValid(request: NextRequest) {
  const cookie = request.cookies.get(customerCsrfCookie)?.value ?? "";
  const header = request.headers.get("x-sza-customer-csrf") ?? "";
  return (
    cookie.length >= 32 &&
    header.length >= 32 &&
    secureTokenEqual(cookie, header)
  );
}

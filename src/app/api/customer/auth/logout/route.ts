import { NextRequest, NextResponse } from "next/server";
import { customerCsrfValid } from "@/lib/customer-auth";
import {
  customerCookieOptions,
  customerCsrfCookie,
  customerCsrfCookieOptions,
  customerSessionCookie,
} from "@/lib/customer-session";
import { revokeCustomerSession } from "@/lib/support-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!customerCsrfValid(request))
    return NextResponse.json({ error: "CSRF validation failed." }, { status: 403 });
  revokeCustomerSession(
    request.cookies.get(customerSessionCookie)?.value ?? "",
  );
  const response = NextResponse.json({ ok: true });
  response.cookies.set(customerSessionCookie, "", customerCookieOptions(0));
  response.cookies.set(customerCsrfCookie, "", customerCsrfCookieOptions(0));
  return response;
}

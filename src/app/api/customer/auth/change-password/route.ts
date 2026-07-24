import { NextRequest, NextResponse } from "next/server";
import {
  customerCsrfValid,
  getCustomerFromRequest,
} from "@/lib/customer-auth";
import { changeCustomerPassword } from "@/lib/support-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const customer = getCustomerFromRequest(request);
  if (!customer)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!customerCsrfValid(request))
    return NextResponse.json({ error: "CSRF validation failed." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  try {
    changeCustomerPassword(
      customer.id,
      String(body.currentPassword ?? ""),
      String(body.newPassword ?? ""),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "密码更新失败。" },
      { status: 400 },
    );
  }
}

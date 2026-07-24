import { NextRequest, NextResponse } from "next/server";
import {
  customerCsrfValid,
  getCustomerFromRequest,
} from "@/lib/customer-auth";
import { getRequestIp } from "@/lib/request-security";
import {
  auditSupport,
  getCustomerInquiryBag,
  replaceCustomerInquiryBag,
} from "@/lib/support-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const customer = getCustomerFromRequest(request);
  if (!customer)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(
    { items: getCustomerInquiryBag(customer.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: NextRequest) {
  const customer = getCustomerFromRequest(request);
  if (!customer)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!customerCsrfValid(request))
    return NextResponse.json(
      { error: "CSRF validation failed." },
      { status: 403 },
    );
  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length > 50)
    return NextResponse.json(
      { error: "采购清单最多保存 50 种商品。" },
      { status: 400 },
    );
  const saved = replaceCustomerInquiryBag(customer.id, items);
  auditSupport({
    actorType: "customer",
    actorId: customer.id,
    action: "inquiry_bag_updated",
    targetType: "inquiry_bag",
    detail: `${saved.length} product lines`,
    ip: getRequestIp(request),
  });
  return NextResponse.json({ items: saved });
}

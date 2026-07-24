import { NextRequest, NextResponse } from "next/server";
import {
  customerCsrfValid,
  getCustomerFromRequest,
} from "@/lib/customer-auth";
import { getRequestIp } from "@/lib/request-security";
import {
  auditSupport,
  getCustomerConversations,
  getOrCreateConversation,
} from "@/lib/support-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const customer = getCustomerFromRequest(request);
  if (!customer)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(
    { conversations: getCustomerConversations(customer.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const customer = getCustomerFromRequest(request);
  if (!customer)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!customerCsrfValid(request))
    return NextResponse.json({ error: "CSRF validation failed." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const conversation = getOrCreateConversation(
    customer.id,
    String(body.subject ?? ""),
  );
  if (!conversation)
    return NextResponse.json({ error: "无法创建会话。" }, { status: 500 });
  auditSupport({
    actorType: "customer",
    actorId: customer.id,
    action: "conversation_opened",
    targetType: "conversation",
    targetId: conversation.id,
    ip: getRequestIp(request),
  });
  return NextResponse.json({ conversation }, { status: 201 });
}

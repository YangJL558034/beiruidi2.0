import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/db";
import {
  customerCsrfValid,
  getCustomerFromRequest,
} from "@/lib/customer-auth";
import { getRequestIp } from "@/lib/request-security";
import {
  auditSupport,
  createSupportMessage,
  customerCanAccessConversation,
  getConversationMessages,
  markConversationRead,
} from "@/lib/support-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function idOf(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const customer = getCustomerFromRequest(request);
  const conversationId = idOf((await params).id);
  if (
    !customer ||
    !conversationId ||
    !customerCanAccessConversation(customer.id, conversationId)
  )
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const after = Math.max(Number(request.nextUrl.searchParams.get("after")) || 0, 0);
  const messages = getConversationMessages(conversationId, after);
  markConversationRead(conversationId, "customer");
  return NextResponse.json(
    { messages },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const customer = getCustomerFromRequest(request);
  const conversationId = idOf((await params).id);
  if (
    !customer ||
    !conversationId ||
    !customerCanAccessConversation(customer.id, conversationId)
  )
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!customerCsrfValid(request))
    return NextResponse.json({ error: "CSRF validation failed." }, { status: 403 });
  const rate = consumeRateLimit(
    `customer-message:${customer.id}:${getRequestIp(request)}`,
    80,
    60_000,
  );
  if (!rate.allowed)
    return NextResponse.json(
      { error: "消息发送过于频繁，请稍后再试。" },
      { status: 429 },
    );
  const body = await request.json().catch(() => ({}));
  try {
    const message = createSupportMessage({
      conversationId,
      senderType: "customer",
      senderCustomerId: customer.id,
      body: String(body.body ?? ""),
    });
    auditSupport({
      actorType: "customer",
      actorId: customer.id,
      action: "message_sent",
      targetType: "conversation",
      targetId: conversationId,
      ip: getRequestIp(request),
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "消息发送失败。" },
      { status: 400 },
    );
  }
}

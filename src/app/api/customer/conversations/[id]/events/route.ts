import { NextRequest } from "next/server";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import {
  customerCanAccessConversation,
  getConversationMessages,
} from "@/lib/support-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const customer = getCustomerFromRequest(request);
  const conversationId = Number((await params).id);
  if (
    !customer ||
    !Number.isInteger(conversationId) ||
    !customerCanAccessConversation(customer.id, conversationId)
  )
    return new Response("Not found.", { status: 404 });
  let lastId = Math.max(Number(request.nextUrl.searchParams.get("after")) || 0, 0);
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const push = () => {
        try {
          const messages = getConversationMessages(conversationId, lastId);
          for (const message of messages) {
            lastId = Math.max(lastId, message.id);
            controller.enqueue(
              encoder.encode(`id: ${message.id}\nevent: message\ndata: ${JSON.stringify(message)}\n\n`),
            );
          }
          controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
        } catch {
          if (timer) clearInterval(timer);
          controller.close();
        }
      };
      push();
      timer = setInterval(push, 2_000);
      request.signal.addEventListener(
        "abort",
        () => {
          if (timer) clearInterval(timer);
          try {
            controller.close();
          } catch {}
        },
        { once: true },
      );
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

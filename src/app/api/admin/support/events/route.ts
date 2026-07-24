import { NextRequest } from "next/server";
import {
  adminSessionCookie,
  readAdminSession,
} from "@/lib/auth-session";
import {
  getConversationMessages,
  staffCanAccessConversation,
} from "@/lib/support-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const actor = await readAdminSession(
    request.cookies.get(adminSessionCookie)?.value,
  );
  const conversationId = Number(request.nextUrl.searchParams.get("id"));
  if (
    !actor ||
    !Number.isInteger(conversationId) ||
    !staffCanAccessConversation(actor.email, actor.role, conversationId)
  )
    return new Response("Not found.", { status: 404 });
  let lastId = Math.max(Number(request.nextUrl.searchParams.get("after")) || 0, 0);
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const push = () => {
        try {
          for (const message of getConversationMessages(conversationId, lastId)) {
            lastId = Math.max(lastId, message.id);
            controller.enqueue(
              encoder.encode(`id: ${message.id}\nevent: message\ndata: ${JSON.stringify(message)}\n\n`),
            );
          }
          controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
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

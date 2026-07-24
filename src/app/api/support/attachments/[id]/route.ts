import fs from "node:fs";
import { NextRequest } from "next/server";
import {
  adminSessionCookie,
  readAdminSession,
} from "@/lib/auth-session";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import {
  customerCanAccessConversation,
  getAttachment,
  staffCanAccessConversation,
} from "@/lib/support-db";
import { supportFilePath } from "@/lib/support-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const attachment = getAttachment(Number((await params).id));
  if (!attachment || attachment.scanStatus !== "clean")
    return new Response("Not found.", { status: 404 });
  const customer = getCustomerFromRequest(request);
  const admin = await readAdminSession(
    request.cookies.get(adminSessionCookie)?.value,
  );
  const allowed =
    (customer &&
      customerCanAccessConversation(customer.id, attachment.conversationId)) ||
    (admin &&
      staffCanAccessConversation(
        admin.email,
        admin.role,
        attachment.conversationId,
      ));
  if (!allowed) return new Response("Not found.", { status: 404 });
  const file = supportFilePath(attachment.storageName);
  if (!fs.existsSync(file)) return new Response("Not found.", { status: 404 });
  const content = fs.readFileSync(file);
  const inline = attachment.isImage || attachment.mimeType === "application/pdf";
  return new Response(content, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(content.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

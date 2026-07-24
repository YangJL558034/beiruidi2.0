import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/db";
import {
  customerCsrfValid,
  getCustomerFromRequest,
} from "@/lib/customer-auth";
import { getRequestIp } from "@/lib/request-security";
import {
  auditSupport,
  createAttachmentRecord,
  createSupportMessage,
  customerCanAccessConversation,
} from "@/lib/support-db";
import {
  supportFilePath,
  validateAndStoreSupportFile,
} from "@/lib/support-files";

export const runtime = "nodejs";

export async function POST(
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
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!customerCsrfValid(request))
    return NextResponse.json({ error: "CSRF validation failed." }, { status: 403 });
  const rate = consumeRateLimit(
    `customer-attachment:${customer.id}:${getRequestIp(request)}`,
    20,
    60 * 60_000,
  );
  if (!rate.allowed)
    return NextResponse.json({ error: "附件上传过于频繁。" }, { status: 429 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "请选择附件。" }, { status: 400 });
  let stored: Awaited<ReturnType<typeof validateAndStoreSupportFile>> | null =
    null;
  try {
    stored = await validateAndStoreSupportFile(file);
    const attachment = createAttachmentRecord({
      conversationId,
      customerId: customer.id,
      uploadedByType: "customer",
      uploadedById: customer.id,
      ...stored,
    });
    if (!attachment) throw new Error("附件记录创建失败。");
    const message = createSupportMessage({
      conversationId,
      senderType: "customer",
      senderCustomerId: customer.id,
      attachmentId: attachment.id,
      body: String(form.get("caption") ?? ""),
    });
    auditSupport({
      actorType: "customer",
      actorId: customer.id,
      action: "attachment_uploaded",
      targetType: "attachment",
      targetId: attachment.id,
      detail: attachment.sha256,
      ip: getRequestIp(request),
    });
    return NextResponse.json({ attachment, message }, { status: 201 });
  } catch (error) {
    if (stored)
      fs.rmSync(supportFilePath(stored.storageName), { force: true });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "附件上传失败。" },
      { status: 400 },
    );
  }
}

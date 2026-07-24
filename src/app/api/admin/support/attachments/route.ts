import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookie,
  readAdminSession,
} from "@/lib/auth-session";
import { getRequestIp } from "@/lib/request-security";
import {
  auditSupport,
  createAttachmentRecord,
  createSupportMessage,
  getConversationById,
  getStaffId,
  staffCanAccessConversation,
} from "@/lib/support-db";
import {
  supportFilePath,
  validateAndStoreSupportFile,
} from "@/lib/support-files";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const actor = await readAdminSession(
    request.cookies.get(adminSessionCookie)?.value,
  );
  if (!actor)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const form = await request.formData();
  const conversationId = Number(form.get("conversationId"));
  const conversation = getConversationById(conversationId);
  if (
    !conversation ||
    !staffCanAccessConversation(actor.email, actor.role, conversationId)
  )
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "请选择附件。" }, { status: 400 });
  let stored: Awaited<ReturnType<typeof validateAndStoreSupportFile>> | null =
    null;
  try {
    stored = await validateAndStoreSupportFile(file);
    const staffId = getStaffId(actor.email);
    const attachment = createAttachmentRecord({
      conversationId,
      customerId: conversation.customerId,
      uploadedByType: "staff",
      uploadedById: staffId,
      ...stored,
    });
    if (!attachment) throw new Error("附件记录创建失败。");
    const message = createSupportMessage({
      conversationId,
      senderType: "staff",
      senderAdminId: staffId,
      attachmentId: attachment.id,
      body: String(form.get("caption") ?? ""),
    });
    auditSupport({
      actorType: "staff",
      actorId: staffId,
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

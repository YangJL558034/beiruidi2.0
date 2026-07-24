import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookie,
  readAdminSession,
} from "@/lib/auth-session";
import { createPasswordReset } from "@/lib/db";
import { randomOpaqueToken } from "@/lib/customer-session";
import { sendConfiguredMail } from "@/lib/mail";
import { getRequestIp, validEmail } from "@/lib/request-security";
import {
  addConversationNote,
  assignConversation,
  auditSupport,
  createCustomerPasswordReset,
  createSupportMessage,
  createSupportStaff,
  getConversationMessages,
  getConversationNotes,
  getCustomerByEmail,
  getQuickReplies,
  getStaffConversations,
  getStaffId,
  getSupportStaff,
  markConversationRead,
  saveQuickReply,
  setConversationTags,
  setCustomerTemporaryPassword,
  setStaffPresence,
  staffCanAccessConversation,
  updateConversationStatus,
  updateSupportStaff,
} from "@/lib/support-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function session(request: NextRequest) {
  return readAdminSession(request.cookies.get(adminSessionCookie)?.value);
}

function parseId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function GET(request: NextRequest) {
  const actor = await session(request);
  if (!actor)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  setStaffPresence(actor.email, "online");
  const action = request.nextUrl.searchParams.get("action") ?? "list";
  if (action === "staff")
    return NextResponse.json(
      { staff: getSupportStaff() },
      { headers: { "Cache-Control": "no-store" } },
    );
  if (action === "quick-replies")
    return NextResponse.json(
      { replies: getQuickReplies() },
      { headers: { "Cache-Control": "no-store" } },
    );
  if (action === "messages") {
    const conversationId = parseId(request.nextUrl.searchParams.get("id"));
    if (
      !conversationId ||
      !staffCanAccessConversation(actor.email, actor.role, conversationId)
    )
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    markConversationRead(conversationId, "staff");
    return NextResponse.json(
      {
        messages: getConversationMessages(conversationId),
        notes: getConversationNotes(conversationId),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      conversations: getStaffConversations({
        email: actor.email,
        role: actor.role,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
        query: request.nextUrl.searchParams.get("q") ?? undefined,
      }),
      staff: getSupportStaff(),
      replies: getQuickReplies(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const actor = await session(request);
  if (!actor)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");
  try {
    if (action === "message") {
      const conversationId = parseId(body.conversationId);
      if (
        !staffCanAccessConversation(actor.email, actor.role, conversationId)
      )
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      const message = createSupportMessage({
        conversationId,
        senderType: "staff",
        senderAdminId: getStaffId(actor.email),
        body: String(body.body ?? ""),
      });
      auditSupport({
        actorType: "staff",
        actorId: getStaffId(actor.email),
        action: "message_sent",
        targetType: "conversation",
        targetId: conversationId,
        ip: getRequestIp(request),
      });
      return NextResponse.json({ message }, { status: 201 });
    }
    if (action === "note") {
      const conversationId = parseId(body.conversationId);
      if (
        !staffCanAccessConversation(actor.email, actor.role, conversationId)
      )
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      addConversationNote(conversationId, actor.email, String(body.body ?? ""));
      auditSupport({
        actorType: "staff",
        actorId: getStaffId(actor.email),
        action: "internal_note_added",
        targetType: "conversation",
        targetId: conversationId,
        ip: getRequestIp(request),
      });
      return NextResponse.json({
        notes: getConversationNotes(conversationId),
      });
    }
    if (action === "quick-reply") {
      saveQuickReply(actor.email, body);
      auditSupport({
        actorType: "staff",
        actorId: getStaffId(actor.email),
        action: "quick_reply_saved",
        targetType: "quick_reply",
        ip: getRequestIp(request),
      });
      return NextResponse.json({ replies: getQuickReplies() });
    }
    if (action === "staff") {
      if (actor.role !== "owner")
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      if (
        !validEmail(String(body.email ?? "")) ||
        !["support", "sales"].includes(body.role)
      )
        return NextResponse.json(
          { error: "员工邮箱或角色无效。" },
          { status: 400 },
        );
      const staff = createSupportStaff({
        email: String(body.email),
        displayName: String(body.displayName ?? ""),
        role: body.role,
        password: String(body.password ?? ""),
      });
      auditSupport({
        actorType: "staff",
        actorId: getStaffId(actor.email),
        action: "staff_created",
        targetType: "staff",
        targetId: staff?.id,
        ip: getRequestIp(request),
      });
      return NextResponse.json({ staff }, { status: 201 });
    }
    if (action === "send-reset") {
      if (actor.role !== "owner")
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      const email = String(body.email ?? "").trim().toLowerCase();
      const origin = (
        process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin
      ).replace(/\/+$/, "");
      const customer = getCustomerByEmail(email);
      let url = "";
      if (customer) {
        const token = randomOpaqueToken();
        createCustomerPasswordReset(customer.id, token);
        url = `${origin}/cn/account/reset-password?token=${encodeURIComponent(token)}`;
      } else {
        const staff = getSupportStaff().find(
          (item) => item.email === email && item.active,
        );
        if (!staff) throw new Error("账号不存在或已停用。");
        const token = createPasswordReset(email, 2);
        url = `${origin}/admin/reset-password?token=${encodeURIComponent(token)}`;
      }
      await sendConfiguredMail({
        to: email,
        subject: "BarryT 密码重置",
        text: `请在有效期内打开此链接重置密码：${url}`,
        html: `<p>请在有效期内点击链接重置密码：</p><p><a href="${url}">${url}</a></p>`,
      });
      auditSupport({
        actorType: "staff",
        actorId: getStaffId(actor.email),
        action: "send_password_reset",
        targetType: customer ? "customer" : "staff",
        targetId: customer?.id,
        ip: getRequestIp(request),
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "temporary-customer") {
      if (actor.role !== "owner")
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      setCustomerTemporaryPassword(
        String(body.email ?? ""),
        String(body.temporaryPassword ?? ""),
      );
      const customer = getCustomerByEmail(String(body.email ?? ""));
      auditSupport({
        actorType: "staff",
        actorId: getStaffId(actor.email),
        action: "set_customer_temporary_password",
        targetType: "customer",
        targetId: customer?.id,
        ip: getRequestIp(request),
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "无效操作。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败。" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const actor = await session(request);
  if (!actor)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");
  try {
    if (action === "assign") {
      if (actor.role !== "owner" && actor.role !== "support")
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      assignConversation({
        conversationId: parseId(body.conversationId),
        toAdminId: parseId(body.toAdminId),
        actorEmail: actor.email,
      });
    } else if (action === "status") {
      const conversationId = parseId(body.conversationId);
      if (
        !staffCanAccessConversation(actor.email, actor.role, conversationId)
      )
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      updateConversationStatus(conversationId, body.status);
      auditSupport({
        actorType: "staff",
        actorId: getStaffId(actor.email),
        action: "conversation_status_changed",
        targetType: "conversation",
        targetId: conversationId,
        detail: String(body.status ?? ""),
        ip: getRequestIp(request),
      });
    } else if (action === "tags") {
      const conversationId = parseId(body.conversationId);
      if (
        !staffCanAccessConversation(actor.email, actor.role, conversationId)
      )
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      setConversationTags(
        conversationId,
        Array.isArray(body.tags) ? body.tags : [],
      );
    } else if (action === "presence") {
      setStaffPresence(
        actor.email,
        ["away", "offline"].includes(body.status) ? body.status : "online",
      );
    } else if (action === "staff") {
      if (actor.role !== "owner")
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      updateSupportStaff({
        id: parseId(body.id),
        displayName:
          body.displayName === undefined
            ? undefined
            : String(body.displayName),
        role: ["support", "sales"].includes(body.role)
          ? body.role
          : undefined,
        active:
          typeof body.active === "boolean" ? body.active : undefined,
        temporaryPassword: body.temporaryPassword
          ? String(body.temporaryPassword)
          : undefined,
      });
    } else {
      return NextResponse.json({ error: "无效操作。" }, { status: 400 });
    }
    auditSupport({
      actorType: "staff",
      actorId: getStaffId(actor.email),
      action,
      targetType: "conversation",
      targetId: parseId(body.conversationId),
      ip: getRequestIp(request),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新失败。" },
      { status: 400 },
    );
  }
}

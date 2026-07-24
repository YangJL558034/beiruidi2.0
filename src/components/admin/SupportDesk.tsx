"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  FileText,
  MessageCircle,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  UserPlus,
  Users,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import type { AdminRole } from "@/lib/content-types";
import type {
  QuickReply,
  SupportConversation,
  SupportMessage,
  SupportNote,
  SupportStaff,
} from "@/lib/support-types";

const field =
  "min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function stamp(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SupportDesk({
  role,
  announce,
}: {
  role: AdminRole;
  announce: (message: string) => void;
}) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [staff, setStaff] = useState<SupportStaff[]>([]);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [selectedId, setSelectedId] = useState(0);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [notes, setNotes] = useState<SupportNote[]>([]);
  const [status, setStatus] = useState("waiting");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    email: "",
    displayName: "",
    role: "sales" as "sales" | "support",
    password: "",
  });
  const [replyForm, setReplyForm] = useState({ title: "", body: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = conversations.find((item) => item.id === selectedId);

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await adminFetch(url, init);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "操作失败。");
    return data;
  }, []);

  const loadList = useCallback(async () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (query.trim()) params.set("q", query.trim());
    const data = await request(`/api/admin/support?${params}`);
    setConversations(data.conversations ?? []);
    setStaff(data.staff ?? []);
    setReplies(data.replies ?? []);
  }, [query, request, status]);

  const loadMessages = useCallback(async (id: number) => {
    const data = await request(
      `/api/admin/support?action=messages&id=${id}`,
    );
    setMessages(data.messages ?? []);
    setNotes(data.notes ?? []);
  }, [request]);

  useEffect(() => {
    const initial = window.setTimeout(
      () =>
        void loadList().catch((error) =>
          announce(error instanceof Error ? error.message : "加载失败"),
        ),
      0,
    );
    const timer = window.setInterval(() => void loadList(), 8_000);
    void request("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "presence", status: "online" }),
    }).catch(() => undefined);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [announce, loadList, request]);

  useEffect(() => {
    if (!selectedId) return;
    const initial = window.setTimeout(
      () => void loadMessages(selectedId),
      0,
    );
    const source = new EventSource(
      `/api/admin/support/events?id=${selectedId}&after=0`,
    );
    source.addEventListener("message", (event) => {
      const message = JSON.parse((event as MessageEvent).data) as SupportMessage;
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
      if (
        message.senderType === "customer" &&
        Notification.permission === "granted"
      )
        new Notification("BarryT 客户新消息", { body: message.body || "收到新附件" });
      void loadList();
    });
    return () => {
      window.clearTimeout(initial);
      source.close();
    };
  }, [loadList, loadMessages, selectedId]);

  async function send() {
    if (!draft.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      const data = await request("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          conversationId: selectedId,
          body: draft,
        }),
      });
      setDraft("");
      if (data.message) setMessages((current) => [...current, data.message]);
      await loadList();
    } catch (error) {
      announce(error instanceof Error ? error.message : "发送失败");
    } finally {
      setSending(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    try {
      await request("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await loadList();
      announce("已更新。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "更新失败");
    }
  }

  async function changeConversationStatus(
    conversationId: number,
    nextStatus: "waiting" | "active" | "closed",
  ) {
    try {
      await request("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          conversationId,
          status: nextStatus,
        }),
      });
      setConversations((current) =>
        current.map((item) =>
          item.id === conversationId ? { ...item, status: nextStatus } : item,
        ),
      );
      if (status !== "all") setStatus(nextStatus);
      announce(
        nextStatus === "closed"
          ? "会话已标记为完成，可在“已完成”列表中继续查看。"
          : nextStatus === "active"
            ? "会话已重新打开并进入“沟通中”。"
            : "会话已移回“等待对接”。",
      );
    } catch (error) {
      announce(error instanceof Error ? error.message : "会话状态更新失败。");
    }
  }

  async function addNote() {
    if (!note.trim() || !selectedId) return;
    const data = await request("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "note",
        conversationId: selectedId,
        body: note,
      }),
    });
    setNotes(data.notes ?? []);
    setNote("");
  }

  async function upload(file: File) {
    const body = new FormData();
    body.set("conversationId", String(selectedId));
    body.set("file", file);
    try {
      const data = await request("/api/admin/support/attachments", {
        method: "POST",
        body,
      });
      if (data.message) setMessages((current) => [...current, data.message]);
    } catch (error) {
      announce(error instanceof Error ? error.message : "附件上传失败");
    }
  }

  async function createStaff() {
    try {
      await request("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "staff", ...staffForm }),
      });
      setStaffForm({
        email: "",
        displayName: "",
        role: "sales",
        password: "",
      });
      await loadList();
      announce("销售账号已创建，首次登录必须修改临时密码。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "创建失败");
    }
  }

  async function createReply() {
    try {
      const data = await request("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quick-reply", ...replyForm }),
      });
      setReplies(data.replies ?? []);
      setReplyForm({ title: "", body: "" });
    } catch (error) {
      announce(error instanceof Error ? error.message : "保存失败");
    }
  }

  async function sendReset(email: string) {
    try {
      await request("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-reset", email }),
      });
      announce("密码重置链接已发送；系统不会显示或保存明文密码。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "发送失败");
    }
  }

  async function setTemporaryPassword(id: number) {
    const password = window.prompt(
      "输入一次性临时密码（至少 10 位）。保存后不会再次显示，员工首次登录后必须修改。",
    );
    if (!password) return;
    await patch({ action: "staff", id, temporaryPassword: password });
  }

  async function setCustomerTemporaryPassword(email: string) {
    const password = window.prompt(
      "输入客户的一次性临时密码（至少 12 位）。保存后不会再次显示，客户登录后必须立即修改。",
    );
    if (!password) return;
    try {
      await request("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "temporary-customer",
          email,
          temporaryPassword: password,
        }),
      });
      announce("客户临时密码已加密保存，所有旧登录会话已失效。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "设置失败");
    }
  }

  const statuses = [
    ["waiting", "等待对接"],
    ["active", "沟通中"],
    ["closed", "已完成"],
    ["unanswered", "未回复"],
    ["all", "全部"],
  ];

  return (
    <div className="grid min-h-[760px] gap-4 lg:h-full lg:min-h-0 lg:grid-rows-[auto_1fr]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-600">统一客服工作台</p>
          <h1 className="mt-1 text-2xl font-semibold">客户会话与销售分配</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              Notification.requestPermission().then(() =>
                announce("浏览器消息提醒设置已更新。"),
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold shadow-sm"
          >
            <Bell size={16} /> 消息提醒
          </button>
          {(role === "owner" || role === "support") && (
            <button
              type="button"
              onClick={() => setSettingsOpen((value) => !value)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#111b31] px-4 text-sm font-semibold text-white"
            >
              <Settings2 size={16} /> 客服设置
            </button>
          )}
        </div>
      </div>

      {settingsOpen ? (
        <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 lg:grid-cols-2">
          <div>
            <h2 className="font-semibold">销售与客服账号</h2>
            <div className="mt-3 grid gap-2">
              {staff.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-semibold">{item.displayName}</p>
                    <p className="text-xs text-slate-500">{item.email} · {item.role === "support" ? "客服主管" : item.role === "sales" ? "销售" : "管理员"} · {item.presence === "online" ? "在线" : "离线"}</p>
                  </div>
                  {role === "owner" && item.role !== "owner" ? (
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => void sendReset(item.email)} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">发送重置链接</button>
                      <button onClick={() => void setTemporaryPassword(item.id)} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">临时密码</button>
                      <button
                        onClick={() =>
                          void patch({
                            action: "staff",
                            id: item.id,
                            active: !item.active,
                          })
                        }
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                      >
                        {item.active ? "已启用" : "已停用"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {role === "owner" ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <input className={field} placeholder="姓名" value={staffForm.displayName} onChange={(e) => setStaffForm((v) => ({ ...v, displayName: e.target.value }))} />
                <input className={field} type="email" placeholder="邮箱" value={staffForm.email} onChange={(e) => setStaffForm((v) => ({ ...v, email: e.target.value }))} />
                <select className={field} value={staffForm.role} onChange={(e) => setStaffForm((v) => ({ ...v, role: e.target.value as "sales" | "support" }))}><option value="sales">销售</option><option value="support">客服主管</option></select>
                <input className={field} type="password" placeholder="一次性临时密码（至少 12 位）" value={staffForm.password} onChange={(e) => setStaffForm((v) => ({ ...v, password: e.target.value }))} />
                <button onClick={() => void createStaff()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white sm:col-span-2"><UserPlus size={16} />创建账号</button>
              </div>
            ) : null}
          </div>
          <div>
            <h2 className="font-semibold">快捷回复</h2>
            <div className="mt-3 flex flex-wrap gap-2">{replies.map((item) => <button key={item.id} onClick={() => setDraft(item.body)} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{item.title}</button>)}</div>
            <div className="mt-4 grid gap-2">
              <input className={field} placeholder="快捷回复名称" value={replyForm.title} onChange={(e) => setReplyForm((v) => ({ ...v, title: e.target.value }))} />
              <textarea className={`${field} min-h-24 py-2`} placeholder="回复内容" value={replyForm.body} onChange={(e) => setReplyForm((v) => ({ ...v, body: e.target.value }))} />
              <button onClick={() => void createReply()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"><Plus size={16} />保存快捷回复</button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[310px_minmax(0,1fr)_290px]">
        <aside className="border-b border-slate-200 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 bg-white p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索客户、主题或消息" className={`${field} pl-9`} />
            </div>
            <div className="mt-2 flex gap-1 overflow-x-auto">
              {statuses.map(([id, label]) => (
                <button key={id} onClick={() => setStatus(id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${status === id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="p-2">
            {conversations.map((item) => (
              <button key={item.id} onClick={() => { setSelectedId(item.id); setTags(item.tags.join(", ")); }} className={`mb-1 w-full rounded-lg p-3 text-left ${selectedId === item.id ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                <span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{item.customerName || item.customerEmail}</strong>{item.staffUnread ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">{item.staffUnread}</span> : null}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{item.lastMessage || "暂无消息"}</span>
                <span className="mt-2 flex items-center justify-between text-[11px] text-slate-400"><span>{item.assignedName || "未分配"}</span><span>{stamp(item.updatedAt)}</span></span>
              </button>
            ))}
            {!conversations.length ? <p className="p-6 text-center text-sm text-slate-500">没有符合条件的会话。</p> : null}
          </div>
        </aside>

        <section className="flex min-h-[620px] min-w-0 flex-col lg:min-h-0">
          {selected ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div><h2 className="font-semibold">{selected.customerName}</h2><p className="text-xs text-slate-500">{selected.customerEmail} · {selected.subject}</p></div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <select
                    value={selected.status}
                    onChange={(event) =>
                      void changeConversationStatus(
                        selected.id,
                        event.target.value as "waiting" | "active" | "closed",
                      )
                    }
                    className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    aria-label="会话状态"
                  >
                    <option value="waiting">等待对接</option>
                    <option value="active">沟通中</option>
                    <option value="closed">已完成</option>
                  </select>
                  {selected.status === "closed" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void changeConversationStatus(selected.id, "active")
                      }
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-50 px-4 text-sm font-semibold text-amber-700"
                    >
                      <RotateCcw size={16} />
                      重新打开
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void changeConversationStatus(selected.id, "closed")
                      }
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"
                    >
                      <CheckCircle2 size={16} />
                      标记已完成
                    </button>
                  )}
                </div>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {messages.map((message) => {
                  const staffMessage = message.senderType === "staff";
                  return (
                    <div key={message.id} className={`flex ${staffMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${staffMessage ? "bg-blue-600 text-white" : "bg-white"}`}>
                        <p className={`mb-1 text-[10px] ${staffMessage ? "text-white/65" : "text-slate-400"}`}>{message.senderName}</p>
                        {message.attachment ? message.attachment.isImage ? (
                          <a href={message.attachment.downloadUrl} target="_blank" rel="noreferrer"><Image unoptimized src={message.attachment.downloadUrl} alt={message.attachment.originalName} width={420} height={280} className="max-h-64 rounded-lg object-contain" /></a>
                        ) : (
                          <a href={message.attachment.downloadUrl} className="flex items-center gap-2 rounded-lg bg-black/5 p-2"><FileText size={18} /><span className="truncate">{message.attachment.originalName}</span></a>
                        ) : null}
                        {message.body ? <p className="whitespace-pre-wrap leading-6">{message.body}</p> : null}
                        <p className={`mt-1 text-right text-[9px] ${staffMessage ? "text-white/55" : "text-slate-400"}`}>{stamp(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                {!messages.length ? <div className="grid h-full place-items-center text-sm text-slate-500"><div className="text-center"><MessageCircle className="mx-auto mb-2" />暂无消息</div></div> : null}
              </div>
              <div className="border-t border-slate-200 p-3">
                {replies.length ? <div className="mb-2 flex gap-2 overflow-x-auto">{replies.map((item) => <button key={item.id} type="button" onClick={() => setDraft(item.body)} className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">{item.title}</button>)}</div> : null}
                <div className="flex items-end gap-2">
                  <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.csv,.docx,.xlsx" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} />
                  <button onClick={() => fileRef.current?.click()} className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100"><Paperclip size={17} /></button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        if (draft.trim() && !sending) void send();
                      }
                    }}
                    rows={1}
                    maxLength={6000}
                    className={`${field} min-h-10 resize-none py-2.5`}
                    placeholder="输入回复…"
                    aria-describedby="support-send-shortcut"
                  />
                  <button onClick={() => void send()} disabled={!draft.trim() || sending} className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white disabled:opacity-40"><Send size={17} /></button>
                </div>
                <p
                  id="support-send-shortcut"
                  className="mt-1.5 pl-12 text-[11px] text-slate-400"
                >
                  按 Enter 发送，按 Shift + Enter 换行
                </p>
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center text-center text-slate-500"><div><Users size={44} className="mx-auto mb-3" /><p>从左侧选择客户会话。</p></div></div>
          )}
        </section>

        <aside className="border-t border-slate-200 p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
          {selected ? (
            <div className="grid gap-5">
              <section>
                <h3 className="text-sm font-semibold">分配销售</h3>
                <select disabled={role === "sales"} value={selected.assignedAdminId ?? ""} onChange={(event) => void patch({ action: "assign", conversationId: selected.id, toAdminId: Number(event.target.value) })} className={`${field} mt-2`}>
                  <option value="">选择接入人员</option>
                  {staff.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.displayName} · {item.presence === "online" ? "在线" : "离线"}</option>)}
                </select>
              </section>
              <section>
                <h3 className="text-sm font-semibold">客户标签</h3>
                <input value={tags} onChange={(event) => setTags(event.target.value)} onBlur={() => void patch({ action: "tags", conversationId: selected.id, tags: tags.split(",").map((item) => item.trim()) })} className={`${field} mt-2`} placeholder="批发, OEM, 重点客户" />
              </section>
              <section>
                <h3 className="text-sm font-semibold">内部备注</h3>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} className={`${field} mt-2 min-h-24 py-2`} placeholder="仅客服和销售可见" />
                <button onClick={() => void addNote()} className="mt-2 min-h-9 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white">保存备注</button>
                <div className="mt-3 grid gap-2">{notes.map((item) => <article key={item.id} className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900"><p>{item.body}</p><p className="mt-1 text-[10px] opacity-60">{item.authorName} · {stamp(item.createdAt)}</p></article>)}</div>
              </section>
              {role === "owner" ? (
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => void sendReset(selected.customerEmail)}
                    className="min-h-10 rounded-lg bg-blue-50 text-sm font-semibold text-blue-700"
                  >
                    向客户发送密码重置链接
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void setCustomerTemporaryPassword(selected.customerEmail)
                    }
                    className="min-h-10 rounded-lg bg-amber-50 text-sm font-semibold text-amber-700"
                  >
                    设置客户一次性临时密码
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">选择会话后查看分配、标签和内部备注。</p>
          )}
        </aside>
      </div>
    </div>
  );
}

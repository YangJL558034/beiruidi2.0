"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileText,
  LogOut,
  Menu,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import { customerFetch } from "@/lib/customer-fetch";
import { withLocale } from "@/lib/i18n";
import type {
  CustomerAccount,
  SupportConversation,
  SupportMessage,
} from "@/lib/support-types";

function time(value: string, locale: "cn" | "en") {
  return new Date(value).toLocaleString(locale === "cn" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerCenter() {
  const locale = useLocale();
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState(0);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = conversations.find((item) => item.id === selectedId);

  async function refreshConversations(selectFirst = false) {
    const response = await customerFetch("/api/customer/conversations");
    if (!response.ok) return;
    const data = await response.json();
    setConversations(data.conversations ?? []);
    if (selectFirst && data.conversations?.length)
      setSelectedId(data.conversations[0].id);
  }

  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/auth/session")
      .then((response) => response.json())
      .then(async (data) => {
        if (!active) return;
        if (!data.authenticated) {
          window.location.replace(withLocale("/account/login", locale));
          return;
        }
        if (data.customer?.mustChangePassword) {
          window.location.replace(
            withLocale("/account/change-password", locale),
          );
          return;
        }
        setCustomer(data.customer);
        await refreshConversations(true);
        setLoading(false);
      })
      .catch(() => setNotice("无法连接客户中心。"));
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!selectedId) return;
    let source: EventSource | null = null;
    customerFetch(`/api/customer/conversations/${selectedId}/messages`)
      .then((response) => response.json())
      .then((data) => {
        const initial: SupportMessage[] = data.messages ?? [];
        setMessages(initial);
        const after = initial.at(-1)?.id ?? 0;
        source = new EventSource(
          `/api/customer/conversations/${selectedId}/events?after=${after}`,
        );
        source.addEventListener("message", (event) => {
          const message = JSON.parse((event as MessageEvent).data);
          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
              : [...current, message],
          );
          void refreshConversations();
        });
      });
    return () => source?.close();
  }, [selectedId]);

  async function startConversation() {
    const response = await customerFetch("/api/customer/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: locale === "cn" ? "产品咨询" : "Product inquiry",
      }),
    });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error);
    await refreshConversations();
    setSelectedId(data.conversation.id);
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim() || !selectedId) return;
    setSending(true);
    const response = await customerFetch(
      `/api/customer/conversations/${selectedId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      },
    );
    const data = await response.json();
    if (response.ok) {
      setDraft("");
      if (data.message)
        setMessages((current) =>
          current.some((item) => item.id === data.message.id)
            ? current
            : [...current, data.message],
        );
      await refreshConversations();
    } else setNotice(data.error);
    setSending(false);
  }

  async function upload(file: File) {
    if (!selectedId) return;
    setSending(true);
    const body = new FormData();
    body.set("file", file);
    const response = await customerFetch(
      `/api/customer/conversations/${selectedId}/attachments`,
      { method: "POST", body },
    );
    const data = await response.json();
    if (response.ok && data.message)
      setMessages((current) => [...current, data.message]);
    else setNotice(data.error);
    setSending(false);
  }

  async function logout() {
    await customerFetch("/api/customer/auth/logout", { method: "POST" });
    window.location.href = withLocale("/", locale);
  }

  async function removeAccount() {
    if (!customer) return;
    const normalizedConfirmation = deleteConfirmation.trim().toLowerCase();
    if (normalizedConfirmation !== customer.email.trim().toLowerCase()) {
      setNotice(
        locale === "cn"
          ? "输入的邮箱与当前账号不一致，请完整输入后再删除。"
          : "The email does not match this account. Enter it in full and try again.",
      );
      return;
    }
    setDeleting(true);
    setNotice("");
    try {
      const response = await customerFetch("/api/customer/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: normalizedConfirmation }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.error ||
            (locale === "cn"
              ? "账号删除失败，请稍后重试。"
              : "Account deletion failed. Please try again."),
        );
      window.location.replace(withLocale("/", locale));
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : locale === "cn"
            ? "账号删除失败，请稍后重试。"
            : "Account deletion failed. Please try again.",
      );
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  const unread = useMemo(
    () => conversations.reduce((total, item) => total + item.customerUnread, 0),
    [conversations],
  );

  if (loading)
    return (
      <main className="min-h-screen bg-[#f5f5f7]">
        <SiteHeader />
        <div className="mx-auto max-w-6xl animate-pulse px-5 py-16">
          <div className="h-[620px] rounded-[28px] bg-black/10" />
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#eef1f6] text-[#1d1d1f]">
      <SiteHeader />
      <div className="mx-auto flex max-w-[1500px] flex-col p-3 sm:p-5 lg:h-[calc(100dvh-44px)]">
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="grid size-10 place-items-center rounded-xl bg-[#f5f5f7] lg:hidden"
              aria-label={locale === "cn" ? "打开会话列表" : "Open conversation list"}
            >
              <Menu size={18} />
            </button>
            <span className="grid size-10 place-items-center rounded-xl bg-[#0071e3] text-white">
              <MessageCircle size={20} />
            </span>
            <div>
              <p className="font-semibold">
                {locale === "cn" ? "在线客服中心" : "Live support center"}
              </p>
              <p className="text-xs text-[#6e6e73]">
                {customer?.email} · {unread} {locale === "cn" ? "条未读" : "unread"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/customer/data"
              className="grid size-10 place-items-center rounded-xl bg-[#f5f5f7]"
              title={locale === "cn" ? "导出本人数据" : "Export my data"}
            >
              <Download size={17} />
            </a>
            <button
              type="button"
              onClick={() => void logout()}
              className="grid size-10 place-items-center rounded-xl bg-[#f5f5f7]"
              title={locale === "cn" ? "退出登录" : "Sign out"}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {notice ? (
          <div className="mb-3 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {notice}
            <button onClick={() => setNotice("")}><X size={16} /></button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-hidden rounded-[24px] bg-white shadow-sm lg:grid lg:grid-cols-[330px_1fr]">
          <aside
            className={`${sidebarOpen ? "fixed inset-0 z-50 block p-4" : "hidden"} border-r border-black/[0.06] bg-white lg:static lg:block lg:p-0`}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] p-4">
              <div>
                <h2 className="font-semibold">{locale === "cn" ? "全部会话" : "Conversations"}</h2>
                <p className="mt-1 text-xs text-[#6e6e73]">{conversations.length} {locale === "cn" ? "个历史会话" : "total"}</p>
              </div>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg bg-[#eef5ff] text-[#0071e3]"
                onClick={() => void startConversation()}
                aria-label={locale === "cn" ? "新建会话" : "New conversation"}
              >
                <Plus size={17} />
              </button>
            </div>
            <div className="max-h-[calc(100dvh-150px)] overflow-y-auto p-2">
              {conversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`mb-1 w-full rounded-xl p-3 text-left ${
                    selectedId === item.id ? "bg-[#eef5ff]" : "hover:bg-[#f5f5f7]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{item.subject || (locale === "cn" ? "产品咨询" : "Product inquiry")}</span>
                    {item.customerUnread ? (
                      <span className="grid min-w-5 place-items-center rounded-full bg-[#0071e3] px-1.5 text-xs text-white">{item.customerUnread}</span>
                    ) : null}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#6e6e73]">{item.lastMessage || (locale === "cn" ? "还没有消息" : "No messages yet")}</span>
                  <span className="mt-2 block text-[11px] text-[#86868b]">{time(item.updatedAt, locale)}</span>
                </button>
              ))}
              {!conversations.length ? (
                <div className="p-5 text-center text-sm text-[#6e6e73]">
                  <p>{locale === "cn" ? "还没有会话。" : "No conversations yet."}</p>
                  <button onClick={() => void startConversation()} className="mt-3 font-semibold text-[#0071e3]">
                    {locale === "cn" ? "立即咨询" : "Start a chat"}
                  </button>
                </div>
              ) : null}
            </div>
          </aside>

          <section className="flex min-h-[650px] flex-col lg:min-h-0">
            {selected ? (
              <>
                <header className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
                  <div>
                    <h2 className="font-semibold">{selected.subject}</h2>
                    <p className="mt-1 text-xs text-[#6e6e73]">
                      {selected.assignedName ||
                        (locale === "cn" ? "等待客服接入" : "Waiting for an agent")} ·{" "}
                      {selected.status === "closed"
                        ? locale === "cn" ? "已完成" : "Completed"
                        : locale === "cn" ? "进行中" : "Open"}
                    </p>
                  </div>
                  <ShieldCheck size={20} className="text-emerald-600" />
                </header>
                <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7f8fa] p-4 sm:p-6">
                  {messages.map((message) => {
                    const mine = message.senderType === "customer";
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${mine ? "bg-[#0071e3] text-white" : "bg-white"}`}>
                          <p className={`mb-1 text-[11px] ${mine ? "text-white/65" : "text-[#86868b]"}`}>{message.senderName}</p>
                          {message.attachment ? (
                            <div>
                              {message.attachment.isImage ? (
                                <a href={message.attachment.downloadUrl} target="_blank" rel="noreferrer" className="block">
                                  <Image unoptimized src={message.attachment.downloadUrl} alt={message.attachment.originalName} width={520} height={360} className="max-h-80 w-auto rounded-xl object-contain" />
                                </a>
                              ) : (
                                <a href={message.attachment.downloadUrl} className={`flex items-center gap-3 rounded-xl p-3 ${mine ? "bg-white/12" : "bg-[#f5f5f7]"}`}>
                                  <FileText size={24} />
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold">{message.attachment.originalName}</span>
                                    <span className="text-xs opacity-70">{Math.ceil(message.attachment.size / 1024)} KB</span>
                                  </span>
                                </a>
                              )}
                            </div>
                          ) : null}
                          {message.body ? <p className="whitespace-pre-wrap leading-6">{message.body}</p> : null}
                          <p className={`mt-2 text-right text-[10px] ${mine ? "text-white/55" : "text-[#86868b]"}`}>{time(message.createdAt, locale)}</p>
                        </div>
                      </div>
                    );
                  })}
                  {!messages.length ? (
                    <div className="grid h-full min-h-80 place-items-center text-center text-[#6e6e73]">
                      <div><MessageCircle className="mx-auto mb-3" /><p>{locale === "cn" ? "发送第一条消息，客服会尽快接入。" : "Send a message and our team will respond shortly."}</p></div>
                    </div>
                  ) : null}
                </div>
                <form onSubmit={sendMessage} className="border-t border-black/[0.06] bg-white p-3 sm:p-4">
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.csv,.docx,.xlsx"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void upload(file);
                        event.currentTarget.value = "";
                      }}
                    />
                    <button type="button" onClick={() => fileRef.current?.click()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f5f5f7]" aria-label={locale === "cn" ? "上传附件" : "Attach file"}><Paperclip size={19} /></button>
                    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={6000} rows={1} placeholder={locale === "cn" ? "输入消息…" : "Write a message…"} className="min-h-11 flex-1 resize-none rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[#0071e3]" />
                    <button disabled={sending || !draft.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0071e3] text-white disabled:opacity-40" aria-label={locale === "cn" ? "发送消息" : "Send message"}><Send size={18} /></button>
                  </div>
                  <p className="mt-2 text-[11px] text-[#86868b]">{locale === "cn" ? "支持图片、PDF、TXT、CSV、DOCX、XLSX，单个文件不超过 10MB。" : "Images, PDF, TXT, CSV, DOCX and XLSX up to 10MB."}</p>
                </form>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <MessageCircle size={44} className="mx-auto text-[#0071e3]" />
                  <h2 className="mt-5 text-2xl font-semibold">{locale === "cn" ? "开始在线咨询" : "Start a support chat"}</h2>
                  <button onClick={() => void startConversation()} className="mt-6 min-h-11 rounded-full bg-[#0071e3] px-6 font-semibold text-white">{locale === "cn" ? "新建会话" : "New conversation"}</button>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-xs text-[#6e6e73]">
          <span>{locale === "cn" ? "你的聊天与附件仅对本人和获授权客服可见。" : "Only you and authorized support staff can access your chats and files."}</span>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmation("");
              setNotice("");
              setDeleteOpen(true);
            }}
            className="inline-flex items-center gap-2 text-rose-600"
          >
            <Trash2 size={14} />
            {locale === "cn" ? "删除账号和数据" : "Delete account and data"}
          </button>
        </div>
      </div>

      {deleteOpen && customer ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-rose-600">
                  {locale === "cn" ? "不可撤销操作" : "Permanent action"}
                </p>
                <h2
                  id="delete-account-title"
                  className="mt-2 text-2xl font-semibold"
                >
                  {locale === "cn"
                    ? "永久删除账号和全部数据"
                    : "Permanently delete account and data"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f5f7] disabled:opacity-40"
                aria-label={locale === "cn" ? "关闭" : "Close"}
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6e6e73]">
              {locale === "cn"
                ? "账号、采购清单、全部会话和附件将被永久删除。为避免误操作，请输入当前账号邮箱确认。"
                : "Your account, inquiry list, conversations, and attachments will be permanently deleted. Enter the current account email to confirm."}
            </p>
            <label className="mt-5 block text-sm font-semibold" htmlFor="delete-account-confirmation">
              {locale === "cn" ? "请输入当前邮箱" : "Enter your current email"}
            </label>
            <input
              id="delete-account-confirmation"
              type="email"
              autoComplete="off"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={customer.email}
              className="mt-2 min-h-12 w-full rounded-xl border border-black/10 px-4 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
            />
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="min-h-12 rounded-xl border border-black/10 font-semibold disabled:opacity-40"
              >
                {locale === "cn" ? "取消" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => void removeAccount()}
                disabled={
                  deleting ||
                  deleteConfirmation.trim().toLowerCase() !==
                    customer.email.trim().toLowerCase()
                }
                className="min-h-12 rounded-xl bg-rose-600 px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting
                  ? locale === "cn"
                    ? "正在删除…"
                    : "Deleting…"
                  : locale === "cn"
                    ? "确认永久删除"
                    : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

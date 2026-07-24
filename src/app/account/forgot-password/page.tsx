"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomerAuthShell } from "@/components/customer/CustomerAuthShell";
import { useLocale } from "@/components/LocaleProvider";
import { withLocale } from "@/lib/i18n";

export default function CustomerForgotPasswordPage() {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/customer/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    const data = await response.json();
    setNotice(data.message || data.error);
    setBusy(false);
  }
  return (
    <CustomerAuthShell
      title={locale === "cn" ? "重置密码" : "Reset password"}
      subtitle={
        locale === "cn"
          ? "重置链接将在 30 分钟后失效，使用后立即作废。"
          : "Reset links expire after 30 minutes and can only be used once."
      }
    >
      <form onSubmit={submit} className="grid gap-5">
        <label className="grid gap-2 text-sm font-semibold">
          {locale === "cn" ? "注册邮箱" : "Account email"}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 rounded-xl border border-black/10 px-4 outline-none focus:border-[#0071e3]"
          />
        </label>
        {notice ? (
          <p className="rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm">{notice}</p>
        ) : null}
        <button
          disabled={busy}
          className="min-h-12 rounded-xl bg-[#0071e3] font-semibold text-white"
        >
          {locale === "cn" ? "发送重置链接" : "Send reset link"}
        </button>
        <Link
          href={withLocale("/account/login", locale)}
          className="text-center text-sm font-semibold text-[#0071e3]"
        >
          {locale === "cn" ? "返回登录" : "Back to sign in"}
        </Link>
      </form>
    </CustomerAuthShell>
  );
}

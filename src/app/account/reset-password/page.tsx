"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomerAuthShell } from "@/components/customer/CustomerAuthShell";
import { useLocale } from "@/components/LocaleProvider";
import { withLocale } from "@/lib/i18n";

export default function CustomerResetPasswordPage() {
  const locale = useLocale();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setNotice(locale === "cn" ? "两次输入的密码不一致。" : "Passwords do not match.");
      return;
    }
    const response = await fetch("/api/customer/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: new URLSearchParams(window.location.search).get("token"),
        password,
      }),
    });
    const data = await response.json();
    setNotice(
      response.ok
        ? locale === "cn"
          ? "密码已更新，请重新登录。"
          : "Password updated. Please sign in again."
        : data.error,
    );
    setDone(response.ok);
  }
  return (
    <CustomerAuthShell
      title={locale === "cn" ? "设置新密码" : "Choose a new password"}
      subtitle={
        locale === "cn"
          ? "新密码至少 10 位，保存后所有旧登录会话都会失效。"
          : "Use at least 10 characters. Existing sessions are revoked after reset."
      }
    >
      {done ? (
        <div className="grid gap-5">
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
            {notice}
          </p>
          <Link
            href={withLocale("/account/login", locale)}
            className="grid min-h-12 place-items-center rounded-xl bg-[#0071e3] font-semibold text-white"
          >
            {locale === "cn" ? "前往登录" : "Sign in"}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-5">
          {["password", "confirm"].map((key) => (
            <label key={key} className="grid gap-2 text-sm font-semibold">
              {key === "password"
                ? locale === "cn"
                  ? "新密码"
                  : "New password"
                : locale === "cn"
                  ? "再次输入"
                  : "Confirm password"}
              <input
                type="password"
                minLength={10}
                required
                value={key === "password" ? password : confirm}
                onChange={(event) =>
                  key === "password"
                    ? setPassword(event.target.value)
                    : setConfirm(event.target.value)
                }
                className="min-h-12 rounded-xl border border-black/10 px-4 outline-none focus:border-[#0071e3]"
              />
            </label>
          ))}
          {notice ? (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {notice}
            </p>
          ) : null}
          <button className="min-h-12 rounded-xl bg-[#0071e3] font-semibold text-white">
            {locale === "cn" ? "保存新密码" : "Save new password"}
          </button>
        </form>
      )}
    </CustomerAuthShell>
  );
}

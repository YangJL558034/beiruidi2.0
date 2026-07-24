"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerAuthShell } from "@/components/customer/CustomerAuthShell";
import { useLocale } from "@/components/LocaleProvider";
import { customerFetch } from "@/lib/customer-fetch";
import { withLocale } from "@/lib/i18n";

export default function CustomerChangePasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirm)
      return setError(
        locale === "cn" ? "两次输入的新密码不一致。" : "Passwords do not match.",
      );
    const response = await customerFetch(
      "/api/customer/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    );
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    router.replace(withLocale("/account", locale));
    router.refresh();
  }
  return (
    <CustomerAuthShell
      title={locale === "cn" ? "修改临时密码" : "Replace temporary password"}
      subtitle={
        locale === "cn"
          ? "为了保护聊天记录，使用管理员设置的一次性密码登录后必须立即设置自己的密码。"
          : "For your security, replace the one-time password before accessing conversations."
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        {[
          [
            locale === "cn" ? "当前临时密码" : "Temporary password",
            currentPassword,
            setCurrentPassword,
          ],
          [locale === "cn" ? "新密码" : "New password", newPassword, setNewPassword],
          [locale === "cn" ? "再次输入" : "Confirm password", confirm, setConfirm],
        ].map(([label, value, setter]) => (
          <label key={String(label)} className="grid gap-2 text-sm font-semibold">
            {String(label)}
            <input
              type="password"
              required
              minLength={10}
              value={String(value)}
              onChange={(event) =>
                (setter as React.Dispatch<React.SetStateAction<string>>)(
                  event.target.value,
                )
              }
              className="min-h-12 rounded-xl border border-black/10 px-4 outline-none focus:border-[#0071e3]"
            />
          </label>
        ))}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="min-h-12 rounded-xl bg-[#0071e3] font-semibold text-white">
          {locale === "cn" ? "保存并进入客户中心" : "Save and continue"}
        </button>
      </form>
    </CustomerAuthShell>
  );
}

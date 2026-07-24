"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirm) return setError("两次输入的新密码不一致。");
    const response = await adminFetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    router.replace("/admin");
    router.refresh();
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f6fb] p-5">
      <form
        onSubmit={submit}
        className="grid w-full max-w-lg gap-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-xl"
      >
        <div>
          <p className="text-sm font-semibold text-blue-600">账号安全</p>
          <h1 className="mt-1 text-2xl font-semibold">修改一次性临时密码</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            新密码至少 12 位。系统只保存加密结果，任何管理员都无法查看明文密码。
          </p>
        </div>
        {[
          ["当前临时密码", currentPassword, setCurrentPassword],
          ["新密码", newPassword, setNewPassword],
          ["再次输入新密码", confirm, setConfirm],
        ].map(([label, value, setter]) => (
          <label key={String(label)} className="grid gap-2 text-sm font-semibold">
            {String(label)}
            <input
              type="password"
              required
              minLength={12}
              value={String(value)}
              onChange={(event) =>
                (setter as React.Dispatch<React.SetStateAction<string>>)(
                  event.target.value,
                )
              }
              className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
            />
          </label>
        ))}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="min-h-12 rounded-xl bg-blue-600 font-semibold text-white">
          保存并进入后台
        </button>
      </form>
    </main>
  );
}

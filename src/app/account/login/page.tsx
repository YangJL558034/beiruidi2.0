"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { CustomerAuthShell } from "@/components/customer/CustomerAuthShell";
import { useLocale } from "@/components/LocaleProvider";
import { withLocale } from "@/lib/i18n";

const field =
  "min-h-12 w-full rounded-xl border border-black/10 bg-white px-4 outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10";

export default function CustomerLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function requestCode() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/customer/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login", locale }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice(data.message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "发送失败");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/customer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const next = new URLSearchParams(window.location.search).get("next");
      const localizedPrefix = `/${locale}/`;
      router.push(
        next &&
          (next === `/${locale}` || next.startsWith(localizedPrefix)) &&
          !next.startsWith(`/${locale}/admin`)
          ? next
          : withLocale("/account", locale),
      );
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomerAuthShell
      mode="login"
      title={locale === "cn" ? "欢迎回来，继续沟通" : "Welcome back"}
      subtitle={
        locale === "cn"
          ? "登录后查看历史消息、采购清单、报价与专属文件。"
          : "Sign in to view messages, inquiry lists, quotes, and private files."
      }
    >
      <div className="mb-7">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em]">
          {locale === "cn" ? "登录账户" : "Sign in"}
        </h2>
        <p className="mt-2 text-sm text-[#6e6e73]">
          {locale === "cn"
            ? "登录后继续与我们的销售团队沟通"
            : "Continue your conversation with our sales team"}
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">
          {locale === "cn" ? "邮箱" : "Email"}
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={field}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {locale === "cn" ? "密码" : "Password"}
          <span className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#86868b]"
              aria-label={
                showPassword
                  ? locale === "cn"
                    ? "隐藏密码"
                    : "Hide password"
                  : locale === "cn"
                    ? "显示密码"
                    : "Show password"
              }
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {locale === "cn" ? "邮箱验证码" : "Email verification code"}
          <span className="flex gap-2">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={field}
            />
            <button
              type="button"
              disabled={busy || !email}
              onClick={() => void requestCode()}
              className="min-h-12 shrink-0 rounded-xl bg-[#eef5ff] px-4 text-sm font-semibold text-[#0071e3] disabled:opacity-50"
            >
              {locale === "cn" ? "发送验证码" : "Send code"}
            </button>
          </span>
        </label>
        {notice ? (
          <p role="status" className="rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm">
            {notice}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-xl bg-[#0071e3] font-semibold text-white disabled:opacity-60"
        >
          {busy
            ? locale === "cn"
              ? "处理中…"
              : "Working…"
            : locale === "cn"
              ? "登录客户中心"
              : "Sign in"}
        </button>
        <div className="flex flex-wrap justify-between gap-3 text-sm">
          <Link
            href={withLocale("/account/register", locale)}
            onClick={(event) => {
              const next = new URLSearchParams(window.location.search).get(
                "next",
              );
              if (
                next &&
                (next === `/${locale}` || next.startsWith(`/${locale}/`)) &&
                !next.startsWith(`/${locale}/admin`)
              ) {
                event.preventDefault();
                router.push(
                  `${withLocale("/account/register", locale)}?next=${encodeURIComponent(next)}`,
                );
              }
            }}
            className="font-semibold text-[#0071e3]"
          >
            {locale === "cn" ? "创建新账号" : "Create account"}
          </Link>
          <Link
            href={withLocale("/account/forgot-password", locale)}
            className="text-[#6e6e73] hover:text-[#0071e3]"
          >
            {locale === "cn" ? "忘记密码" : "Forgot password"}
          </Link>
        </div>
        <div className="mt-2 flex items-center gap-3 border-t border-black/[0.08] pt-5 text-xs leading-5 text-[#6e6e73]">
          <ShieldCheck size={19} className="shrink-0 text-[#4f5968]" />
          {locale === "cn"
            ? "账号、聊天记录和采购清单均经过加密鉴权保护"
            : "Your account, chats, and inquiry list are protected by authenticated access"}
        </div>
      </form>
    </CustomerAuthShell>
  );
}

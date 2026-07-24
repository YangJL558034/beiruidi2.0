"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { CustomerAuthShell } from "@/components/customer/CustomerAuthShell";
import { useLocale } from "@/components/LocaleProvider";
import { withLocale } from "@/lib/i18n";

const field =
  "min-h-12 w-full rounded-xl border border-black/10 px-4 outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10";

export default function CustomerRegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    captcha: "",
    consent: false,
  });
  const [captcha, setCaptcha] = useState({ id: "", image: "" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const patch = (value: Partial<typeof form>) =>
    setForm((current) => ({ ...current, ...value }));

  const loadCaptcha = useCallback(async (showError = true) => {
    try {
      const response = await fetch("/api/auth/captcha?mode=numeric", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCaptcha({ id: String(data.id ?? ""), image: String(data.image ?? "") });
      setForm((current) => ({ ...current, captcha: "" }));
    } catch (error) {
      setCaptcha({ id: "", image: "" });
      if (showError)
        setNotice(
          error instanceof Error
            ? error.message
            : locale === "cn"
              ? "验证码生成失败"
              : "Unable to generate the code",
        );
    }
  }, [locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCaptcha(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCaptcha]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/customer/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, captchaId: captcha.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.refreshCaptcha) await loadCaptcha(false);
        throw new Error(data.error);
      }
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
      setNotice(error instanceof Error ? error.message : "注册失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomerAuthShell
      mode="register"
      title={locale === "cn" ? "注册账户，即刻咨询" : "Create an account"}
      subtitle={
        locale === "cn"
          ? "与专属销售实时沟通，随时查看历史消息与文件。"
          : "Chat with sales and keep your messages, inquiry lists, and files together."
      }
    >
      <div className="mb-7">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em]">
          {locale === "cn" ? "创建账户" : "Create your account"}
        </h2>
        <p className="mt-2 text-sm text-[#6e6e73]">
          {locale === "cn"
            ? "注册后即可与我们的销售团队实时沟通"
            : "Register to start a live conversation with our sales team"}
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">
          {locale === "cn" ? "邮箱地址" : "Email address"}
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => patch({ email: event.target.value })}
            className={field}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {locale === "cn" ? "设置密码" : "Create password"}
          <span className="relative">
            <input
              type={showPassword ? "text" : "password"}
              minLength={10}
              maxLength={512}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(event) => patch({ password: event.target.value })}
              placeholder={
                locale === "cn"
                  ? "至少 10 位字符"
                  : "At least 10 characters"
              }
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
          {locale === "cn" ? "系统数字验证码" : "Security code"}
          <span className="grid grid-cols-[minmax(0,1fr)_160px] gap-2">
            <input
              required
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              pattern="[0-9]{6}"
              value={form.captcha}
              onChange={(event) =>
                patch({
                  captcha: event.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              placeholder={
                locale === "cn" ? "输入右侧 6 位数字" : "Enter 6 digits"
              }
              className={field}
            />
            <button
              type="button"
              onClick={() => void loadCaptcha()}
              className="h-12 overflow-hidden rounded-xl border border-black/10 bg-[#f5f5f7]"
              aria-label={
                locale === "cn"
                  ? "刷新系统数字验证码"
                  : "Refresh security code"
              }
            >
              {captcha.image ? (
                <Image
                  src={captcha.image}
                  alt={
                    locale === "cn"
                      ? "系统数字验证码，点击刷新"
                      : "Security code, click to refresh"
                  }
                  width={160}
                  height={52}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-[#6e6e73]">
                  {locale === "cn" ? "生成中…" : "Generating…"}
                </span>
              )}
            </button>
          </span>
          <span className="text-xs font-normal text-[#86868b]">
            {locale === "cn"
              ? "验证码由系统即时生成，无需接收邮件。"
              : "Generated instantly on this page; no email is required."}
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-[#6e6e73]">
          <input
            type="checkbox"
            required
            checked={form.consent}
            onChange={(event) => patch({ consent: event.target.checked })}
            className="mt-1 size-4 accent-[#0071e3]"
          />
          <span>
            {locale === "cn"
              ? "我已阅读并同意"
              : "I have read and agree to the"}{" "}
            <Link
              href={withLocale("/terms", locale)}
              className="text-[#0071e3]"
            >
              {locale === "cn" ? "用户协议" : "Terms"}
            </Link>
            {locale === "cn" ? "和" : " and "}
            <Link
              href={withLocale("/privacy", locale)}
              className="text-[#0071e3]"
            >
              {locale === "cn" ? "隐私政策" : "Privacy Policy"}
            </Link>
          </span>
        </label>
        {notice ? (
          <p role="status" className="rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm">
            {notice}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !captcha.id}
          className="min-h-12 rounded-xl bg-[#0071e3] font-semibold text-white disabled:opacity-60"
        >
          {locale === "cn" ? "注册并开始咨询" : "Register and start"}
        </button>
        <Link
          href={withLocale("/account/login", locale)}
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
                `${withLocale("/account/login", locale)}?next=${encodeURIComponent(next)}`,
              );
            }
          }}
          className="text-center text-sm font-semibold text-[#0071e3]"
        >
          {locale === "cn" ? "已有账号，返回登录" : "Already registered? Sign in"}
        </Link>
        <div className="flex items-center gap-3 border-t border-black/[0.08] pt-5 text-xs leading-5 text-[#6e6e73]">
          <ShieldCheck size={19} className="shrink-0 text-[#4f5968]" />
          {locale === "cn"
            ? "你的资料、聊天记录和采购清单将被安全加密保存"
            : "Your details, chats, and inquiry list are securely protected"}
        </div>
      </form>
    </CustomerAuthShell>
  );
}

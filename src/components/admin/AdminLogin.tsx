"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MIN_ADMIN_PASSWORD_LENGTH } from "@/lib/security-constants";

function safeNext(value: string | null) {
  return value && value.startsWith("/admin") && !value.startsWith("//")
    ? value
    : "/admin";
}

export function AdminLogin() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<{ id: string; image: string }>({
    id: "",
    image: "",
  });

  async function loadCaptcha(showError = true) {
    try {
      const response = await fetch("/api/auth/captcha", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (
        !response.ok ||
        typeof data?.id !== "string" ||
        typeof data?.image !== "string"
      ) {
        throw new Error("Invalid captcha response.");
      }
      setCaptcha({ id: data.id, image: data.image });
      return true;
    } catch {
      if (showError) {
        setError("验证码加载失败，请检查网络后刷新页面重试。");
      }
      return false;
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCaptcha();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setError("");
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          captcha: form.get("captcha"),
          captchaId: captcha.id,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const responseError =
          typeof data?.error === "string"
            ? data.error
            : "登录失败，请刷新页面后重试。";
        setError(responseError);
        if (data?.refreshCaptcha) {
          const captchaRefreshed = await loadCaptcha(false);
          const input = formElement.elements.namedItem(
            "captcha",
          ) as HTMLInputElement | null;
          if (input) input.value = "";
          if (!captchaRefreshed) {
            setError(`${responseError} 验证码刷新失败，请刷新页面重试。`);
          }
        }
        return;
      }
      router.replace(
        data?.mustChangePassword
          ? "/admin/change-password"
          : safeNext(search.get("next")),
      );
      router.refresh();
    } catch {
      setError("网络连接失败，请检查网络后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="管理员登录"
      subtitle="使用管理员邮箱进入 SZA POWER 内容管理系统"
    >
      <form onSubmit={submit} className="grid gap-4">
        <AuthField label="邮箱">
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="请输入管理员邮箱"
            maxLength={254}
          />
        </AuthField>
        <AuthField label="密码">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="请输入密码"
            maxLength={512}
          />
        </AuthField>
        <AuthField label="验证码">
          <div className="grid grid-cols-[1fr_160px] gap-2">
            <input
              name="captcha"
              required
              autoComplete="off"
              inputMode="text"
              maxLength={8}
              placeholder="请输入验证码"
              className="min-w-0 uppercase"
            />
            <button
              type="button"
              onClick={() => void loadCaptcha()}
              className="overflow-hidden rounded-md border border-slate-200 bg-slate-50"
              aria-label="刷新验证码"
            >
              {captcha.image ? (
                <Image
                  src={captcha.image}
                  alt="登录验证码，点击刷新"
                  width={160}
                  height={52}
                  unoptimized
                  className="h-[50px] w-full object-cover"
                />
              ) : (
                <span className="text-sm text-slate-500">生成中...</span>
              )}
            </button>
          </div>
        </AuthField>
        <button
          disabled={loading || !captcha.id}
          className="min-h-12 rounded-md bg-[#2f6df6] text-base font-semibold text-white transition hover:bg-[#245edc] disabled:opacity-60"
        >
          {loading ? "登录中..." : "登录"}
        </button>
        {error ? (
          <p
            className="text-center text-sm leading-6 text-rose-600"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>
      <div className="mt-6 flex justify-between text-sm">
        <Link href="/" className="text-slate-500 hover:text-blue-600">
          返回网站
        </Link>
        <Link
          href="/admin/forgot-password"
          className="font-semibold text-blue-600"
        >
          忘记密码？
        </Link>
      </div>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      if (!response.ok) throw new Error("Password reset request failed.");
      setDone(true);
    } catch {
      setError("暂时无法发送重置链接，请检查网络后重试。");
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthShell
      title="找回密码"
      subtitle="输入管理员邮箱，我们会发送安全的重置链接。"
    >
      {done ? (
        <div className="grid gap-5 text-center">
          <p className="rounded-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
            如果该邮箱是管理员账户，且邮件服务器已配置，重置链接已经发送。
          </p>
          <Link href="/admin/login" className="font-semibold text-blue-600">
            返回登录
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <AuthField label="管理员邮箱">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@sza-power.com"
            />
          </AuthField>
          <button
            disabled={loading}
            className="min-h-12 rounded-md bg-[#2f6df6] text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? "发送中..." : "发送重置链接"}
          </button>
          {error ? (
            <p className="text-center text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPassword() {
  const search = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirm")) {
      setError("两次输入的密码不一致。");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: search.get("token"), password }),
      });
      if (response.ok) {
        setDone(true);
        window.setTimeout(() => router.push("/admin/login"), 1400);
      } else {
        setError(
          (await response.json().catch(() => null))?.error ?? "重置失败。",
        );
      }
    } catch {
      setError("网络连接失败，请检查网络后重试。");
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthShell
      title="设置新密码"
      subtitle={`新密码至少需要 ${MIN_ADMIN_PASSWORD_LENGTH} 个字符。`}
    >
      {done ? (
        <p className="rounded-md bg-emerald-50 p-4 text-center text-sm text-emerald-700">
          密码已更新，正在返回登录页。
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <AuthField label="新密码">
            <input
              name="password"
              type="password"
              required
              minLength={MIN_ADMIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </AuthField>
          <AuthField label="确认新密码">
            <input
              name="confirm"
              type="password"
              required
              minLength={MIN_ADMIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </AuthField>
          <button
            disabled={loading}
            className="min-h-12 rounded-md bg-[#2f6df6] text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? "更新中..." : "更新密码"}
          </button>
          {error ? (
            <p className="text-center text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </AuthShell>
  );
}

function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-[0_28px_80px_rgba(15,23,42,0.12)] sm:p-9">
        <div className="grid size-11 place-items-center rounded-md bg-[#2f6df6] text-lg font-bold text-white">
          S
        </div>
        <p className="mt-7 text-sm font-semibold text-blue-600">
          SZA POWER CMS
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p>
        <div className="mt-8 [&_input]:min-h-12 [&_input]:rounded-md [&_input]:border [&_input]:border-slate-200 [&_input]:px-4 [&_input]:outline-none [&_input]:focus:border-blue-500">
          {children}
        </div>
      </section>
    </main>
  );
}

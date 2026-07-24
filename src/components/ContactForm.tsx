"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { commonText, withLocale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

type FormState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const locale = useLocale();
  const t = commonText[locale];
  const searchParams = useSearchParams();
  const product = searchParams.get("product")?.slice(0, 120) ?? "";
  const inquiryItems =
    searchParams.get("items")?.replace(/\r/g, "").slice(0, 1600) ?? "";
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseBody = (await response.json().catch(() => null)) as {
        code?: string;
      } | null;
      if (!response.ok) {
        const localizedError =
          responseBody?.code === "RATE_LIMITED"
            ? locale === "cn"
              ? "提交过于频繁，请稍后再试。"
              : "Too many submissions. Please try again later."
            : t.inquiryError;
        throw new Error(localizedError);
      }
      form.reset();
      setState("success");
      setMessage(t.inquirySuccess);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : t.inquiryError);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
          {t.name}
          <input
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
          {t.email}
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
          {t.company}
          <input
            name="company"
            maxLength={200}
            autoComplete="organization"
            className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
          {t.country}
          <input
            name="country"
            maxLength={120}
            autoComplete="country-name"
            className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
        {t.projectType}
        <select
          name="projectType"
          className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]"
        >
          <option>{t.retailDistribution}</option>
          <option>{t.oemOdm}</option>
          <option>{t.corporateGifting}</option>
          <option>{t.afterSalesSupport}</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
        {t.message}
        <textarea
          name="message"
          required
          rows={5}
          maxLength={5000}
          defaultValue={
            inquiryItems
              ? locale === "cn"
                ? `商城采购清单：\n${inquiryItems}\n\n请确认价格、库存与交付条件。`
                : `Store inquiry list:\n${inquiryItems}\n\nPlease confirm pricing, availability, and delivery terms.`
              : product
              ? locale === "cn"
                ? `咨询产品：${product}\n\n`
                : `Product inquiry: ${product}\n\n`
              : ""
          }
          className="resize-none rounded-[8px] border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-[#0071e3]"
        />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-[#5f6670]">
        <input
          name="privacyConsent"
          type="checkbox"
          value="accepted"
          required
          className="mt-1 size-4 shrink-0 accent-[#0071e3]"
        />
        <span>
          {locale === "cn"
            ? "我同意本网站按照隐私政策处理本次询盘所需的信息。"
            : "I agree to the processing of information needed for this inquiry as described in the privacy policy."}
          <Link
            href={withLocale("/privacy", locale)}
            className="ml-1 font-semibold text-[#0071e3] hover:underline"
          >
            {locale === "cn" ? "查看隐私政策" : "Read the privacy policy"}
          </Link>
        </span>
      </label>
      <button
        type="submit"
        disabled={state === "loading"}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 text-base font-medium text-white transition hover:bg-[#0077ed] disabled:cursor-wait disabled:opacity-70"
      >
        {state === "loading" ? t.sending : t.submitInquiry}
        {state === "success" ? (
          <CheckCircle2 size={18} />
        ) : (
          <ArrowRight size={18} />
        )}
      </button>
      {message ? (
        <p
          className={`text-sm ${state === "success" ? "text-[#1b7f46]" : "text-[#b42318]"}`}
          role={state === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

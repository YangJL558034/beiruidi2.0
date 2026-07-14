"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { commonText, getLocaleFromPathname } from "@/lib/i18n";

type FormState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = commonText[locale];
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
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Inquiry failed");
      form.reset();
      setState("success");
      setMessage(t.inquirySuccess);
    } catch {
      setState("error");
      setMessage(t.inquiryError);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
          {t.name}
          <input name="name" required maxLength={120} className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
          {t.email}
          <input name="email" type="email" required maxLength={254} className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
          {t.company}
          <input name="company" maxLength={200} className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
          {t.country}
          <input name="country" maxLength={120} className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-[#3e4850]">
        {t.projectType}
        <select name="projectType" className="min-h-12 rounded-[8px] border border-black/10 bg-white px-4 text-base outline-none focus:border-[#0071e3]">
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
          className="resize-none rounded-[8px] border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-[#0071e3]"
        />
      </label>
      <button
        type="submit"
        disabled={state === "loading"}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 text-base font-medium text-white transition hover:bg-[#0077ed] disabled:cursor-wait disabled:opacity-70"
      >
        {state === "loading" ? t.sending : t.submitInquiry}
        {state === "success" ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
      </button>
      {message ? (
        <p className={`text-sm ${state === "success" ? "text-[#1b7f46]" : "text-[#b42318]"}`}>{message}</p>
      ) : null}
    </form>
  );
}

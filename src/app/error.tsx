"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void fetch("/api/telemetry/error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: error.message, stack: error.stack, digest: error.digest, path: window.location.pathname })
    }).catch(() => undefined);
  }, [error]);

  return <main className="grid min-h-screen place-items-center bg-[#f5f5f7] px-5 text-center text-[#1d1d1f]"><div><p className="text-sm font-semibold text-[#6e6e73]">SZA POWER</p><h1 className="mt-3 text-3xl font-semibold">页面暂时无法加载</h1><p className="mt-3 text-[#6e6e73]">请稍后重试。如果问题持续，请联系网站管理员。</p><button type="button" onClick={() => reset()} className="mt-7 min-h-11 rounded-full bg-[#0071e3] px-6 font-medium text-white hover:bg-[#0077ed]">重新加载</button></div></main>;
}
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/telemetry/error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        path: window.location.pathname,
      }),
    }).catch(() => undefined);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          role="alert"
          style={{
            alignItems: "center",
            background: "#f5f5f7",
            color: "#1d1d1f",
            display: "grid",
            fontFamily: "system-ui, sans-serif",
            minHeight: "100vh",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <p>SZA POWER</p>
            <h1>Website temporarily unavailable</h1>
            <p>Please try again in a moment.</p>
            <button type="button" onClick={reset}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body style={{ background: "#070B14", color: "white" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Something went wrong</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", maxWidth: "24rem" }}>
            We&apos;ve logged this error.
          </p>
          <button
            onClick={reset}
            style={{
              borderRadius: "0.75rem",
              padding: "0.625rem 1rem",
              background: "linear-gradient(135deg,#7C3AED,#EC4899)",
              color: "white",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

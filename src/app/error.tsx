"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service here (e.g. Sentry)
    console.error("[Chronos global error]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg)",
      textAlign: "center",
      padding: "2rem",
      gap: "1.5rem",
    }}>
      <Image
        src="/chronos-logo.webp"
        alt="Chronos"
        width={80}
        height={80}
        style={{ mixBlendMode: "screen", opacity: 0.85 }}
      />

      <div style={{
        color: "var(--color-gold)",
      }}>
        <Sparkles size={64} strokeWidth={1.5} />
      </div>

      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.5rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: "var(--color-text-primary)",
      }}>
        Something Went Wrong
      </h1>

      <p style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text-secondary)",
        maxWidth: "360px",
        lineHeight: 1.7,
      }}>
        An unexpected error occurred. Our team has been notified.
        You can try again or return to the homepage.
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #e8d5a0, #c4a452, #8a6f2e)",
            color: "#0b0c10",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>

        <Link
          href="/"
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "8px",
            border: "1px solid rgba(196,164,82,0.35)",
            background: "transparent",
            color: "var(--color-gold-light)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "0.82rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

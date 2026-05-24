import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
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

      <p style={{
        fontFamily: "var(--font-display)",
        fontSize: "6rem",
        fontWeight: 700,
        lineHeight: 1,
        background: "linear-gradient(135deg, #e8d5a0, #c4a452, #8a6f2e)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        404
      </p>

      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.5rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: "var(--color-text-primary)",
      }}>
        This Page Is Lost in Time
      </h1>

      <p style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text-secondary)",
        maxWidth: "360px",
        lineHeight: 1.7,
      }}>
        Even Chronos couldn&apos;t find what you&apos;re looking for.
        The page may have been moved, deleted, or never existed.
      </p>

      <Link
        href="/"
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
          textDecoration: "none",
          transition: "opacity 0.15s ease",
        }}
      >
        Return Home
      </Link>
    </div>
  );
}

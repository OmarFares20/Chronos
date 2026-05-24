"use client";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Diamond, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
      } else {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect") || "/dashboard";
        window.location.href = redirect;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Ambient background */}
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      {/* Back to home */}
      <Link href="/" className={styles.backLink} id="login-back-home" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <ArrowLeft size={16} /> Back to Chronos
      </Link>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <Image
            src="/chronos-logo.webp"
            alt="Chronos"
            width={80}
            height={80}
            className={styles.logoImg}
            priority
          />
          <h1 className={styles.brandName}>CHRONOS</h1>
          <p className={styles.brandTagline}>Timeless Events</p>
        </div>

        {/* Divider */}
        <div className={styles.divider}>
          <span /><Diamond size={14} className={styles.dividerIcon} /><span />
        </div>

        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.subtitle}>Sign in to your account to continue</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error && <div className={styles.errorBanner} role="alert">{error}</div>}

          <div className={styles.fieldGroup}>
            <label htmlFor="login-email" className={styles.label}>Email Address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="login-password" className={styles.label}>Password</label>
              <Link href="/forgot-password" className={styles.forgotLink} id="login-forgot-password">
                Forgot password?
              </Link>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                id="login-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p className={styles.switchText}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className={styles.switchLink} id="login-go-register">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

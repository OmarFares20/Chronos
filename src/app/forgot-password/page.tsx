"use client";
import styles from "../login/page.module.css";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <Link href="/login" className={styles.backLink}>
        ← Back to Login
      </Link>

      <div className={styles.card}>
        <div className={styles.logoArea}>
          <Image src="/chronos-logo.webp" alt="Chronos" width={80} height={80} className={styles.logoImg} priority />
          <h1 className={styles.brandName}>CHRONOS</h1>
        </div>
        
        <h2 className={styles.title}>Reset Password</h2>
        <p className={styles.subtitle}>Enter your email to receive recovery instructions.</p>

        {sent ? (
          <div className={styles.form} style={{ textAlign: "center", padding: "2rem 0" }}>
            <p style={{ color: "#4ade80", marginBottom: "1rem" }}>✓ Recovery email sent to {email}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-silver-light)" }}>Please check your inbox (and spam folder) for the reset link.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="reset-email" className={styles.label}>Email Address</label>
              <input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} placeholder="you@example.com" required />
            </div>
            <button type="submit" className={styles.btnPrimary}>Send Reset Link</button>
          </form>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Privacy Policy — Chronos",
  description: "Learn how Chronos collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "7rem 2rem 4rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", lineHeight: 1.8 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "2.5rem" }}>
          Last updated: May 2026
        </p>

        {[
          {
            title: "1. Information We Collect",
            body: "We collect information you provide directly (name, email, phone, address) when you register or use our services. We also collect usage data, device information, and transaction details necessary to operate the marketplace.",
          },
          {
            title: "2. How We Use Your Information",
            body: "Your data is used to operate and improve Chronos, facilitate bookings and payments, send service-related communications, prevent fraud, and comply with legal obligations. We do not sell your personal data.",
          },
          {
            title: "3. Payment Data",
            body: "All payment information is processed by Stripe. Chronos does not store your full card details. Stripe's privacy policy governs the handling of payment data.",
          },
          {
            title: "4. Cookies",
            body: "We use essential cookies (including an httpOnly authentication cookie) to maintain your session. We do not use third-party tracking or advertising cookies.",
          },
          {
            title: "5. Data Sharing",
            body: "We share your information with service providers (Stripe, Neon) only as necessary to operate the platform. We do not share your data with advertisers. We may disclose data when required by law.",
          },
          {
            title: "6. Data Retention",
            body: "We retain your account data for as long as your account is active and for a reasonable period thereafter as required by law or legitimate business purposes.",
          },
          {
            title: "7. Your Rights",
            body: "Depending on your jurisdiction, you may have the right to access, correct, delete, or port your personal data. To exercise these rights, contact privacy@chronos.app.",
          },
          {
            title: "8. Contact",
            body: "For privacy inquiries, contact us at privacy@chronos.app.",
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>
              {title}
            </h2>
            <p>{body}</p>
          </section>
        ))}

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
          <Link href="/terms" style={{ color: "var(--color-gold)", marginRight: "1.5rem" }}>Terms of Service →</Link>
          <Link href="/" style={{ color: "var(--color-text-muted)" }}>← Back to Chronos</Link>
        </div>
      </main>
    </>
  );
}

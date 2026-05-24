import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Terms of Service — Chronos",
  description: "Read the Terms of Service for Chronos, the premium event-planning marketplace.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "7rem 2rem 4rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", lineHeight: 1.8 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "2.5rem" }}>
          Last updated: May 2026
        </p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By accessing or using Chronos, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.",
          },
          {
            title: "2. Description of Service",
            body: "Chronos is a marketplace connecting customers seeking event services with verified professional providers. Chronos facilitates bookings and holds payments in escrow until services are rendered.",
          },
          {
            title: "3. Escrow & Payments",
            body: "All payments are processed securely via Stripe and held in escrow until the event concludes satisfactorily. Platform fees of 5% apply to all transactions. Refund eligibility is subject to the provider's cancellation policy.",
          },
          {
            title: "4. Provider Responsibilities",
            body: "Providers are independent contractors, not employees of Chronos. Providers are solely responsible for the quality of their services, accurate representation of their offerings, and compliance with applicable laws.",
          },
          {
            title: "5. Prohibited Conduct",
            body: "You agree not to use Chronos to engage in fraudulent transactions, post false information, circumvent the platform for direct off-platform payments, or violate any applicable laws.",
          },
          {
            title: "6. Limitation of Liability",
            body: "Chronos is a marketplace intermediary. To the fullest extent permitted by law, Chronos shall not be liable for any indirect, incidental, or consequential damages arising from use of the platform.",
          },
          {
            title: "7. Changes to Terms",
            body: "We may update these terms periodically. Continued use of Chronos after changes constitutes acceptance of the revised terms.",
          },
          {
            title: "8. Contact",
            body: "For legal inquiries, contact us at legal@chronos.app.",
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
          <Link href="/privacy" style={{ color: "var(--color-gold)", marginRight: "1.5rem" }}>Privacy Policy →</Link>
          <Link href="/" style={{ color: "var(--color-text-muted)" }}>← Back to Chronos</Link>
        </div>
      </main>
    </>
  );
}

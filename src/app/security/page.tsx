import styles from "./security.module.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Trust & Security — Chronos",
  description: "How Chronos protects your payments with escrow, verified providers, and dispute resolution.",
};

const ESCROW_STEPS = [
  { num: "I",  icon: "💳", title: "Customer Pays", desc: "Funds are captured securely via Stripe at the point of booking." },
  { num: "II", icon: "🔒", title: "Funds Locked",  desc: "Your money is held in a dedicated escrow account — neither party can access it." },
  { num: "III",icon: "🎉", title: "Occasion Happens", desc: "Provider delivers their service on your agreed date." },
  { num: "IV", icon: "✅", title: "Auto-Release",  desc: "After your occasion, funds are automatically released to the provider." },
];

const PILLARS = [
  { icon: "🔐", title: "256-bit Encryption", desc: "All data in transit and at rest is encrypted using industry-standard TLS 1.3 and AES-256 protocols." },
  { icon: "✔️", title: "Verified Providers",  desc: "Every provider on Chronos undergoes identity verification, portfolio review, and compliance checks before listing." },
  { icon: "💬", title: "Mediated Disputes",   desc: "Our trained resolution team mediates any claims fairly, with decisions made within 5 business days." },
  { icon: "↩",  title: "Refund Guarantee",   desc: "If a provider fails to deliver, your funds are refunded in full. No questions asked." },
  { icon: "📋", title: "Full Audit Trail",    desc: "Every action on the platform — booking, payment, communication — is logged and verifiable." },
  { icon: "🛡️", title: "PCI DSS Compliant",   desc: "Chronos never stores raw card data. All payments are processed through Stripe's PCI Level 1 infrastructure." },
];

const DISPUTE_STEPS = [
  { n: 1, text: "Contact the provider directly via our secure messaging system." },
  { n: 2, text: "If unresolved within 48 hours, open a formal dispute from your Payments page." },
  { n: 3, text: "Our resolution team reviews evidence from both parties." },
  { n: 4, text: "A binding decision is issued within 5 business days. Funds are released or refunded accordingly." },
];

const BADGES = [
  { icon: "🔒", label: "SSL Secured" },
  { icon: "💳", label: "Stripe Payments" },
  { icon: "🛡️", label: "PCI DSS Compliant" },
  { icon: "✔️", label: "Verified Providers" },
  { icon: "🌍", label: "Operating in 42 Cities" },
];

export default function SecurityPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.orb1} aria-hidden="true" />

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Trust & Safety</p>
        <h1 className={styles.title}>
          Your Money is <span className="text-gold">100% Protected</span>
        </h1>
        <p className={styles.subtitle}>
          Chronos was built on a foundation of trust. Our escrow system, verified provider network,
          and mediated dispute resolution ensure every occasion ends in a success — or you get your money back.
        </p>
      </section>

      <div className={styles.content}>

        {/* Escrow flow */}
        <section className={styles.escrowSection} id="how-escrow-works">
          <h2 className={styles.sectionTitle}>How Escrow Works</h2>
          <p className={styles.sectionDesc}>
            When you book a provider on Chronos, your payment never goes directly to them. Instead,
            it is held in a secure escrow account until your occasion concludes successfully.
          </p>
          <div className={styles.escrowSteps}>
            {ESCROW_STEPS.map((s) => (
              <div key={s.num} className={styles.escrowStep}>
                <span className={styles.escrowNum}>{s.num}</span>
                <span className={styles.escrowIcon}>{s.icon}</span>
                <p className={styles.escrowStepTitle}>{s.title}</p>
                <p className={styles.escrowStepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust pillars */}
        <section style={{ marginBottom: "4rem" }} id="security-pillars">
          <h2 className={styles.sectionTitle}>Built-In Security Pillars</h2>
          <p className={styles.sectionDesc}>
            Multiple layers of protection work together to keep your funds, data, and occasions safe.
          </p>
          <div className={styles.pillarsGrid}>
            {PILLARS.map((p) => (
              <div key={p.title} className={styles.pillarCard}>
                <span className={styles.pillarIcon}>{p.icon}</span>
                <h3 className={styles.pillarTitle}>{p.title}</h3>
                <p className={styles.pillarDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dispute resolution */}
        <div className={styles.disputeCard} id="dispute-resolution">
          <span className={styles.disputeIcon}>⚖️</span>
          <div>
            <h3 className={styles.disputeTitle}>Dispute Resolution Process</h3>
            <p className={styles.disputeText}>
              If something isn&apos;t right, Chronos stands between you and the provider.
              Our resolution team investigates every case with fairness and impartiality.
            </p>
            <div className={styles.disputeSteps}>
              {DISPUTE_STEPS.map((s) => (
                <div key={s.n} className={styles.disputeStep}>
                  <div className={styles.disputeStepNum}>{s.n}</div>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className={styles.badgesRow}>
          {BADGES.map((b) => (
            <div key={b.label} className={styles.trustBadge}>
              <span className={styles.trustBadgeIcon}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>
            Ready to Plan with <span className="text-gold">Confidence?</span>
          </h2>
          <p className={styles.ctaDesc}>
            Join 4,200+ occasions planned through Chronos — all protected by our escrow guarantee.
          </p>
          <Link href="/providers" className={styles.ctaBtn} id="security-cta">
            Browse Providers →
          </Link>
        </div>

      </div>
    </div>
  );
}

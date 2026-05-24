import Navbar from "@/components/Navbar";
import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/formatPrice";

import { Camera, Utensils, Sparkles, Music, CalendarDays, MapPin, Diamond, ArrowRight, Tag } from "lucide-react";

// ── Service category data ──────────────────────────────────────────────────
const services = [
  { id: "photography", icon: <Camera size={24} />, title: "Photography", desc: "Timeless captures from masters of light and moment." },
  { id: "catering",    icon: <Utensils size={24} />, title: "Catering",    desc: "Exquisite culinary journeys curated for your occasion." },
  { id: "decor",       icon: <Sparkles size={24} />, title: "Décor",       desc: "Bespoke environments that transform any space into legend." },
  { id: "music",       icon: <Music size={24} />, title: "Live Music",  desc: "Soulful performances that linger long after the last note." },
  { id: "planning",    icon: <CalendarDays size={24} />, title: "Planning",    desc: "End-to-end orchestration, every detail tended with care." },
  { id: "venue",       icon: <MapPin size={24} />, title: "Venues",      desc: "Extraordinary spaces befitting the grandest of occasions." },
];

// ── How it works steps ─────────────────────────────────────────────────────
const steps = [
  { number: "I",   title: "Describe Your Vision",   desc: "Tell us about your occasion — date, size, style, and everything you dream of." },
  { number: "II",  title: "Browse Providers",        desc: "Explore a curated marketplace of verified, elite occasion professionals." },
  { number: "III", title: "Secure & Book",            desc: "Pay securely — your funds are held safely until your occasion is a success." },
  { number: "IV",  title: "Relive the Moment",        desc: "Your occasion concludes flawlessly. Funds release. Memories are made forever." },
];

// ── Stats ──────────────────────────────────────────────────────────────────
const stats = [
  { value: "4,200+", label: "Occasions Orchestrated" },
  { value: "98%",    label: "Client Satisfaction" },
  { value: "800+",   label: "Verified Providers" },
  { value: "42",     label: "Cities Served" },
];

export default async function HomePage() {
  const promotions = await prisma.package.findMany({
    where: { isPromotion: true },
    take: 4,
    include: { service: { include: { provider: true } } },
    orderBy: { discountPercentage: 'desc' }
  });

  return (
    <main className={styles.main}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className={styles.hero} id="hero" aria-label="Hero">
        {/* Ambient background orbs */}
        <div className={styles.orb1} aria-hidden="true" />
        <div className={styles.orb2} aria-hidden="true" />
        <div className={styles.orb3} aria-hidden="true" />

        {/* Floating particles */}
        <div className={styles.particles} aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={styles.particle} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>

        <div className={styles.heroContent}>
          {/* Badge */}
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Premium Occasion Marketplace
          </div>

          {/* Mascot */}
          <div className={styles.mascotWrapper} aria-label="Chronos mascot">
            <div className={styles.mascotGlow} aria-hidden="true" />
            <Image
              src="/chronos-logo.webp"
              alt="Chronos — God of Time"
              width={260}
              height={260}
              className={styles.mascotImg}
              priority
            />
          </div>

          {/* Headline */}
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleSub}>Command Time.</span>
            <span className={`${styles.heroTitleMain} text-gold`}>Craft Legends.</span>
          </h1>

          <p className={styles.heroDesc}>
            Chronos unites visionaries with the world&apos;s finest occasion artisans.
            Every occasion, immortalised.
          </p>

          {/* Talabat-Style Hero Search */}
          <form action="/providers" method="GET" className={styles.heroSearchForm}>
            <div className={styles.heroSearchInputs}>
              <div className={styles.heroSearchField}>
                <label htmlFor="hero-category">I am looking for...</label>
                <select name="category" id="hero-category" required defaultValue="">
                  <option value="" disabled>Select a service</option>
                  <option value="PHOTOGRAPHY">Photography</option>
                  <option value="CATERING">Catering</option>
                  <option value="DECOR">Décor</option>
                  <option value="MUSIC">Live Music</option>
                  <option value="PLANNING">Planning</option>
                  <option value="VENUE">Venues</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="VIDEOGRAPHY">Videography</option>
                  <option value="FLORIST">Florist</option>
                  <option value="MAKEUP">Makeup &amp; Beauty</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="SECURITY">Security</option>
                </select>
              </div>
              
              <div className={styles.heroSearchDivider}></div>

              <div className={styles.heroSearchField}>
                <label htmlFor="hero-city">In...</label>
                <input type="text" name="city" id="hero-city" placeholder="e.g. Cairo" />
              </div>
            </div>
            
            <button type="submit" className={styles.heroSearchBtn}>
              Find Professionals <ArrowRight size={16} className={styles.ctaArrow} style={{ marginLeft: 8 }} />
            </button>
          </form>

          {/* Stats strip */}
          <div className={styles.statsStrip}>
            {stats.map((s) => (
              <div key={s.label} className={styles.statItem}>
                <span className={`${styles.statValue} text-gold`}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className={styles.heroDivider} aria-hidden="true">
          <span />
          <Diamond size={16} className={styles.heroDividerIcon} />
          <span />
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────── */}
      <section className={styles.section} id="services" aria-label="Services">
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>What We Offer</p>
          <h2 className={styles.sectionTitle}>
            Every Element of a{" "}
            <span className="text-gold">Timeless Occasion</span>
          </h2>
          <p className={styles.sectionDesc}>
            From the first note to the final photograph — browse elite professionals
            across every discipline of occasion craftsmanship.
          </p>

          <div className={styles.servicesGrid}>
            {services.map((s) => (
              <Link key={s.id} href={`/services/${s.id}`} className={styles.serviceCard} id={`service-${s.id}`}>
                <span className={styles.serviceIcon}>{s.icon}</span>
                <h3 className={styles.serviceTitle}>{s.title}</h3>
                <p className={styles.serviceDesc}>{s.desc}</p>
                <ArrowRight size={18} className={styles.serviceArrow} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMOTIONS ───────────────────────────────────────────────── */}
      {promotions.length > 0 && (
        <section className={styles.section} id="promotions" aria-label="Promotions and Deals">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Special Offers</p>
            <h2 className={styles.sectionTitle}>
              Exclusive <span className="text-gold">Deals</span>
            </h2>
            <div className={styles.servicesGrid}>
              {promotions.map((pkg) => {
                const originalPrice = Number(pkg.price) / (1 - (pkg.discountPercentage || 0) / 100);
                return (
                  <Link key={pkg.id} href={`/providers/${pkg.service.providerId}`} className={styles.serviceCard}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--color-gold)', color: 'black', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', zIndex: 10 }}>
                      <Tag size={12} /> {pkg.discountPercentage}% OFF
                    </div>
                    <span className={styles.serviceIcon} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>%</span>
                    <h3 className={styles.serviceTitle}>{pkg.name}</h3>
                    <p className={styles.serviceDesc} style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>
                      {pkg.service.provider.businessName}
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {formatPrice(originalPrice)}
                      </span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {formatPrice(Number(pkg.price))}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="how-it-works" aria-label="How it works">
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>The Process</p>
          <h2 className={styles.sectionTitle}>
            Simple. Secure.{" "}
            <span className="text-gold">Seamless.</span>
          </h2>

          <div className={styles.stepsGrid}>
            {steps.map((step, i) => (
              <div key={i} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className={styles.stepConnector} aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BANNER ─────────────────────────────────────────────── */}
      <section className={styles.trustBanner} id="about" aria-label="Trust and security">
        <div className={styles.trustInner}>
          <div className={styles.trustMascot}>
            <Image
              src="/chronos-logo.webp"
              alt="Chronos logo"
              width={90}
              height={90}
              className={styles.trustMascotImg}
            />
          </div>
          <div className={styles.trustText}>
            <h2 className={styles.trustTitle}>
              Your Funds, <span className="text-gold">Protected.</span>
            </h2>
            <p className={styles.trustDesc}>
              Every payment on Chronos is held in secure escrow until your occasion concludes successfully.
              No risk. No compromises. Only timeless results.
            </p>
          </div>
          <Link href="/security" className={styles.trustCta} id="trust-learn-more" style={{ display: "inline-flex", alignItems: "center" }}>
            Learn About Security <ArrowRight size={16} style={{ marginLeft: 8 }} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Image
              src="/chronos-logo.webp"
              alt="Chronos logo"
              width={44}
              height={44}
              className={styles.footerLogoImg}
            />
            <span className={`${styles.footerLogo} text-silver`}>CHRONOS</span>
          </div>
          <p className={styles.footerTagline}>Timeless Events</p>

          <div className={styles.footerLinks}>
            <Link href="/providers" className={styles.footerLink} id="footer-browse">Browse Providers</Link>
            <Link href="/security"  className={styles.footerLink} id="footer-trust">Trust &amp; Safety</Link>
            <Link href="/terms"     className={styles.footerLink} id="footer-terms">Terms</Link>
            <Link href="/privacy"   className={styles.footerLink} id="footer-privacy">Privacy</Link>
            <a href="mailto:hello@chronos.app" className={styles.footerLink} id="footer-contact">Contact</a>
          </div>

          <div className={styles.footerDivider} aria-hidden="true" />
          <p className={styles.footerCopy}>© {new Date().getFullYear()} Chronos. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

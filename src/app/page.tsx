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
  // ── Fetch all dynamic homepage data ──────────────────────────────────────
  // ── Fetch all dynamic homepage data ─────────────────────────────────────
  // NOTE: rating/reviewCount are computed from the Review relation — no schema fields needed
  const [promotions, rawFeatured, recentReviews, liveStats] = await Promise.all([
    // Exclusive deals
    prisma.package.findMany({
      where: { isPromotion: true },
      take: 4,
      include: { service: { include: { provider: true } } },
      orderBy: { discountPercentage: "desc" },
    }),
    // Featured providers — verified only, include reviews for rating
    prisma.providerProfile.findMany({
      where: { isVerified: true },
      take: 12, // fetch more so we can sort by computed rating
      include: {
        user:    { select: { avatarUrl: true } },
        reviews: { select: { rating: true } },
        services: { include: { packages: { select: { price: true }, take: 1, orderBy: { price: "asc" } } }, take: 1 },
      },
    }),
    // Recent 5-star reviews
    prisma.review.findMany({
      where: { rating: 5 },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, avatarUrl: true } },
        provider: { select: { businessName: true, categories: true } },
      },
    }),
    // Live platform stats from real DB counts
    Promise.all([
      prisma.booking.count({ where: { status: { in: ["RELEASED", "IN_ESCROW"] } } }),
      prisma.providerProfile.count({ where: { isVerified: true } }),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
    ]),
  ]);

  const [completedBookings, verifiedProviders, avgRatingResult, totalCustomers] = liveStats;
  const avgRating = avgRatingResult._avg.rating?.toFixed(1) || "4.9";

  // Compute rating + minPrice for each provider from relations
  type EnrichedProvider = typeof rawFeatured[0] & { avgRating: number; reviewCount: number; minPrice: number };
  const enriched: EnrichedProvider[] = rawFeatured.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avgR    = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const minP    = p.services.flatMap(s => s.packages).map(pk => Number(pk.price))[0] || 0;
    return { ...p, avgRating: Math.round(avgR * 10) / 10, reviewCount: ratings.length, minPrice: minP };
  });

  // Featured: verified, sorted by review count
  const featuredProviders = enriched
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 6);

  // Top rated: avg rating ≥ 4, sorted by rating desc
  const topRated = enriched
    .filter((p) => p.avgRating >= 4)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 4);

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

          {/* Live Stats strip */}
          <div className={styles.statsStrip}>
            {[
              { value: completedBookings.toLocaleString("en-US") + "+", label: "Occasions Completed" },
              { value: avgRating + " ★", label: "Average Rating" },
              { value: verifiedProviders.toLocaleString("en-US") + "+", label: "Verified Providers" },
              { value: totalCustomers.toLocaleString("en-US") + "+", label: "Happy Customers" },
            ].map((s) => (
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
      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
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
              <Link key={s.id} href={`/providers?category=${s.id.toUpperCase()}`} className={styles.serviceCard} id={`service-${s.id}`}>
                <span className={styles.serviceIcon}>{s.icon}</span>
                <h3 className={styles.serviceTitle}>{s.title}</h3>
                <p className={styles.serviceDesc}>{s.desc}</p>
                <ArrowRight size={18} className={styles.serviceArrow} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROVIDERS ───────────────────────────────────────── */}
      {featuredProviders.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`} id="featured" aria-label="Featured Providers">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Hand-Picked Excellence</p>
            <h2 className={styles.sectionTitle}>
              Featured <span className="text-gold">Providers</span>
            </h2>
            <p className={styles.sectionDesc}>
              Verified professionals with outstanding track records — trusted by thousands of Egyptian families.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
              {featuredProviders.map((p) => (
                <Link key={p.id} href={`/providers/${p.id}`} style={{
                  display: "flex", flexDirection: "column",
                  padding: "1.5rem", background: "rgba(14,15,22,0.95)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
                  textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Shimmer top border */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--color-gold), transparent)" }} />

                  {/* Provider identity */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", marginBottom: "1rem" }}>
                    <img
                      src={p.user?.avatarUrl || p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.businessName.slice(0,2))}&background=1a1b2e&color=C4A452&size=56`}
                      alt={p.businessName}
                      style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: "2px solid rgba(196,164,82,0.25)", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.businessName}</p>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.6rem", fontWeight: 700, color: "#50c878", background: "rgba(80,200,120,0.1)", border: "1px solid rgba(80,200,120,0.3)", borderRadius: 99, padding: "0.1rem 0.45rem" }}>✓ Verified</span>
                    </div>
                  </div>

                  {/* Category + location */}
                  <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: "0.85rem" }}>
                    {p.categories[0]?.replace("_", " ")} &nbsp;·&nbsp; {p.location}
                  </p>

                  {/* Rating row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: "0.85rem" }}>
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i} style={{ fontSize: "0.78rem", color: i < Math.round(p.avgRating || 0) ? "var(--color-gold)" : "rgba(255,255,255,0.15)" }}>{star}</span>
                    ))}
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginLeft: 2 }}>{(p.avgRating || 0).toFixed(1)} ({p.reviewCount})</span>
                  </div>

                  {/* Footer: price + CTA */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-gold)", fontWeight: 700 }}>From {formatPrice(p.minPrice || 0)}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-gold)", fontSize: "0.75rem", fontWeight: 600 }}>
                      View Profile <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link href="/providers" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.75rem 2rem", border: "1px solid rgba(196,164,82,0.4)", borderRadius: 10, color: "var(--color-gold)", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}>
                Browse All Providers <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── EXCLUSIVE DEALS ───────────────────────────────────────────── */}
      {promotions.length > 0 && (
        <section className={styles.section} id="promotions" aria-label="Exclusive Deals">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Limited Time Offers</p>
            <h2 className={styles.sectionTitle}>
              Exclusive <span className="text-gold">Deals</span>
            </h2>
            <p className={styles.sectionDesc}>Book now before these hand-picked offers expire.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
              {promotions.map((pkg) => {
                const orig = Number(pkg.price) / (1 - (pkg.discountPercentage || 0) / 100);
                return (
                  <Link key={pkg.id} href={`/providers/${pkg.service.providerId}`}
                    style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0.85rem", padding: "1.5rem", background: "rgba(14,15,22,0.95)", border: "1px solid rgba(196,164,82,0.2)", borderRadius: 16, textDecoration: "none", overflow: "hidden" }}>
                    {/* Discount badge */}
                    <div style={{ position: "absolute", top: 12, right: 12, background: "var(--color-gold)", color: "#000", padding: "0.3rem 0.7rem", borderRadius: 8, fontWeight: 800, fontSize: "0.75rem", zIndex: 10, display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 12px rgba(196,164,82,0.5)" }}>
                      <Tag size={11} /> {pkg.discountPercentage}% OFF
                    </div>
                    {/* Gold bg shimmer */}
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top left, rgba(196,164,82,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
                    {/* Provider identity — push right of badge with padding-right */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingRight: "4.5rem" }}>
                      <img
                        src={`https://picsum.photos/seed/${pkg.service.provider.businessName.replace(/\s+/g, "")}/56`}
                        alt={pkg.service.provider.businessName}
                        style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(196,164,82,0.25)", flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pkg.name}</p>
                        <p style={{ fontSize: "0.7rem", color: "var(--color-gold)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pkg.service.provider.businessName}</p>
                      </div>
                    </div>
                    {/* Price comparison */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginTop: "auto", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ textDecoration: "line-through", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{formatPrice(orig)}</span>
                      <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-gold)" }}>{formatPrice(Number(pkg.price))}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", color: "var(--color-gold)", fontSize: "0.75rem", gap: 4, fontWeight: 600 }}>
                      Book this deal <ArrowRight size={12} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── TOP RATED ─────────────────────────────────────────────────── */}
      {topRated.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`} id="top-rated" aria-label="Top Rated">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>The Best of the Best</p>
            <h2 className={styles.sectionTitle}>
              Top Rated <span className="text-gold">This Month</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {topRated.map((p, i) => (
                <Link key={p.id} href={`/providers/${p.id}`}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.1rem 1.25rem", background: "rgba(14,15,22,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, textDecoration: "none", transition: "all 0.2s" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "rgba(196,164,82,0.3)", fontFamily: "var(--font-display)", width: 28, flexShrink: 0 }}>#{i + 1}</div>
                  <img
                    src={p.user?.avatarUrl || p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.businessName.slice(0,2))}&background=1a1b2e&color=C4A452&size=40`}
                    alt={p.businessName}
                    style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(196,164,82,0.3)", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.businessName}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <span style={{ color: "var(--color-gold)", fontSize: "0.72rem" }}>★ {p.avgRating?.toFixed(1)}</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.68rem" }}>({p.reviewCount} reviews)</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CUSTOMER REVIEWS ──────────────────────────────────────────── */}
      {recentReviews.length > 0 && (
        <section className={styles.section} id="reviews" aria-label="Customer Reviews">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>What Our Customers Say</p>
            <h2 className={styles.sectionTitle}>
              Real Stories, <span className="text-gold">Real Magic</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.1rem" }}>
              {recentReviews.map((r) => (
                <div key={r.id} style={{
                  padding: "1.5rem", background: "rgba(14,15,22,0.9)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
                  display: "flex", flexDirection: "column", gap: "0.85rem",
                  /* equal height via grid stretch */
                }}>
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 2 }}>
                    {"★★★★★".split("").map((s, i) => (
                      <span key={i} style={{ color: "var(--color-gold)", fontSize: "0.82rem" }}>{s}</span>
                    ))}
                  </div>

                  {/* Comment — clamped to 4 lines for uniform height */}
                  <p style={{
                    fontSize: "0.86rem", color: "var(--color-text-muted)", lineHeight: 1.65,
                    fontStyle: "italic", flex: 1,
                    display: "-webkit-box", WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    "{r.comment}"
                  </p>

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

                  {/* Author + provider attribution */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", minWidth: 0 }}>
                      <img
                        src={r.customer?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent((r.customer?.name || "C").slice(0,2))}&background=1a1b2e&color=C4A452&size=36`}
                        alt={r.customer?.name || "Customer"}
                        style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.customer?.name}</p>
                        <p style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>via Chronos</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {r.provider?.businessName?.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </div>
                </div>
              ))}
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

      {/* ── CTA BAND ─────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, rgba(196,164,82,0.12) 0%, rgba(196,164,82,0.04) 100%)", borderTop: "1px solid rgba(196,164,82,0.2)", borderBottom: "1px solid rgba(196,164,82,0.2)", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-gold)", marginBottom: "0.75rem" }}>Start Planning Today</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", color: "var(--color-text-primary)", letterSpacing: "0.06em", marginBottom: "1rem", lineHeight: 1.2 }}>
          Your Perfect Occasion<br /><span style={{ color: "var(--color-gold)" }}>Awaits You</span>
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", maxWidth: 480, margin: "0 auto 2rem", lineHeight: 1.7 }}>
          Join thousands of Egyptian families who trusted Chronos to orchestrate their most treasured moments.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/providers" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.9rem 2rem", background: "var(--gradient-gold)", borderRadius: 12, color: "#000", fontWeight: 800, fontSize: "0.9rem", textDecoration: "none", letterSpacing: "0.04em" }}>
            <Diamond size={16} /> Browse Providers
          </Link>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.9rem 2rem", border: "1px solid rgba(196,164,82,0.35)", borderRadius: 12, color: "var(--color-gold)", fontSize: "0.9rem", textDecoration: "none" }}>
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── TRUST BANNER ─────────────────────────────────────────────── */}
      <section className={styles.trustBanner} id="about" aria-label="Trust and security">
        <div className={styles.trustInner}>
          <div className={styles.trustMascot}>
            <Image src="/chronos-logo.webp" alt="Chronos logo" width={90} height={90} className={styles.trustMascotImg} />
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

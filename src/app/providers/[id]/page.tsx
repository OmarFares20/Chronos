"use client";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { addToCart, getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/formatPrice";

// ── Types ─────────────────────────────────────────────────────────────────
interface Package {
  id: string;
  name: string;
  price: number;
  duration?: string;
  isHighlight: boolean;
  features: string[];
  notIncluded?: string[];
  isPromotion?: boolean;
  discountPercentage?: number;
}
interface Service { id: string; name: string; category: string; packages: Package[]; }
interface Review  { id: string; rating: number; comment?: string; createdAt: string; customer?: { name: string }; providerReply?: string; helpfulCount: number; }
interface Provider {
  id: string;
  businessName: string;
  bio?: string;
  location?: string;
  responseTime?: string;
  since?: number;
  isVerified: boolean;
  badge?: string;
  categories: string[];
  languages?: string[];
  services: Service[];
  reviews: Review[];
  galleryItems: { id: string; imageUrl?: string; label?: string; aspect: string }[];
  _count: { reviews: number; bookings: number };
  avgRating: number;
  user?: { avatarUrl?: string | null };
  avatarUrl?: string | null;
}

// ── Mock fallback used until real DB providers are seeded ──────────────────
const MOCK: Provider = {
  id: "mock",
  businessName: "Lumière Studios",
  bio: `Award-winning photography and videography studio born from a passion for timeless storytelling. Our team of seasoned visual artists specialises in capturing the raw emotion, quiet grandeur, and fleeting moments that define your most cherished occasions.\n\nFrom intimate garden ceremonies to grand ballroom galas, we approach every event with a documentary eye, an editorial sensibility, and an unwavering commitment to excellence.`,
  location: "Cairo, Egypt",
  responseTime: "Within 2 hours",
  since: 2018,
  isVerified: true,
  badge: "Top Rated",
  categories: ["PHOTOGRAPHY", "VIDEOGRAPHY"],
  languages: ["English", "Arabic"],
  services: [
    {
      id: "svc-1",
      name: "Photography",
      category: "PHOTOGRAPHY",
      packages: [
        { id: "essential", name: "Essential",  price: 1800, duration: "6 hours",  isHighlight: false, features: ["1 Photographer", "6 hrs coverage", "300+ edited images", "Online gallery"] },
        { id: "signature", name: "Signature",  price: 2800, duration: "10 hours", isHighlight: true,  features: ["2 Photographers", "10 hrs coverage", "600+ images", "Highlight reel", "Album design"] },
        { id: "prestige",  name: "Prestige",   price: 4500, duration: "Full Day", isHighlight: false, features: ["3-person team", "Full day coverage", "Unlimited images", "Feature-length film"] },
      ],
    },
  ],
  reviews: [
    { id: "r1", rating: 5, comment: "Lumière captured our wedding beyond anything we imagined.", createdAt: "2026-02-01", customer: { name: "Sarah & Marcus T." }, helpfulCount: 12 },
    { id: "r2", rating: 5, comment: "Absolute professionalism. The gallery left our leadership team speechless.", createdAt: "2026-01-10", customer: { name: "Ahmed Al-Rashidi" }, helpfulCount: 8 },
    { id: "r3", rating: 5, comment: "The highlight reel made me cry every time I watched it.", createdAt: "2025-12-05", customer: { name: "Nadia Osman" }, helpfulCount: 6 },
    { id: "r4", rating: 4, comment: "Exceptional quality and lovely people. Minor delay on delivery but worth the wait.", createdAt: "2025-11-18", customer: { name: "James & Fiona K." }, helpfulCount: 3 },
  ],
  galleryItems: [
    { id: "g1", aspect: "landscape", label: "Ceremony — Grand Hall" },
    { id: "g2", aspect: "portrait",  label: "First Dance" },
    { id: "g3", aspect: "portrait",  label: "Bridal Portrait" },
    { id: "g4", aspect: "landscape", label: "Reception Details" },
    { id: "g5", aspect: "landscape", label: "Corporate Gala" },
    { id: "g6", aspect: "portrait",  label: "Candid Moments" },
  ],
  _count: { reviews: 4, bookings: 340 },
  avgRating: 4.9,
};

// ── Stars ──────────────────────────────────────────────────────────────────
function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <span className={`${styles.stars} ${styles[`stars${size.toUpperCase()}`]}`} aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < Math.floor(rating) ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={styles.toast}>
      <span className={styles.toastIcon}>✓</span>
      {msg}
      <button onClick={onClose} className={styles.toastClose}>✕</button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ProviderProfilePage() {
  const params  = useParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading]   = useState(true);

  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [bookingDate, setBookingDate]         = useState("");
  const [bookingNotes, setBookingNotes]       = useState("");
  const [toast, setToast]                     = useState<string | null>(null);
  const [inCart, setInCart]                   = useState(false);
  const [helpfulVotes, setHelpfulVotes]       = useState<Record<string, boolean>>({});
  const router = useRouter();
  const [messagingLoading, setMessagingLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/providers/${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const p = data?.provider || MOCK;
        setProvider(p);
        // Default to first highlight package or first package
        const allPkgs = p.services.flatMap((s: Service) => s.packages);
        const highlighted = allPkgs.find((pk: Package) => pk.isHighlight);
        setSelectedPackage(highlighted?.id || allPkgs[0]?.id || "");
      })
      .catch(() => setProvider(MOCK))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!selectedPackage) return;
    const cart = getCart();
    setInCart(cart.some((item) => item.packageId === selectedPackage));
  }, [selectedPackage]);

  const allPackages = provider?.services.flatMap((s) => s.packages) || [];
  const selectedPkg = allPackages.find((p) => p.id === selectedPackage);

  const handleSendMessage = async () => {
    if (!provider) return;
    setMessagingLoading(true);
    try {
      const res = await fetch("/api/messages/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: provider.id }),
      });
      if (res.status === 401) {
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
      if (res.ok) {
        const { userId } = await res.json();
        router.push(`/dashboard/messages?with=${userId}`);
      } else {
        const err = await res.json();
        setToast(err.error || "Could not open conversation. Please try again.");
      }
    } catch {
      setToast("Network error. Please try again.");
    } finally {
      setMessagingLoading(false);
    }
  };

  const handleAddToPlan = () => {
    if (!selectedPkg || !provider) return;
    addToCart({
      providerId:      provider.id,
      providerName:    provider.businessName,
      packageId:       selectedPkg.id,
      packageName:     selectedPkg.name,
      price:           Number(selectedPkg.price),
      currency:        "EGP",
      serviceDuration: selectedPkg.duration,
      scheduledTime:   bookingDate || undefined,
      deliveryNotes:   bookingNotes || undefined,
      category:        provider.categories[0] || "SERVICE",
    });
    setInCart(true);
    setToast(`${selectedPkg.name} added to your Occasion Plan!`);
  };

  const toggleHelpful = (reviewId: string) => {
    const key = `helpful_${reviewId}`;
    const voted = localStorage.getItem(key) === "1";
    if (!voted) {
      localStorage.setItem(key, "1");
      setHelpfulVotes((prev) => ({ ...prev, [reviewId]: true }));
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--color-text-muted)" }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!provider) return null;

  const avgRating = typeof provider.avgRating === "number" ? provider.avgRating : Number(provider.avgRating || 0);

  return (
    <div className={styles.page}>
      <Navbar />
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      <div className={styles.orb1} aria-hidden="true" />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.breadcrumb}>
          <Link href="/providers" className={styles.breadcrumbLink}>Providers</Link>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>{provider.businessName}</span>
        </div>

        <div className={styles.heroInner}>
          <div className={styles.avatar} aria-hidden="true">
            {provider.avatarUrl ? (
              <img
                src={provider.avatarUrl}
                alt={provider.businessName}
                className={styles.avatarImg}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span className={styles.avatarInitial}>{provider.businessName.charAt(0)}</span>
            )}
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.heroMeta}>
              <span className={styles.heroCategory}>{provider.categories[0]?.replace("_", " ")}</span>
              {provider.location && <><span className={styles.heroDot}>·</span><span className={styles.heroLocation}>◎ {provider.location}</span></>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <h1 className={styles.heroName} style={{ margin: 0 }}>{provider.businessName}</h1>
              {provider.isVerified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(80,200,120,0.12)", border: "1px solid rgba(80,200,120,0.45)", borderRadius: "99px", padding: "0.2rem 0.65rem", fontSize: "0.72rem", fontWeight: 700, color: "#50c878", whiteSpace: "nowrap" }}>
                  <CheckCircle size={13} /> Verified
                </span>
              )}
              {provider.badge === "Top Rated" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(196,164,82,0.18)", border: "1px solid var(--color-gold)", borderRadius: "99px", padding: "0.2rem 0.65rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-gold)", whiteSpace: "nowrap" }}>
                  <Star size={12} fill="currentColor" /> Top Rated
                </span>
              )}
              {provider.badge && provider.badge !== "Top Rated" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(192,194,204,0.1)", border: "1px solid var(--color-border)", borderRadius: "99px", padding: "0.2rem 0.65rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-silver-light)", whiteSpace: "nowrap" }}>
                  {provider.badge}
                </span>
              )}
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <Stars rating={avgRating} />
                <span className={styles.heroRating}>{avgRating.toFixed(1)}</span>
                <span className={styles.heroReviews}>({provider._count.reviews} reviews)</span>
              </div>
              <span className={styles.statDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatVal}>{provider._count.bookings}</span>
                <span className={styles.heroStatLabel}>Occasions Completed</span>
              </div>
              {provider.since && (
                <>
                  <span className={styles.statDivider} />
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatVal}>Since {provider.since}</span>
                    <span className={styles.heroStatLabel}>On Chronos</span>
                  </div>
                </>
              )}
              {provider.responseTime && (
                <>
                  <span className={styles.statDivider} />
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatVal}>{provider.responseTime}</span>
                    <span className={styles.heroStatLabel}>Response Time</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className={styles.stickyNav} aria-label="Profile sections">
          <a href="#about"    className={styles.stickyLink}>About</a>
          <a href="#packages" className={styles.stickyLink}>Packages</a>
          <a href="#gallery"  className={styles.stickyLink}>Gallery</a>
          <a href="#reviews"  className={styles.stickyLink}>
            Reviews <span className={styles.tabBadge}>{provider._count.reviews}</span>
          </a>
        </nav>
      </section>

      {/* ── BODY ── */}
      <div className={styles.body}>
        <div className={styles.bodyInner}>
          <main className={styles.main}>

            {/* About */}
            <div id="about" className={styles.section}>
              <h2 className={styles.sectionTitle}>About {provider.businessName}</h2>
              {provider.bio?.split("\n\n").map((para, i) => (
                <p key={i} className={styles.bio}>{para}</p>
              ))}
              {provider.languages && provider.languages.length > 0 && (
                <p className={styles.bio} style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                  🌐 Languages: {provider.languages.join(", ")}
                </p>
              )}
            </div>

            {/* Packages */}
            <div id="packages" className={styles.section}>
              <h2 className={styles.sectionTitle}>Packages &amp; Pricing</h2>
              <p className={styles.sectionDesc}>Select a package to add to your occasion plan.</p>
              <div className={styles.packagesGrid}>
                {allPackages.map((pkg) => {
                  const originalPrice = pkg.isPromotion && pkg.discountPercentage
                    ? Number(pkg.price) / (1 - pkg.discountPercentage / 100)
                    : Number(pkg.price);
                  return (
                  <div
                    key={pkg.id}
                    id={`package-${pkg.id}`}
                    className={`${styles.packageCard} ${pkg.isHighlight ? styles.packageHighlight : ""} ${selectedPackage === pkg.id ? styles.packageSelected : ""}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {pkg.isHighlight && !pkg.isPromotion && <div className={styles.packageBestBadge}>Most Popular</div>}
                    {pkg.isPromotion && (
                      <div style={{ position: "absolute", top: "12px", right: "12px", background: "var(--color-gold)", color: "#000", padding: "0.3rem 0.7rem", borderRadius: "8px", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.04em", zIndex: 10, boxShadow: "0 2px 8px rgba(196,164,82,0.5)", display: "flex", alignItems: "center", gap: "4px" }}>
                        🔥 {pkg.discountPercentage}% OFF
                      </div>
                    )}
                    <div className={styles.packageHeader}>
                      <h3 className={styles.packageName}>{pkg.name}</h3>
                      <p className={styles.packageDuration}>{pkg.duration}</p>
                    </div>
                    <div className={styles.packagePrice}>
                      {pkg.isPromotion && (
                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1rem', marginRight: '0.5rem' }}>
                          {formatPrice(originalPrice)}
                        </span>
                      )}
                      <span className={styles.packagePriceVal}>{formatPrice(Number(pkg.price))}</span>
                      <span className={styles.packagePricePer}> / occasion</span>
                    </div>
                    <ul className={styles.packageFeatures}>
                      {pkg.features.map((f) => (
                        <li key={f} className={styles.packageFeature}>
                          <span className={styles.featureCheck}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <div className={`${styles.packageSelectBtn} ${selectedPackage === pkg.id ? styles.packageSelectBtnActive : ""}`}>
                      {selectedPackage === pkg.id ? "✓ Selected" : "Select Package"}
                    </div>
                  </div>
                )})}
              </div>
            </div>

            {/* Gallery */}
            <div id="gallery" className={styles.section}>
              <h2 className={styles.sectionTitle}>Portfolio</h2>
              <p className={styles.sectionDesc}>A selection of our recent work.</p>
              <div className={styles.galleryGrid}>
                {provider.galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.galleryItem} ${styles[`gallery${item.aspect.charAt(0).toUpperCase() + item.aspect.slice(1)}`]}`}
                    aria-label={item.label}
                    style={item.imageUrl ? { backgroundImage: `url('${item.imageUrl}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    <div className={styles.galleryOverlay}>
                      <span className={styles.galleryLabel}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div id="reviews" className={styles.section}>
              <div className={styles.reviewsHeader}>
                <h2 className={styles.sectionTitle}>Client Reviews</h2>
                <div className={styles.ratingOverall}>
                  <span className={`${styles.ratingBig} text-gold`}>{avgRating.toFixed(1)}</span>
                  <div>
                    <Stars rating={avgRating} />
                    <p className={styles.ratingCount}>{provider._count.reviews} verified reviews</p>
                  </div>
                </div>
              </div>
              <div className={styles.reviewsList}>
                {provider.reviews.map((r) => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewTop}>
                      <div className={styles.reviewAuthor}>
                        <div className={styles.reviewAvatar}>{r.customer?.name?.charAt(0) || "?"}</div>
                        <div>
                          <p className={styles.reviewName}>{r.customer?.name || "Anonymous"}</p>
                          <p className={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString([], { year: "numeric", month: "short" })}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                        <Stars rating={r.rating} size="sm" />
                        <span className={styles.verifiedBookingBadge}>✓ Verified Booking</span>
                      </div>
                    </div>
                    <p className={styles.reviewText}>&ldquo;{r.comment}&rdquo;</p>
                    {r.providerReply && (
                      <div className={styles.providerReply}>
                        <span className={styles.providerReplyLabel}>Provider Response:</span>
                        <p className={styles.providerReplyText}>{r.providerReply}</p>
                      </div>
                    )}
                    <button
                      className={`${styles.helpfulBtn} ${helpfulVotes[r.id] ? styles.helpfulBtnVoted : ""}`}
                      onClick={() => toggleHelpful(r.id)}
                      id={`helpful-${r.id}`}
                    >
                      👍 Helpful {r.helpfulCount + (helpfulVotes[r.id] ? 1 : 0) > 0 ? `(${r.helpfulCount + (helpfulVotes[r.id] ? 1 : 0)})` : ""}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* ── STICKY SIDEBAR ── */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarPackageInfo}>
                <p className={styles.sidebarPackageLabel}>Selected Package</p>
                <p className={styles.sidebarPackageName}>{selectedPkg?.name || "—"}</p>
                <p className={styles.sidebarPackagePrice}>
                  {selectedPkg?.isPromotion && selectedPkg.discountPercentage && (
                    <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
                      {formatPrice(Number(selectedPkg.price) / (1 - selectedPkg.discountPercentage / 100))}
                    </span>
                  )}
                  {formatPrice(Number(selectedPkg?.price || 0))}
                  <span className={styles.sidebarPackagePer}> / occasion</span>
                </p>
              </div>

              <div className={styles.sidebarDivider} />

              <div className={styles.sidebarForm}>
                <div className={styles.sidebarField}>
                  <label htmlFor="booking-date" className={styles.sidebarLabel}>Preferred Date &amp; Time</label>
                  <input
                    id="booking-date"
                    type="datetime-local"
                    className={styles.sidebarInput}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className={styles.sidebarField}>
                  <label htmlFor="booking-notes" className={styles.sidebarLabel}>Notes (optional)</label>
                  <textarea
                    id="booking-notes"
                    className={styles.sidebarTextarea}
                    rows={3}
                    placeholder="Tell them about your occasion..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>
              </div>

              {inCart ? (
                <Link href="/planner" className={styles.sidebarViewPlanBtn} id="provider-view-plan">
                  ✓ In Your Plan — View Planner →
                </Link>
              ) : (
                <button className={styles.sidebarBookBtn} id="provider-add-to-plan" onClick={handleAddToPlan}>
                  + Add to Occasion Plan
                </button>
              )}
              <button
                className={styles.sidebarMessageBtn}
                id="provider-send-message"
                onClick={handleSendMessage}
                disabled={messagingLoading}
                style={{ opacity: messagingLoading ? 0.7 : 1, cursor: messagingLoading ? "wait" : "pointer" }}
              >
                {messagingLoading ? "Opening…" : "Send a Message"}
              </button>

              <p className={styles.sidebarNote}>
                ◈ Your payment is held in escrow until your occasion concludes successfully.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

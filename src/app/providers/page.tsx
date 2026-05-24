"use client";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Star, Search, X, Sparkles, ArrowRight, Settings, ChevronUp, ChevronDown, CheckCircle, Diamond, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

interface Provider {
  id: string;
  businessName: string;
  bio?: string;
  location?: string;
  isVerified: boolean;
  badge?: string;
  categories: string[];
  avgRating: number;
  reviewCount: number;
  minPrice: number;
  maxPrice: number;
  user?: { avatarUrl?: string | null };
}

const CATEGORIES = [
  { value: "all",           label: "All Services" },
  { value: "PHOTOGRAPHY",   label: "Photography"  },
  { value: "CATERING",      label: "Catering"     },
  { value: "DECOR",         label: "Décor"        },
  { value: "MUSIC",         label: "Live Music"   },
  { value: "PLANNING",      label: "Planning"     },
  { value: "VENUE",         label: "Venues"       },
  { value: "VIDEOGRAPHY",   label: "Videography"  },
  { value: "ENTERTAINMENT", label: "Entertainment"},
];

const SORT_OPTIONS = [
  { value: "rating",     label: "Top Rated"         },
  { value: "reviews",    label: "Most Reviewed"      },
  { value: "price_asc",  label: "Price: Low → High"  },
  { value: "price_desc", label: "Price: High → Low"  },
  { value: "newest",     label: "Newest"             },
];

// Fallback mock data shown while DB is empty / loading
const MOCK_PROVIDERS: Provider[] = [
  { id: "m1", businessName: "Lumière Studios",    bio: "Award-winning photography studio specialising in timeless weddings and luxury events.",      location: "Cairo",        isVerified: true,  badge: "Top Rated", categories: ["PHOTOGRAPHY"],  avgRating: 4.9, reviewCount: 142, minPrice: 1800, maxPrice: 4500 },
  { id: "m2", businessName: "The Golden Fork",    bio: "Michelin-trained chefs crafting bespoke culinary journeys for the most discerning events.",    location: "Alexandria",   isVerified: true,  badge: "Premium",   categories: ["CATERING"],     avgRating: 4.8, reviewCount: 98,  minPrice: 85,   maxPrice: 200  },
  { id: "m3", businessName: "Elysium Décor",      bio: "Transforming spaces into extraordinary environments. Every petal, every light, intentional.",  location: "Cairo",        isVerified: true,  badge: "Elite",     categories: ["DECOR"],        avgRating: 5.0, reviewCount: 67,  minPrice: 3000, maxPrice: 12000},
  { id: "m4", businessName: "The Ivory Quartet",  bio: "Live music that elevates atmosphere. From string quartets to full jazz ensembles.",             location: "Giza",         isVerified: false, badge: "Top Rated", categories: ["MUSIC"],        avgRating: 4.9, reviewCount: 53,  minPrice: 1200, maxPrice: 3500 },
  { id: "m5", businessName: "Chronos Planners",   bio: "End-to-end event orchestration. We handle every thread so you can live in the moment.",        location: "Cairo",        isVerified: true,  badge: "Verified",  categories: ["PLANNING"],     avgRating: 4.7, reviewCount: 201, minPrice: 2500, maxPrice: 8000 },
  { id: "m6", businessName: "The Marble Hall",    bio: "An architectural masterpiece. 5,000 sqm of marble elegance for your most cherished occasions.", location: "New Cairo",    isVerified: true,  badge: "Premium",   categories: ["VENUE"],        avgRating: 4.8, reviewCount: 176, minPrice: 5000, maxPrice: 25000},
  { id: "m7", businessName: "Horizon Films",      bio: "Cinematic storytellers capturing events with sweeping visuals and a documentary eye.",           location: "Alexandria",   isVerified: true,  badge: "Verified",  categories: ["VIDEOGRAPHY"],  avgRating: 4.6, reviewCount: 88,  minPrice: 1500, maxPrice: 5000 },
  { id: "m8", businessName: "Saffron Collective", bio: "Bold flavours rooted in tradition. Custom menus celebrating local heritage and global influence.",location: "Cairo",        isVerified: true,  badge: "Top Rated", categories: ["CATERING"],     avgRating: 4.9, reviewCount: 115, minPrice: 70,   maxPrice: 180  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} stars`} style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          size={14} 
          className={i < Math.floor(rating) ? styles.starFilled : styles.starEmpty} 
          fill={i < Math.floor(rating) ? "currentColor" : "none"} 
        />
      ))}
    </span>
  );
}

export default function ProvidersPage() {
  const [providers, setProviders]   = useState<Provider[]>([]);
  const [apiLoaded, setApiLoaded]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState("all");
  const [sort, setSort]             = useState("rating");
  const [search, setSearch]         = useState("");
  const [location, setLocation]     = useState("");
  const [minBudget, setMinBudget]   = useState("");
  const [maxBudget, setMaxBudget]   = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search)    params.set("search",    search);
      if (sort)      params.set("sort",      sort);
      if (location)  params.set("location",  location);
      if (minBudget) params.set("minBudget", minBudget);
      if (maxBudget) params.set("maxBudget", maxBudget);

      const res  = await fetch(`/api/providers?${params.toString()}`);
      const data = await res.json();
      const list = data.providers || [];
      setApiLoaded(true);
      // Only use real data if DB is populated; fall back to mock if empty
      setProviders(list.length > 0 ? list : MOCK_PROVIDERS);
    } catch {
      setProviders(MOCK_PROVIDERS);
    } finally {
      setLoading(false);
    }
  }, [category, sort, search, location, minBudget, maxBudget]);

  useEffect(() => {
    const timer = setTimeout(fetchProviders, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchProviders]);

  const displayProviders = providers;
  const BADGE_COLORS: Record<string, string> = { "Top Rated": "gold", "Premium": "silver", "Elite": "elite", "Verified": "subtle" };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.orb1} aria-hidden="true" />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Verified Professionals</p>
        <h1 className={styles.title}>
          Find Your <span className="text-gold">Dream Team</span>
        </h1>
        <p className={styles.subtitle}>
          Browse elite occasion professionals, all verified by Chronos.
        </p>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}><Search size={18} /></span>
          <input
            id="providers-search"
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, service, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")} aria-label="Clear search" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          )}
        </div>

        {/* Match Me CTA */}
        <Link href="/match" className={styles.matchMeBtn} id="providers-match-me" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={16} /> Not sure? Let us match you <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Filters ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          {/* Category tabs */}
          <nav className={styles.tabs} aria-label="Filter by category">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                id={`filter-${c.value}`}
                className={`${styles.tab} ${category === c.value ? styles.tabActive : ""}`}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </button>
            ))}
          </nav>

          <div className={styles.filterRight}>
            {/* Advanced filters toggle */}
            <button
              className={`${styles.advancedBtn} ${showFilters ? styles.advancedBtnActive : ""}`}
              onClick={() => setShowFilters((s) => !s)}
              id="providers-advanced-filters"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Settings size={16} /> Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Sort */}
            <div className={styles.sortWrapper}>
              <label htmlFor="providers-sort" className={styles.sortLabel}>Sort by</label>
              <select
                id="providers-sort"
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced filter panel */}
        {showFilters && (
          <div className={styles.advancedPanel}>
            <div className={styles.advancedField}>
              <label className={styles.advancedLabel}>Location</label>
              <input
                className={styles.advancedInput}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Cairo, Alexandria"
                id="filter-location"
              />
            </div>
            <div className={styles.advancedField}>
              <label className={styles.advancedLabel}>Min Budget (EGP)</label>
              <input
                className={styles.advancedInput}
                type="number"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="0"
                id="filter-min-budget"
              />
            </div>
            <div className={styles.advancedField}>
              <label className={styles.advancedLabel}>Max Budget (EGP)</label>
              <input
                className={styles.advancedInput}
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="No limit"
                id="filter-max-budget"
              />
            </div>
            <button
              className={styles.clearFiltersBtn}
              onClick={() => { setLocation(""); setMinBudget(""); setMaxBudget(""); setCategory("all"); setSearch(""); }}
              id="clear-all-filters"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <main className={styles.results}>
        <div className={styles.resultsInner}>
          <p className={styles.resultsCount}>
            <span className="text-gold">{displayProviders.length}</span> providers found
            {!apiLoaded && " (loading...)"}
          </p>

          {displayProviders.length > 0 ? (
            <div className={styles.grid}>
              {displayProviders.map((p) => {
                const badgeColor = BADGE_COLORS[p.badge || ""] || "subtle";
                const badgeClassName = `badge${badgeColor.charAt(0).toUpperCase() + badgeColor.slice(1)}`;
                return (
                  <Link key={p.id} href={`/providers/${p.id}`} className={styles.card} id={`provider-card-${p.id}`}>
                    <div className={styles.cardImg} aria-hidden="true" style={{ position: "relative" }}>
                      <div className={styles.cardImgOverlay} />
                      {p.user?.avatarUrl ? (
                        <img
                          src={p.user.avatarUrl}
                          alt={p.businessName}
                          style={{ width: "72px", height: "72px", borderRadius: "12px", objectFit: "cover", border: "2px solid var(--color-border-gold)", position: "relative", zIndex: 2 }}
                        />
                      ) : (
                        <span className={styles.cardImgIcon}>
                          {p.categories[0] ? p.categories[0].charAt(0) : <Diamond size={24} />}
                        </span>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardCategory}>{p.categories[0]?.replace("_", " ").toLowerCase()}</span>
                        {p.location && <span className={styles.cardLocation} style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {p.location}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <h3 className={styles.cardName} style={{ margin: 0 }}>{p.businessName}</h3>
                        {p.isVerified && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "rgba(80,200,120,0.12)", border: "1px solid rgba(80,200,120,0.4)", borderRadius: "99px", padding: "0.1rem 0.45rem", fontSize: "0.62rem", fontWeight: 600, color: "#50c878", whiteSpace: "nowrap" }}>
                            <CheckCircle size={11} /> Verified
                          </span>
                        )}
                        {p.badge === "Top Rated" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "rgba(196,164,82,0.18)", border: "1px solid var(--color-gold)", borderRadius: "99px", padding: "0.1rem 0.45rem", fontSize: "0.62rem", fontWeight: 600, color: "var(--color-gold)", whiteSpace: "nowrap" }}>
                            <Star size={10} fill="currentColor" /> Top Rated
                          </span>
                        )}
                        {p.badge && p.badge !== "Top Rated" && (
                          <span className={`${styles.badge} ${styles[badgeClassName] || ""}`} style={{ position: "static", transform: "none" }}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                      {p.bio && <p className={styles.cardBio}>{p.bio.slice(0, 120)}{p.bio.length > 120 ? "…" : ""}</p>}
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.cardRating}>
                        <Stars rating={p.avgRating || 0} />
                        <span className={styles.cardRatingValue}>{(p.avgRating || 0).toFixed(1)}</span>
                        <span className={styles.cardReviews}>({p.reviewCount || 0})</span>
                      </div>
                      <div className={styles.cardPrice}>
                        {p.minPrice > 0 && (
                          <>
                            <span className={styles.cardPriceFrom}>from</span>
                            <span className={styles.cardPriceValue}>{formatPrice(p.minPrice)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{loading ? "Loading providers…" : "No providers found"}</p>
              <p className={styles.emptyDesc}>Try adjusting your search or filters.</p>
              <button className={styles.emptyReset} onClick={() => { setSearch(""); setCategory("all"); setLocation(""); setMinBudget(""); setMaxBudget(""); }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

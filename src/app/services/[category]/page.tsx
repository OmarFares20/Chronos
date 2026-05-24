"use client";
import styles from "../../providers/page.module.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/formatPrice";

// ── Category config ─────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { title: string; desc: string; icon: string }> = {
  photography: { title: "Photography",  desc: "Award-winning visual storytellers capturing your most cherished moments.",   icon: "◈" },
  catering:    { title: "Catering",     desc: "Michelin-trained chefs and culinary artists for every occasion.",             icon: "◇" },
  decor:       { title: "Décor",        desc: "Transformative environments crafted with bespoke floral and design artistry.", icon: "◆" },
  music:       { title: "Live Music",   desc: "From string quartets to full jazz ensembles — elevate your event's soul.",     icon: "♬" },
  planning:    { title: "Planning",     desc: "End-to-end orchestration by expert planners who live for the details.",        icon: "◉" },
  venue:       { title: "Venues",       desc: "Extraordinary spaces that transform any gathering into a landmark occasion.",  icon: "⬡" },
  transport:   { title: "Transport",    desc: "Luxury vehicles and professional chauffeurs for seamless event logistics.",    icon: "◎" },
  security:    { title: "Security",     desc: "Professional, discreet event security ensuring safety for every guest.",       icon: "⊕" },
};

const PROVIDERS = [
  { id:"1",  name:"Lumière Studios",    category:"photography", rating:4.9, reviews:142, price:2800, badge:"Top Rated", location:"Cairo",      tags:["Weddings","Editorial","Luxury"],         bio:"Award-winning studio specialising in timeless wedding coverage." },
  { id:"2",  name:"The Golden Fork",   category:"catering",    rating:4.8, reviews:98,  price:120,  badge:"Premium",  location:"Alexandria", tags:["Fine Dining","Buffet","International"],  bio:"Michelin-trained chefs crafting bespoke culinary experiences." },
  { id:"3",  name:"Elysium Décor",     category:"decor",       rating:5.0, reviews:67,  price:5000, badge:"Elite",    location:"Cairo",      tags:["Floral","Luxury","Thematic"],            bio:"Transforming spaces into extraordinary environments." },
  { id:"4",  name:"The Ivory Quartet", category:"music",       rating:4.9, reviews:53,  price:1600, badge:"Top Rated",location:"Giza",       tags:["Classical","Jazz","Acoustic"],           bio:"Live music that elevates atmosphere from intimate to grand." },
  { id:"5",  name:"Chronos Planners",  category:"planning",    rating:4.7, reviews:201, price:3500, badge:"Verified", location:"Cairo",      tags:["Full Service","Day-Of","Destination"],   bio:"End-to-end event orchestration — every thread tended." },
  { id:"6",  name:"The Marble Hall",   category:"venue",       rating:4.8, reviews:176, price:8000, badge:"Premium",  location:"New Cairo",  tags:["Grand","Indoor","Capacity 500+"],        bio:"5,000 sqm of marble elegance for your most cherished occasions." },
  { id:"7",  name:"Horizon Films",     category:"photography", rating:4.6, reviews:88,  price:1800, badge:"Verified", location:"Alexandria", tags:["Cinematic","Drone","Corporate"],         bio:"Cinematic storytellers with a sweeping visual and documentary eye." },
  { id:"8",  name:"Saffron Collective",category:"catering",    rating:4.9, reviews:115, price:85,   badge:"Top Rated",location:"Cairo",      tags:["Middle Eastern","Fusion","Healthy"],     bio:"Bold flavours rooted in tradition — custom menus for any event." },
  { id:"9",  name:"Eden Floral Studio",category:"decor",       rating:4.7, reviews:44,  price:3200, badge:"Verified", location:"Cairo",      tags:["Floral","Organic","Sustainable"],        bio:"Nature-inspired floral design that breathes life into any venue." },
  { id:"10", name:"Velocity VIP",      category:"transport",   rating:4.8, reviews:62,  price:500,  badge:"Premium",  location:"Cairo",      tags:["Luxury","Fleet","Chauffeur"],            bio:"Premium fleet of luxury vehicles with professional chauffeurs." },
];

const SORT_OPTIONS = [
  { value: "rating",     label: "Top Rated" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "reviews",    label: "Most Reviewed" },
];

const BADGE_COLORS: Record<string, string> = {
  "Top Rated": "badgeGold",
  "Premium":   "badgeSilver",
  "Elite":     "badgeElite",
  "Verified":  "badgeSubtle",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < Math.floor(rating) ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

export default function ServiceCategoryPage() {
  const params = useParams();
  const category = (params?.category as string)?.toLowerCase() || "photography";
  const meta = CATEGORY_META[category] || { title: category, desc: "", icon: "◈" };

  const [sort, setSort] = useState("rating");
  const [search, setSearch] = useState("");

  const filtered = PROVIDERS
    .filter((p) => p.category === category)
    .filter((p) => {
      const q = search.toLowerCase();
      return !q || p.name.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sort === "rating")      return b.rating - a.rating;
      if (sort === "price_asc")   return a.price - b.price;
      if (sort === "price_desc")  return b.price - a.price;
      if (sort === "reviews")     return b.reviews - a.reviews;
      return 0;
    });

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.orb1} aria-hidden="true" />

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{meta.icon}  {meta.title} Professionals</p>
        <h1 className={styles.title}>
          Find Your <span className="text-gold">{meta.title}</span> Expert
        </h1>
        <p className={styles.subtitle}>{meta.desc}</p>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
          <Link href="/providers" style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", textDecoration: "none" }}>
            All Providers
          </Link>
          <span style={{ color: "var(--color-text-muted)" }}>›</span>
          <span style={{ fontSize: "0.82rem", color: "var(--color-gold)" }}>{meta.title}</span>
        </div>

        {/* Search */}
        <div className={styles.searchWrapper} style={{ marginTop: "1.5rem" }}>
          <span className={styles.searchIcon}>⊕</span>
          <input
            id="category-search"
            type="text"
            className={styles.searchInput}
            placeholder={`Search ${meta.title.toLowerCase()} professionals...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")} aria-label="Clear search">✕</button>
          )}
        </div>
      </section>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          {/* Category quick links */}
          <nav className={styles.tabs} aria-label="Other categories">
            {Object.entries(CATEGORY_META).map(([slug, m]) => (
              <Link
                key={slug}
                href={`/services/${slug}`}
                id={`cat-tab-${slug}`}
                className={`${styles.tab} ${slug === category ? styles.tabActive : ""}`}
              >
                {m.icon} {m.title}
              </Link>
            ))}
          </nav>
          {/* Sort */}
          <div className={styles.sortWrapper}>
            <label htmlFor="category-sort" className={styles.sortLabel}>Sort by</label>
            <select id="category-sort" className={styles.sortSelect} value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <main className={styles.results}>
        <div className={styles.resultsInner}>
          <p className={styles.resultsCount}>
            <span className="text-gold">{filtered.length}</span> {meta.title.toLowerCase()} providers found
          </p>

          {filtered.length > 0 ? (
            <div className={styles.grid}>
              {filtered.map((p) => {
                const badgeClassName = BADGE_COLORS[p.badge] || "badgeSubtle";
                return (
                  <Link key={p.id} href={`/providers/${p.id}`} className={styles.card} id={`category-card-${p.id}`}>
                    <div className={styles.cardImg} aria-hidden="true">
                      <div className={styles.cardImgOverlay} />
                      <span className={styles.cardImgIcon}>{meta.icon}</span>
                      <span className={`${styles.badge} ${styles[badgeClassName] || ""}`}>{p.badge}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardCategory}>{meta.title}</span>
                        <span className={styles.cardLocation}>◎ {p.location}</span>
                      </div>
                      <h3 className={styles.cardName}>{p.name}</h3>
                      <p className={styles.cardBio}>{p.bio}</p>
                      <div className={styles.cardTags}>
                        {p.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.cardRating}>
                        <Stars rating={p.rating} />
                        <span className={styles.cardRatingValue}>{p.rating}</span>
                        <span className={styles.cardReviews}>({p.reviews})</span>
                      </div>
                      <div className={styles.cardPrice}>
                        <span className={styles.cardPriceFrom}>from</span>
                        <span className={styles.cardPriceValue}>{formatPrice(p.price)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No {meta.title.toLowerCase()} providers found</p>
              <p className={styles.emptyDesc}>
                {search ? "Try adjusting your search." : "No providers available in this category yet."}
              </p>
              {search && (
                <button className={styles.emptyReset} onClick={() => setSearch("")}>Clear Search</button>
              )}
              <Link href="/providers" className={styles.emptyReset} style={{ marginTop: "0.5rem", display: "inline-block" }}>
                View All Providers →
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer CTA */}
      <div style={{ textAlign: "center", padding: "3rem 2rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1rem", fontSize: "0.9rem" }}>
          Looking for something else?
        </p>
        <Link href="/providers" style={{ color: "var(--color-gold)", fontSize: "0.9rem", textDecoration: "none" }}>
          Browse all providers →
        </Link>
      </div>
    </div>
  );
}

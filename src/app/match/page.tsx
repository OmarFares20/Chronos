"use client";
import styles from "./match.module.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/formatPrice";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const TODAY = typeof window !== "undefined" ? new Date().toISOString().slice(0, 10) : "";

interface Provider {
  id: string;
  businessName: string;
  bio?: string;
  location?: string;
  avgRating: number;
  reviewCount: number;
  minPrice: number;
  categories: string[];
}

const EVENT_TYPES = ["Wedding", "Corporate Occasion", "Birthday", "Anniversary", "Graduation", "Baby Shower", "Gala / Charity", "Other"];
const BUDGETS = [
  { label: "Under 5,000 EGP",        min: 0,     max: 5000   },
  { label: "5,000 – 15,000 EGP",     min: 5000,  max: 15000  },
  { label: "15,000 – 50,000 EGP",    min: 15000, max: 50000  },
  { label: "50,000 – 150,000 EGP",   min: 50000, max: 150000 },
  { label: "150,000+ EGP",           min: 150000, max: 9999999 },
];
const GUESTS = [
  { label: "Under 50",    value: "50"   },
  { label: "50 – 150",    value: "150"  },
  { label: "150 – 300",   value: "300"  },
  { label: "300 – 500",   value: "500"  },
  { label: "500+",        value: "500+" },
];
const LOCATIONS = ["Cairo", "Alexandria", "Giza", "New Cairo", "Sheikh Zayed", "Other"];
const CATEGORIES = ["Photography", "Catering", "Décor", "Venue", "Live Music", "Planning", "Videography", "Transport"];

const CATEGORY_MAP: Record<string, string> = {
  "Photography":  "PHOTOGRAPHY",
  "Catering":     "CATERING",
  "Décor":        "DECOR",
  "Venue":        "VENUE",
  "Live Music":   "MUSIC",
  "Planning":     "PLANNING",
  "Videography":  "VIDEOGRAPHY",
  "Transport":    "TRANSPORT",
};

const STEPS_CONFIG = [
  { step: 1, question: "What type of occasion are you planning?",       type: "chips", options: EVENT_TYPES },
  { step: 2, question: "When is your occasion?",                        type: "date"  },
  { step: 3, question: "Where will the occasion be held?",              type: "chips", options: LOCATIONS },
  { step: 4, question: "What is your total budget?",                 type: "chips", options: BUDGETS.map((b) => b.label) },
  { step: 5, question: "How many guests are you expecting?",         type: "chips", options: GUESTS.map((g) => g.label) },
  { step: 6, question: "What services are you looking for?",         type: "chips-multi", options: CATEGORIES, multi: true },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "flex", gap: "2px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < Math.floor(rating) ? "var(--color-gold)" : "var(--color-border)" }}>★</span>
      ))}
    </span>
  );
}

export default function MatchPage() {
  const [step, setStep]               = useState<Step>(1);
  const [eventType, setEventType]     = useState("");
  const [eventDate, setEventDate]     = useState("");
  const [location, setLocation]       = useState("");
  const [budget, setBudget]           = useState("");
  const [guests, setGuests]           = useState("");
  const [services, setServices]       = useState<string[]>([]);
  const [results, setResults]         = useState<Provider[]>([]);
  const [loading, setLoading]         = useState(false);

  const toggleService = (s: string) =>
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const progress = ((step - 1) / 5) * 100;

  const runSearch = async () => {
    setLoading(true);
    setResults([]);
    try {
      const budgetObj = BUDGETS.find((b) => b.label === budget);
      const params = new URLSearchParams();
      // Location filter (skip "Other" — too generic)
      if (location && location !== "Other") params.set("location", location);
      // Budget filter
      if (budgetObj) {
        params.set("minBudget", String(budgetObj.min));
        params.set("maxBudget", String(budgetObj.max));
      }
      // Multi-category OR filter — send all selected categories
      if (services.length > 0) {
        const cats = services.map((s) => CATEGORY_MAP[s]).filter(Boolean);
        if (cats.length > 0) params.set("categories", cats.join(","));
      }
      params.set("sort", "rating");
      params.set("limit", "20");

      const res = await fetch(`/api/providers?${params.toString()}`);
      const data = await res.json();
      let found: Provider[] = data.providers || [];

      // If location filter returned 0 results, retry without location constraint
      if (found.length === 0 && location && location !== "Other") {
        params.delete("location");
        const res2 = await fetch(`/api/providers?${params.toString()}`);
        const data2 = await res2.json();
        found = data2.providers || [];
      }

      setResults(found);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    if (step < 6) {
      setStep((s) => (s + 1) as Step);
    } else {
      // step === 6: run search and reveal results
      await runSearch();
    }
  };

  const canProceed = () => {
    if (step === 1) return !!eventType;
    if (step === 2) return !!eventDate;
    if (step === 3) return !!location;
    if (step === 4) return !!budget;
    if (step === 5) return !!guests;
    if (step === 6) return services.length > 0;
    return false;
  };

  const showResults = results.length > 0 || (loading === false && step === 6 && results.length === 0);
  const hasSearched = step === 6 && !loading && results.length === 0;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <div className={styles.container}>
        {/* Hero */}
        <div className={styles.heroSection}>
          <p className={styles.eyebrow}>✦ Match Me</p>
          <h1 className={styles.title}>Find Your <span className="text-gold">Perfect Team</span></h1>
          <p className={styles.subtitle}>Answer 5 quick questions and we&apos;ll match you with the ideal occasion professionals.</p>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.progressLabel}>Step {step} of 6</p>

        {/* Quiz card — always shown while stepping through questions */}
        {!(results.length > 0 || hasSearched) && (
          <div className={styles.quizCard}>
            <h2 className={styles.question}>{STEPS_CONFIG[step - 1].question}</h2>

            {/* Step 1, 3, 4, 5 — chips */}
            {(step === 1 || step === 3 || step === 4 || step === 5) && (
              <div className={styles.chipsGrid}>
                {(STEPS_CONFIG[step - 1].options as string[]).map((opt) => {
                  const selected =
                    step === 1 ? eventType === opt :
                    step === 3 ? location === opt :
                    step === 4 ? budget === opt :
                    guests === opt;
                  return (
                    <button
                      key={opt}
                      className={`${styles.chip} ${selected ? styles.chipActive : ""}`}
                      onClick={() => {
                        if (step === 1) setEventType(opt);
                        if (step === 3) setLocation(opt);
                        if (step === 4) setBudget(opt);
                        if (step === 5) setGuests(opt);
                      }}
                      id={`match-opt-${opt.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2 — date */}
            {step === 2 && (
              <input
                type="date"
                className={styles.dateInput}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={TODAY}
                id="match-event-date"
              />
            )}

            {/* Step 6 — multi-select services */}
            {step === 6 && (
              <div className={styles.chipsGrid}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`${styles.chip} ${services.includes(cat) ? styles.chipActive : ""}`}
                    onClick={() => toggleService(cat)}
                    id={`match-service-${cat.toLowerCase()}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.quizActions}>
              {step > 1 && (
                <button className={styles.backBtn} onClick={() => setStep((s) => (s - 1) as Step)} id="match-back">
                  ← Back
                </button>
              )}
              <button
                className={styles.nextBtn}
                onClick={next}
                disabled={!canProceed() || loading}
                id="match-next"
              >
                {loading ? "Searching..." : step === 6 ? "Find My Match ✦" : "Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* Results — shown after search, below the quiz */}
        {(results.length > 0 || hasSearched) && (
          <div className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                {results.length > 0
                  ? <><span className="text-gold">{results.length}</span> providers matched for you</>  
                  : <span style={{ color: "var(--color-text-secondary)" }}>No exact matches found</span>
                }
              </h2>
              <button className={styles.resetBtn} onClick={() => { setStep(1); setResults([]); setServices([]); setEventType(""); setLocation(""); setBudget(""); setGuests(""); setEventDate(""); }} id="match-reset">
                Start Over
              </button>
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                <div style={{ width: 32, height: 32, border: "3px solid var(--color-border)", borderTopColor: "var(--color-gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
                Searching our network of providers...
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className={styles.resultsGrid}>
                {results.slice(0, 12).map((p) => (
                  <Link key={p.id} href={`/providers/${p.id}`} className={styles.resultCard} id={`match-result-${p.id}`}>
                    <div className={styles.resultAvatar}>
                      {p.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.resultInfo}>
                      <p className={styles.resultName}>{p.businessName}</p>
                      {p.location && <p className={styles.resultLocation}>◎ {p.location}</p>}
                      <div className={styles.resultRating}>
                        <Stars rating={p.avgRating || 0} />
                        <span className={styles.resultRatingVal}>{(p.avgRating || 0).toFixed(1)}</span>
                        <span className={styles.resultReviews}>({p.reviewCount || 0})</span>
                      </div>
                      {p.minPrice > 0 && <p className={styles.resultPrice}>from {formatPrice(p.minPrice)}</p>}
                    </div>
                    <span className={styles.resultArrow}>→</span>
                  </Link>
                ))}
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className={styles.noResults}>
                <p>No providers matched your exact criteria. Here are some top-rated providers you may like:</p>
                <Link href="/providers" className={styles.browseBtn} id="match-browse-all">Browse All Providers →</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

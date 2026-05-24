"use client";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Diamond, Check, Plus, ArrowLeft, ArrowRight, Sparkles, Gem, Music, CircleDot, Hexagon, Component } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type EventType = "wedding" | "corporate" | "birthday" | "gala" | "conference" | "social" | "";

interface EventData {
  name: string;
  type: EventType;
  date: string;
  endDate: string;
  guests: string;
  location: string;
  budget: string;
  services: string[];
  vision: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { value: "wedding",    icon: <Diamond size={24} strokeWidth={1} />, label: "Wedding" },
  { value: "corporate",  icon: <Gem size={24} strokeWidth={1} />, label: "Corporate" },
  { value: "birthday",   icon: <Music size={24} strokeWidth={1} />, label: "Birthday" },
  { value: "gala",       icon: <CircleDot size={24} strokeWidth={1} />, label: "Gala" },
  { value: "conference", icon: <Hexagon size={24} strokeWidth={1} />, label: "Conference" },
  { value: "social",     icon: <Component size={24} strokeWidth={1} />, label: "Social" },
];

const SERVICES = [
  { id: "photography", label: "Photography" },
  { id: "catering",    label: "Catering" },
  { id: "decor",       label: "Décor" },
  { id: "music",       label: "Live Music" },
  { id: "planning",    label: "Full Planning" },
  { id: "venue",       label: "Venue" },
  { id: "transport",   label: "Transport" },
  { id: "security",    label: "Security" },
];

const BUDGETS = [
  { value: "5000",   label: "Under $5,000" },
  { value: "15000",  label: "$5,000 – $15,000" },
  { value: "30000",  label: "$15,000 – $30,000" },
  { value: "60000",  label: "$30,000 – $60,000" },
  { value: "100000", label: "$60,000 – $100,000" },
  { value: "100001", label: "$100,000+" },
];

const STEPS = ["Occasion Type", "Details", "Services", "Vision"];

// ── Component ──────────────────────────────────────────────────────────────
export default function PlanEventPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<EventData>({
    name: "", type: "", date: "", endDate: "",
    guests: "", location: "", budget: "", services: [], vision: "",
  });

  // Compute today's date string for min constraints (no past dates)
  const TODAY = new Date().toISOString().slice(0, 10);

  const update = (field: keyof EventData, value: string | string[]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const toggleService = (id: string) => {
    setData((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }));
  };

  const canNext = () => {
    if (step === 0) return data.type !== "";
    if (step === 1) return data.name && data.date && data.guests && data.location && data.budget;
    if (step === 2) return data.services.length > 0;
    return true;
  };

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        router.push("/providers");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Ambient orbs */}
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.eyebrow}>Plan Your Occasion</p>
          <h1 className={styles.title}>
            Craft Your <span className="text-gold">Timeless</span> Occasion
          </h1>
          <p className={styles.subtitle}>
            Tell us about your vision — we&apos;ll connect you with the perfect team.
          </p>
        </div>

        {/* Progress bar */}
        <div className={styles.progress} role="progressbar" aria-valuenow={step + 1} aria-valuemax={STEPS.length}>
          {STEPS.map((label, i) => (
            <div key={label} className={styles.progressStep}>
              <div className={`${styles.progressDot} ${i <= step ? styles.progressDotActive : ""} ${i < step ? styles.progressDotDone : ""}`}>
                {i < step ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`${styles.progressLabel} ${i <= step ? styles.progressLabelActive : ""}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`${styles.progressLine} ${i < step ? styles.progressLineDone : ""}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className={styles.card}>
          {/* ── Step 0: Event Type ── */}
          {step === 0 && (
            <div className={styles.stepContent} key="step0">
              <h2 className={styles.stepTitle}>What type of occasion are you planning?</h2>
              <div className={styles.typeGrid}>
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    id={`event-type-${t.value}`}
                    className={`${styles.typeCard} ${data.type === t.value ? styles.typeCardActive : ""}`}
                    onClick={() => update("type", t.value as EventType)}
                  >
                    <span className={styles.typeIcon}>{t.icon}</span>
                    <span className={styles.typeLabel}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div className={styles.stepContent} key="step1">
              <h2 className={styles.stepTitle}>Tell us the details</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.fieldGroup} ${styles.spanFull}`}>
                  <label htmlFor="event-name" className={styles.label}>Occasion Name</label>
                  <input id="event-name" type="text" className={styles.input}
                    placeholder="e.g. Smith & Johnson Wedding" value={data.name}
                    onChange={(e) => update("name", e.target.value)} required />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="event-date" className={styles.label}>Start Date</label>
                  <input id="event-date" type="date" className={styles.input}
                    value={data.date} onChange={(e) => update("date", e.target.value)}
                    min={TODAY} required />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="event-end-date" className={styles.label}>End Date <span className={styles.optional}>(optional)</span></label>
                  <input id="event-end-date" type="date" className={styles.input}
                    value={data.endDate} onChange={(e) => update("endDate", e.target.value)}
                    min={data.date || TODAY} />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="event-guests" className={styles.label}>Expected Guests</label>
                  <input id="event-guests" type="number" className={styles.input}
                    placeholder="e.g. 150" min="1" value={data.guests}
                    onChange={(e) => update("guests", e.target.value)} required />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="event-location" className={styles.label}>Location / City</label>
                  <input id="event-location" type="text" className={styles.input}
                    placeholder="e.g. Cairo, Egypt" value={data.location}
                    onChange={(e) => update("location", e.target.value)} required />
                </div>

                <div className={`${styles.fieldGroup} ${styles.spanFull}`}>
                  <label className={styles.label}>Estimated Budget</label>
                  <div className={styles.budgetGrid}>
                    {BUDGETS.map((b) => (
                      <button key={b.value} type="button" id={`budget-${b.value}`}
                        className={`${styles.budgetBtn} ${data.budget === b.value ? styles.budgetBtnActive : ""}`}
                        onClick={() => update("budget", b.value)}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Services ── */}
          {step === 2 && (
            <div className={styles.stepContent} key="step2">
              <h2 className={styles.stepTitle}>Which services do you need?</h2>
              <p className={styles.stepDesc}>Select all that apply — we&apos;ll find specialists for each.</p>
              <div className={styles.servicesGrid}>
                {SERVICES.map((s) => (
                  <button key={s.id} type="button" id={`service-pick-${s.id}`}
                    className={`${styles.serviceChip} ${data.services.includes(s.id) ? styles.serviceChipActive : ""}`}
                    onClick={() => toggleService(s.id)}>
                    <span className={styles.chipCheck} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {data.services.includes(s.id) ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                    </span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Vision ── */}
          {step === 3 && (
            <div className={styles.stepContent} key="step3">
              <h2 className={styles.stepTitle}>Describe your vision</h2>
              <p className={styles.stepDesc}>
                Paint us a picture — the atmosphere, the feeling, the details that matter most to you.
              </p>
              <div className={styles.fieldGroup}>
                <label htmlFor="event-vision" className={styles.label}>Your Vision</label>
                <textarea id="event-vision" className={styles.textarea} rows={7}
                  placeholder="e.g. We envision an intimate garden ceremony at sunset, with warm candlelight, floral archways, and a live string quartet..."
                  value={data.vision} onChange={(e) => update("vision", e.target.value)} />
              </div>

              {/* Summary card */}
              <div className={styles.summary}>
                <p className={styles.summaryTitle}>Your Occasion Summary</p>
                <div className={styles.summaryGrid}>
                  <span className={styles.summaryLabel}>Type</span>
                  <span className={styles.summaryValue}>{EVENT_TYPES.find(t => t.value === data.type)?.label}</span>
                  <span className={styles.summaryLabel}>Name</span>
                  <span className={styles.summaryValue}>{data.name || "—"}</span>
                  <span className={styles.summaryLabel}>Date</span>
                  <span className={styles.summaryValue}>{data.date || "—"}</span>
                  <span className={styles.summaryLabel}>Guests</span>
                  <span className={styles.summaryValue}>{data.guests || "—"}</span>
                  <span className={styles.summaryLabel}>Location</span>
                  <span className={styles.summaryValue}>{data.location || "—"}</span>
                  <span className={styles.summaryLabel}>Services</span>
                  <span className={styles.summaryValue}>{data.services.join(", ") || "—"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className={styles.navRow}>
            {step > 0 ? (
              <button type="button" className={styles.btnBack} onClick={() => setStep(s => s - 1)} id="plan-back" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <Link href="/" className={styles.btnBack} id="plan-cancel" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={16} /> Cancel
              </Link>
            )}

            {step < STEPS.length - 1 ? (
              <button type="button" className={styles.btnNext}
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()} id="plan-next"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className={styles.btnSubmit} id="plan-submit" disabled={submitting} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {submitting ? "Finalizing..." : <>Find My Dream Team <Sparkles size={16} /></>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

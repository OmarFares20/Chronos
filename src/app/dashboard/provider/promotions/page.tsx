"use client";
import dashStyles from "../../page.module.css";
import styles from "./promotions.module.css";
import { useState } from "react";
import { formatPrice } from "@/lib/formatPrice";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Promotion {
  id: string;
  title: string;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  code?: string | null;
  minAmount?: number | null;
  expiresAt?: string | null;
  maxUsage?: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_FORM = {
  title: "",
  type: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
  value: "",
  code: "",
  minAmount: "",
  expiresAt: "",
  maxUsage: "",
};

export default function ProviderPromotionsPage() {
  const { data, isLoading: loading, mutate } = useSWR("/api/provider/promotions", fetcher);
  const promotions: Promotion[] = data?.promotions || [];

  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/provider/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:     form.title,
          type:      form.type,
          value:     Number(form.value),
          code:      form.code     || undefined,
          minAmount: form.minAmount ? Number(form.minAmount) : undefined,
          expiresAt: form.expiresAt || undefined,
          maxUsage:  form.maxUsage  ? Number(form.maxUsage)  : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create."); return; }
      setShowForm(false);
      setForm(DEFAULT_FORM);
      mutate();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    await fetch(`/api/provider/promotions?id=${id}`, { method: "DELETE" });
    mutate();
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    setForm((f) => ({ ...f, code: Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") }));
  };

  const active   = promotions.filter((p) => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > new Date()));
  const expired  = promotions.filter((p) => !p.isActive || (p.expiresAt && new Date(p.expiresAt) <= new Date()));

  return (
    <div className={dashStyles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={dashStyles.sectionTitle}>Promotions</h2>
          <p className={styles.subtitle}>Create discount codes and special offers for your clients.</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowForm((s) => !s)} id="create-promo-btn">
          {showForm ? "✕ Cancel" : "+ Create Promotion"}
        </button>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error && <div className={styles.errorBanner}>{error}</div>}
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>Title *</label>
              <input className={styles.input} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Sale 20%" required />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Type *</label>
              <select className={styles.input} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount ($)</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Value *</label>
              <input className={styles.input} type="number" min={0} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder={form.type === "PERCENTAGE" ? "e.g. 15" : "e.g. 500"} required />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Min. Order Amount</label>
              <input className={styles.input} type="number" min={0} value={form.minAmount} onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))} placeholder="Optional" />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Expires At</label>
              <input className={styles.input} type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Max Uses</label>
              <input className={styles.input} type="number" min={1} value={form.maxUsage} onChange={(e) => setForm((f) => ({ ...f, maxUsage: e.target.value }))} placeholder="Unlimited" />
            </div>
            <div className={`${styles.formField} ${styles.codeField}`}>
              <label className={styles.label}>Promo Code (optional)</label>
              <div className={styles.codeRow}>
                <input className={styles.input} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Leave blank for no code" style={{ flex: 1 }} />
                <button type="button" className={styles.generateBtn} onClick={generateCode} id="generate-code-btn">Generate</button>
              </div>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn} disabled={saving} id="save-promo-btn">
              {saving ? "Saving..." : "Create Promotion"}
            </button>
          </div>
        </form>
      )}

      {/* ── Active promotions ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Active <span className={styles.countBadge}>{active.length}</span></h3>
        {loading ? <p className={styles.empty}>Loading...</p> : active.length === 0 ? (
          <p className={styles.empty}>No active promotions yet. Create your first one!</p>
        ) : (
          <div className={styles.promoGrid}>
            {active.map((p) => <PromoCard key={p.id} p={p} onDelete={handleDelete} />)}
          </div>
        )}
      </section>

      {/* ── Expired/inactive ── */}
      {expired.length > 0 && (
        <section className={styles.section}>
          <h3 className={`${styles.sectionTitle} ${styles.sectionTitleMuted}`}>Expired / Inactive <span className={styles.countBadge}>{expired.length}</span></h3>
          <div className={styles.promoGrid}>
            {expired.map((p) => <PromoCard key={p.id} p={p} onDelete={handleDelete} expired />)}
          </div>
        </section>
      )}
    </div>
  );
}

function PromoCard({ p, onDelete, expired = false }: { p: Promotion; onDelete: (id: string) => void; expired?: boolean }) {
  const copyCode = () => { if (p.code) navigator.clipboard.writeText(p.code); };
  return (
    <div className={`${styles.promoCard} ${expired ? styles.promoCardExpired : ""}`} id={`promo-${p.id}`}>
      <div className={styles.promoTop}>
        <div>
          <p className={styles.promoTitle}>{p.title}</p>
          <p className={styles.promoValue}>
            {p.type === "PERCENTAGE" ? `${p.value}% off` : `${formatPrice(Number(p.value))} off`}
            {p.minAmount ? ` · min ${formatPrice(Number(p.minAmount))}` : ""}
          </p>
        </div>
        <button className={styles.deleteBtn} onClick={() => onDelete(p.id)} aria-label="Delete promotion">✕</button>
      </div>
      {p.code && (
        <div className={styles.codeChip} onClick={copyCode} title="Click to copy">
          <span className={styles.codeLabel}>CODE</span>
          <span className={styles.codeValue}>{p.code}</span>
          <span className={styles.copyHint}>📋</span>
        </div>
      )}
      <div className={styles.promoMeta}>
        <span>{p.usageCount} / {p.maxUsage ?? "∞"} used</span>
        {p.expiresAt && <span>Expires {new Date(p.expiresAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}

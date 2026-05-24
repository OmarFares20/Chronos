"use client";
import styles from "../../page.module.css";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toaster";
import { Wallet, ShieldCheck, TrendingUp, Clock, Check, CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import useSWR from "swr";

interface BarItem { label: string; value: number; pct: number; }

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EarningsPage() {
  const { toast } = useToast();
  const { data, isLoading: loading } = useSWR("/api/bookings", fetcher);
  const bookings = data?.bookings || [];

  const completed  = bookings.filter((b: any) => ["COMPLETED","RELEASED"].includes(b.status));
  const inEscrow   = bookings.filter((b: any) => b.status === "IN_ESCROW");
  const pending    = bookings.filter((b: any) => b.status === "PENDING");

  const totalEarned  = completed.reduce((s: number, b: any) => s + Number(b.providerPayout || b.amount || 0), 0);
  const escrowTotal  = inEscrow.reduce( (s: number, b: any) => s + Number(b.amount || 0), 0);
  const thisMonth    = completed
    .filter((b: any) => new Date(b.updatedAt).getMonth() === new Date().getMonth())
    .reduce((s: number, b: any) => s + Number(b.providerPayout || b.amount || 0), 0);

  // Build monthly earnings bar data (last 6 months)
  const monthBars: BarItem[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("default", { month: "short" });
    const val = completed
      .filter((b: any) => {
        const bd = new Date(b.updatedAt);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      })
      .reduce((s: number, b: any) => s + Number(b.providerPayout || b.amount || 0), 0);
    monthBars.push({ label, value: val, pct: 0 });
  }
  const maxBar = Math.max(...monthBars.map((m) => m.value), 1);
  monthBars.forEach((m) => (m.pct = (m.value / maxBar) * 100));

  const STATS = [
    { icon: <Wallet size={20} strokeWidth={1.5} />, label: "Lifetime Earned", value: formatPrice(totalEarned), gold: true },
    { icon: <ShieldCheck size={20} strokeWidth={1.5} />, label: "In Escrow",       value: formatPrice(escrowTotal), gold: false },
    { icon: <TrendingUp size={20} strokeWidth={1.5} />,  label: "This Month",      value: formatPrice(thisMonth),  gold: false },
    { icon: <Clock size={20} strokeWidth={1.5} />,  label: "Pending Jobs",    value: pending.length.toString(),          gold: false },
  ];

  return (
    <div className={styles.page}>
      <h2 className={styles.sectionTitle} style={{ marginBottom: "1.5rem" }}>Earnings & Payouts</h2>

      {/* Summary stats */}
      <div className={styles.statsRow} style={{ marginBottom: "2rem" }}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue} style={s.gold ? { background: "var(--gradient-gold)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : {}}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem", marginBottom: "2rem" }}>
        <p className={styles.eventName} style={{ marginBottom: "1.25rem" }}>Earnings — Last 6 Months</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", height: 140 }}>
          {monthBars.map((m) => (
            <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--color-gold)" }}>
                {m.value > 0 ? formatPrice(m.value) : ""}
              </span>
              <div
                style={{
                  width: "100%",
                  borderRadius: "6px 6px 0 0",
                  background: m.pct === 100
                    ? "var(--gradient-gold)"
                    : "rgba(196,164,82,0.2)",
                  border: "1px solid rgba(196,164,82,0.25)",
                  height: m.pct > 0 ? `${Math.max(m.pct, 4)}%` : "4px",
                  transition: "height 0.8s ease",
                  minHeight: 4,
                }}
              />
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout history */}
      <div style={{ marginBottom: "2rem" }}>
        <p className={styles.eventName} style={{ marginBottom: "1rem" }}>Payout History</p>
        {loading ? (
          <p className={styles.eventMeta}>Loading...</p>
        ) : completed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.07)" }}>
            <p className={styles.eventMeta}>No payouts yet. Accept bookings to start earning.</p>
          </div>
        ) : (
          <div className={styles.bookingsList}>
            {completed.map((b: any) => (
              <div key={b.id} className={styles.bookingRow}>
                <div className={styles.bookingAvatar} style={{ color: "#4ade80", borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={20} strokeWidth={3} />
                </div>
                <div className={styles.bookingInfo}>
                  <p className={styles.bookingProvider}>{b.customer?.name || "Client"}</p>
                  <p className={styles.bookingService}>
                    {b.event?.name || "Event"} · {new Date(b.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className={styles.bookingRight}>
                  <p className={styles.bookingAmount} style={{ color: "#4ade80" }}>
                    +{formatPrice(Number(b.providerPayout || b.amount || 0))}
                  </p>
                  <span className={`${styles.statusPill} ${styles.statusConfirmed}`}>Released</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stripe CTA */}
      <div style={{ background: "linear-gradient(135deg, rgba(99,91,255,0.08) 0%, rgba(196,164,82,0.06) 100%)", border: "1px solid rgba(99,91,255,0.2)", borderRadius: 16, padding: "2rem", display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center", color: "#635bff" }}><CreditCard size={40} /></span>
        <div style={{ flex: 1 }}>
          <p className={styles.bookingProvider} style={{ marginBottom: "0.3rem" }}>Connect to Stripe</p>
          <p className={styles.eventMeta} style={{ marginBottom: "1rem" }}>
            Link your Stripe account to receive instant payouts once escrow funds are released after your events.
          </p>
          <button className={styles.btnGold} id="connect-stripe-btn"
            onClick={() => toast("Stripe Connect coming soon!", "success")}>
            Connect Stripe Account →
          </button>
        </div>
      </div>
    </div>
  );
}

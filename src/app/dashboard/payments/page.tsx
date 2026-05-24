"use client";
import styles from "./payments.module.css";
import dashStyles from "../page.module.css";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ShieldCheck, Wallet, CheckCircle, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:   { label: "Pending",     cls: "pillPending", dot: "⬡" },
  CONFIRMED: { label: "Confirmed",   cls: "pillPending", dot: "◆" },
  IN_ESCROW: { label: "In Escrow",   cls: "pillEscrow",  dot: "◈" },
  RELEASED:  { label: "Released",    cls: "pillRelease", dot: "◉" },
  COMPLETED: { label: "Completed",   cls: "pillRelease", dot: "✓" },
  CANCELLED: { label: "Cancelled",   cls: "pillRefund",  dot: "✕" },
  REFUNDED:  { label: "Refunded",    cls: "pillRefund",  dot: "↩" },
  DISPUTED:  { label: "Disputed",    cls: "pillRefund",  dot: "!" },
};

const ESCROW_TIMELINE = [
  { step: "Payment Submitted",       desc: "Customer pays — funds leave their account." },
  { step: "Held in Secure Escrow",   desc: "Funds are locked in escrow until event completes." },
  { step: "Event Takes Place",       desc: "Provider delivers their service on the agreed date." },
  { step: "Funds Released to Provider", desc: "Payout is released automatically after success." },
];

const FILTERS = ["ALL", "IN_ESCROW", "COMPLETED", "PENDING", "CANCELLED"];

export default function PaymentsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => (r.ok ? r.json() : { bookings: [] }))
      .then((data) => setBookings(data.bookings || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  const totalSpent    = bookings.reduce((s, b) => s + Number(b.amount || 0), 0);
  const inEscrow      = bookings.filter((b) => b.status === "IN_ESCROW").reduce((s, b) => s + Number(b.amount || 0), 0);
  const released      = bookings.filter((b) => ["RELEASED", "COMPLETED"].includes(b.status)).reduce((s, b) => s + Number(b.amount || 0), 0);
  const refunded      = bookings.filter((b) => ["REFUNDED", "CANCELLED"].includes(b.status)).reduce((s, b) => s + Number(b.amount || 0), 0);

  const isProvider = user?.role === "PROVIDER";

  const SUMMARY = isProvider
    ? [
        { icon: <Wallet size={20} strokeWidth={1.5} />, label: "Total Earned",    value: totalSpent,  gold: true,  note: "Lifetime payout" },
        { icon: <ShieldCheck size={20} strokeWidth={1.5} />, label: "In Escrow",       value: inEscrow,    gold: false, note: "Awaiting release" },
        { icon: <CheckCircle size={20} strokeWidth={1.5} />, label: "Released",        value: released,    gold: false, note: "Already received" },
        { icon: <RefreshCw size={20} strokeWidth={1.5} />, label: "Refunded",        value: refunded,    gold: false, note: "Returned to clients" },
      ]
    : [
        { icon: <Wallet size={20} strokeWidth={1.5} />, label: "Total Spent",     value: totalSpent,  gold: true,  note: "Lifetime invested" },
        { icon: <ShieldCheck size={20} strokeWidth={1.5} />, label: "In Escrow",       value: inEscrow,    gold: false, note: "Secured for your events" },
        { icon: <CheckCircle size={20} strokeWidth={1.5} />, label: "Released",        value: released,    gold: false, note: "Services delivered" },
        { icon: <RefreshCw size={20} strokeWidth={1.5} />, label: "Refunded",        value: refunded,    gold: false, note: "Returned to you" },
      ];

  return (
    <div className={dashStyles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className={dashStyles.sectionTitle}>Payments & Escrow</h2>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryRow}>
        {SUMMARY.map((s) => (
          <div key={s.label} className={styles.summaryCard}>
            <span className={styles.summaryIcon}>{s.icon}</span>
            <p className={styles.summaryLabel}>{s.label}</p>
            <p className={`${styles.summaryValue} ${s.gold ? styles.summaryValueGold : ""}`}>
              {formatPrice(s.value)}
            </p>
            <p className={styles.summaryNote}>{s.note}</p>
          </div>
        ))}
      </div>

      {/* Escrow info banner */}
      <div className={styles.escrowInfoBar}>
        <span className={styles.escrowInfoIcon} style={{ display: "flex", alignItems: "center" }}><ShieldCheck size={18} /></span>
        <p className={styles.escrowInfoText}>
          <strong style={{ color: "var(--color-gold)" }}>How Chronos Escrow Works:</strong>
          {" "}Your payment is held securely the moment you book. Funds are only released to the provider after your event concludes successfully — protecting you at every step.
        </p>
      </div>

      {/* Filter chips */}
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>Filter:</span>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`${styles.filterChip} ${filter === f ? styles.filterChipActive : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "ALL" ? "All Transactions" : STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <p style={{ padding: "2rem", color: "var(--color-text-muted)", textAlign: "center" }}>
            Loading transactions...
          </p>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet size={48} strokeWidth={1} /></div>
            <p className={styles.emptyTitle}>No transactions found</p>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              {filter === "ALL"
                ? "When you book providers, your transactions will appear here."
                : "No transactions with this status."}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.th}>Provider / Client</th>
                <th className={styles.th}>Event</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const meta = STATUS_META[b.status] || STATUS_META.PENDING;
                return (
                  <tr key={b.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(196,164,82,0.1)", border: "1px solid rgba(196,164,82,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", color: "var(--color-gold)", fontSize: "0.85rem", flexShrink: 0 }}>
                          {isProvider
                            ? (b.customer?.name?.charAt(0) || "?")
                            : (b.provider?.businessName?.charAt(0) || "?")}
                        </div>
                        <span>
                          {isProvider
                            ? (b.customer?.name || "Unknown")
                            : (b.provider?.businessName || "Unknown Provider")}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>{b.event?.name || "—"}</td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>
                      {b.eventDate
                        ? new Date(b.eventDate).toLocaleDateString()
                        : new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className={styles.td}>
                      <span className={["RELEASED", "COMPLETED"].includes(b.status) ? styles.amountPositive : styles.amountNeutral}>
                        {formatPrice(Number(b.amount))}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.pill} ${styles[meta.cls]}`}>
                        <span className={styles.pillDot} />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Escrow Timeline */}
      <div className={styles.timelineWrap}>
        <p className={styles.timelineTitle} style={{ display: "flex", alignItems: "center", gap: 6 }}>Escrow Journey <ShieldCheck size={16} /></p>
        <div className={styles.timeline}>
          {ESCROW_TIMELINE.map((step, i) => (
            <div key={step.step} className={styles.timelineItem}>
              <div className={styles.timelineLine}>
                <div className={`${styles.timelineDot} ${i === 1 ? styles.timelineDotActive : i < 1 ? styles.timelineDotDone : ""}`} />
                {i < ESCROW_TIMELINE.length - 1 && <div className={styles.timelineConnector} />}
              </div>
              <div className={styles.timelineContent}>
                <p className={styles.timelineStep}>{step.step}</p>
                <p className={styles.timelineDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

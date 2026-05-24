"use client";
import styles from "../../page.module.css";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toaster";
import { notifyBadgesUpdated } from "@/components/BadgeContext";
import { CalendarCheck, ShieldCheck, Wallet, AlertTriangle, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import useSWR from "swr";

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "statusPending",
  CONFIRMED: "statusConfirmed",
  DECLINED:  "statusDraft",
  IN_ESCROW: "statusEscrow",
  COMPLETED: "statusConfirmed",
  CANCELLED: "statusDraft",
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProviderBookingsPage() {
  const { toast } = useToast();
  const { data, isLoading: loading, mutate } = useSWR("/api/bookings", fetcher, { refreshInterval: 10000 });
  const bookings = data?.bookings || [];

  const [confirmAction, setConfirmAction] = useState<{ id: string; status: string; label: string } | null>(null);
  const [acting, setActing] = useState(false);

  const updateStatus = async (id: string, status: string) => {
    setActing(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        mutate({ bookings: bookings.map((b: any) => b.id === id ? { ...b, status } : b) }, false);
        toast(
          status === "CONFIRMED" ? "Booking accepted! The client will be notified." :
          status === "COMPLETED" ? "Booking marked as completed. Payment will be released." :
          "Booking updated.",
          "success"
        );
        // Immediately refresh sidebar badge counts
        notifyBadgesUpdated();
      } else {
        toast("Action failed. Please try again.", "error");
      }
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  };

  const pending = bookings.filter((b: any) => b.status === "PENDING").length;
  const inEscrow = bookings.filter((b: any) => b.status === "IN_ESCROW").length;
  const totalEarnings = bookings
    .filter((b: any) => ["COMPLETED", "RELEASED"].includes(b.status))
    .reduce((s: number, b: any) => s + Number(b.providerPayout || b.amount || 0), 0);

  return (
    <div className={styles.page}>
      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Pending Requests", value: pending, icon: <CalendarCheck size={20} strokeWidth={1.5} />, color: "var(--color-gold)" },
          { label: "In Escrow",         value: inEscrow, icon: <ShieldCheck size={20} strokeWidth={1.5} />, color: "var(--color-silver)" },
          { label: "Total Earned",       value: formatPrice(totalEarnings), icon: <Wallet size={20} strokeWidth={1.5} />, color: "#4ade80" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue} style={{ color: s.color, fontSize: "1.6rem" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 className={styles.sectionTitle}>Client Bookings</h2>
        {pending > 0 && (
          <span style={{ background: "rgba(196,164,82,0.1)", border: "1px solid rgba(196,164,82,0.3)", color: "var(--color-gold)", padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.78rem" }}>
            {pending} new request{pending !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <p className={styles.eventMeta}>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", opacity: 0.4 }}><CalendarCheck size={48} strokeWidth={1} /></div>
          <p className={styles.eventName} style={{ marginBottom: "0.5rem" }}>No client bookings yet</p>
          <p className={styles.eventMeta}>When customers book your services, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className={styles.bookingsList}>
          {bookings.map((b: any) => (
            <div key={b.id} id={`provider-booking-${b.id}`} className={styles.bookingRow}>
              <div className={styles.bookingAvatar}>
                {b.customer?.name?.charAt(0) || "?"}
              </div>
              <div className={styles.bookingInfo}>
                <p className={styles.bookingProvider}>
                  {b.customer?.name || "Unknown Client"}
                </p>
                <p className={styles.bookingService}>
                  Event: {b.event?.name || "Unknown"}
                  {b.event?.date ? ` · ${new Date(b.event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                  {b.event?.guestCount ? ` · ${b.event.guestCount} guests` : ""}
                </p>
                {b.message && (
                  <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.25rem", fontStyle: "italic" }}>
                    "{b.message.length > 80 ? b.message.slice(0, 80) + "..." : b.message}"
                  </p>
                )}
              </div>
              <div className={styles.bookingRight} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
                <p className={styles.bookingAmount}>
                  {formatPrice(Number(b.providerPayout || b.amount || 0))}
                </p>
                <span className={`${styles.statusPill} ${styles[STATUS_STYLE[b.status] || "statusPending"]}`}>
                  {b.status.replace("_", " ")}
                </span>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
                  {b.status === "PENDING" && (
                    <>
                      <button
                        className={styles.btnGold}
                        onClick={() => setConfirmAction({ id: b.id, status: "CONFIRMED", label: "Accept this booking?" })}
                        style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
                        id={`accept-${b.id}`}
                      >
                        Accept
                      </button>
                      <button
                        className={styles.btnGhost}
                        onClick={() => setConfirmAction({ id: b.id, status: "DECLINED", label: "Decline this booking request?" })}
                        style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                        id={`reject-${b.id}`}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {b.status === "IN_ESCROW" && (
                    <button
                      className={styles.btnGold}
                      onClick={() => setConfirmAction({ id: b.id, status: "COMPLETED", label: "Mark this booking as completed? This will release the payment to you." })}
                      style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
                      id={`complete-${b.id}`}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {confirmAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "var(--color-bg-alt)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 400, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              {confirmAction.status === "CANCELLED" ? <AlertTriangle size={32} color="#ef4444" /> : confirmAction.status === "COMPLETED" ? <CheckCircle size={32} color="#4ade80" /> : <CalendarCheck size={32} color="var(--color-gold)" />}
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
              Confirm Action
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
              {confirmAction.label}
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className={styles.btnGhost} style={{ flex: 1 }} onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button
                className={styles.btnGold}
                style={{ flex: 1, ...(confirmAction.status === "CANCELLED" ? { background: "rgba(239,68,68,0.9)", color: "white" } : {}) }}
                onClick={() => updateStatus(confirmAction.id, confirmAction.status)}
                disabled={acting}
              >
                {acting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

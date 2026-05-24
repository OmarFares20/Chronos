"use client";
import styles from "../page.module.css";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toaster";
import { Diamond, Gem, Music, CircleDot, Hexagon, Component, Plus, AlertTriangle } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "statusPending",
  CONFIRMED: "statusConfirmed",
  IN_ESCROW: "statusEscrow",
  DRAFT:     "statusDraft",
  PLANNING:  "statusPlanning",
  COMPLETED: "statusConfirmed",
  CANCELLED: "statusDraft",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  wedding:    <Diamond size={20} strokeWidth={1.5} />,
  corporate:  <Gem size={20} strokeWidth={1.5} />,
  birthday:   <Music size={20} strokeWidth={1.5} />,
  gala:       <CircleDot size={20} strokeWidth={1.5} />,
  conference: <Hexagon size={20} strokeWidth={1.5} />,
  social:     <Component size={20} strokeWidth={1.5} />,
};

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data, isLoading: loading, mutate } = useSWR("/api/events", fetcher, { refreshInterval: 10000 });
  const events = data?.events || [];

  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async (id: string) => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate({ events: events.filter((e: any) => e.id !== id) }, false);
        toast("Event cancelled successfully.", "success");
      } else {
        toast("Failed to cancel event.", "error");
      }
    } finally {
      setCancelling(false);
      setConfirmCancel(null);
    }
  };

  const getDaysUntil = (dateStr: string) =>
    Math.max(0, Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000));

  const getProgress = (status: string) => {
    const map: Record<string, number> = {
      DRAFT: 15, PLANNING: 45, CONFIRMED: 75, COMPLETED: 100, CANCELLED: 0,
    };
    return map[status] ?? 20;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className={styles.sectionTitle}>My Events</h2>
        <Link href="/events/new" className={styles.newEventBtn} id="events-plan-new" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Plus size={16} /> Plan New Event
        </Link>
      </div>

      {loading ? (
        <div className={styles.bookingsList}>
          {[1,2,3].map((i) => (
            <div key={i} className={styles.eventRow} style={{ opacity: 0.4, height: 96, background: "rgba(255,255,255,0.03)", borderRadius: 10, animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", opacity: 0.4 }}><Diamond size={48} strokeWidth={1} /></div>
          <p className={styles.eventName} style={{ marginBottom: "0.5rem" }}>No events yet</p>
          <p className={styles.eventMeta} style={{ marginBottom: "1.5rem" }}>Let&apos;s plan something extraordinary!</p>
          <Link href="/events/new" className={styles.newEventBtn} id="events-empty-cta" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Plan Your First Event
          </Link>
        </div>
      ) : (
        <div className={styles.eventsList}>
          {events.map((ev: any) => {
            const daysLeft = getDaysUntil(ev.date);
            const progress = getProgress(ev.status);
            const icon = EVENT_ICONS[ev.type?.toLowerCase()] || <Diamond size={20} strokeWidth={1.5} />;
            const canCancel = !["CANCELLED", "COMPLETED"].includes(ev.status);

            return (
              <div key={ev.id} id={`event-card-${ev.id}`} className={styles.eventRow}
                style={{ flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
                {/* Row top */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
                  {/* Countdown block */}
                  <div className={styles.eventCountdown} style={{ minWidth: 52 }}>
                    <span className={`${styles.eventDays} text-gold`}>{daysLeft}</span>
                    <span className={styles.eventDaysLabel}>days</span>
                  </div>

                  {/* Icon + info */}
                  <div style={{ fontSize: "1.4rem", flexShrink: 0, opacity: 0.7 }}>{icon}</div>
                  <div className={styles.eventInfo} style={{ flex: 1 }}>
                    <p className={styles.eventName}>{ev.name}</p>
                    <p className={styles.eventMeta}>
                      {new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{ev.guestCount} guests{" · "}{ev.type}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                  </div>

                  {/* Status + actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end", flexShrink: 0 }}>
                    <span className={`${styles.statusPill} ${styles[STATUS_STYLE[ev.status] || "statusDraft"]}`}>
                      {ev.status}
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href="/providers" className={styles.btnGold}
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }} id={`event-browse-${ev.id}`}>
                        Browse Providers
                      </Link>
                      {canCancel && (
                        <button
                          className={styles.btnGhost}
                          onClick={() => setConfirmCancel(ev.id)}
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                          id={`event-cancel-${ev.id}`}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ padding: "0 1.25rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Event progress</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-gold)" }}>{progress}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%`, transition: "width 0.8s ease" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-bg-alt)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "2.5rem", width: "90%", maxWidth: 420, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}><AlertTriangle size={32} color="var(--color-gold)" /></div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>
              Cancel this event?
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              This will cancel all pending bookings associated with this event. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                className={styles.btnGhost}
                style={{ flex: 1 }}
                onClick={() => setConfirmCancel(null)}
              >
                Keep Event
              </button>
              <button
                className={styles.btnGold}
                style={{ flex: 1, background: "rgba(239,68,68,0.9)", color: "white" }}
                onClick={() => handleCancel(confirmCancel)}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

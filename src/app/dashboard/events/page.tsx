"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useToast } from "@/components/Toaster";
import { formatPrice } from "@/lib/formatPrice";
import {
  Diamond, Plus, AlertTriangle, MapPin, Users, Calendar,
  CreditCard, MessageSquare, Star, CheckCircle, Clock,
  ChevronDown, ChevronUp, FileText, ShieldCheck, X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  status: string;
  amount: number;
  eventDate?: string;
  message?: string;
  provider?: { id: string; businessName: string; location?: string; userId?: string };
  package?:  { name: string; price: number; duration?: string };
  payment?:  { method: string; paidAt: string };
}

interface OccasionEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  guestCount: number;
  budget?: number;
  status: string;
  bookings: Booking[];
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:          { label: "Awaiting Confirmation", color: "#f2c94c", bg: "rgba(242,201,76,0.1)",   border: "rgba(242,201,76,0.35)" },
  CONFIRMED:        { label: "Confirmed",              color: "#56b3ff", bg: "rgba(86,179,255,0.1)",   border: "rgba(86,179,255,0.3)"  },
  IN_ESCROW:        { label: "Payment Held",           color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)" },
  RELEASED:         { label: "Completed",              color: "#50c878", bg: "rgba(80,200,120,0.1)",  border: "rgba(80,200,120,0.3)"  },
  DECLINED:         { label: "Declined",               color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)" },
  CANCELLED:        { label: "Cancelled",              color: "#6b7280", bg: "rgba(107,114,128,0.08)","border": "rgba(107,114,128,0.2)" },
  COMPLETED:        { label: "Completed",              color: "#50c878", bg: "rgba(80,200,120,0.1)",  border: "rgba(80,200,120,0.3)"  },
  PLANNING:         { label: "Planning",               color: "#c4a452", bg: "rgba(196,164,82,0.1)",  border: "rgba(196,164,82,0.25)" },
  CONFIRMED_EVENT:  { label: "Active",                 color: "#56b3ff", bg: "rgba(86,179,255,0.08)", border: "rgba(86,179,255,0.25)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, color: "var(--color-text-muted)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "0.22rem 0.65rem", borderRadius: 99,
      border: `1px solid ${cfg.border}`, background: cfg.bg,
      color: cfg.color, fontSize: "0.7rem", fontWeight: 700,
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

// ── Occasion type icon ─────────────────────────────────────────────────────────
const TYPE_EMOJI: Record<string, string> = {
  wedding: "💍", corporate: "🏢", birthday: "🎂", engagement: "💫",
  graduation: "🎓", celebration: "🎉", gala: "✨", conference: "📊", social: "🎊",
};

// ── Booking action buttons ────────────────────────────────────────────────────
function BookingActions({ b, onMutate }: { b: Booking; onMutate: () => void }) {
  const { toast } = useToast();

  const markReceived = async () => {
    const res = await fetch(`/api/bookings/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RELEASED" }),
    });
    if (res.ok) { toast("Payment released to provider!", "success"); onMutate(); }
    else toast("Failed to update.", "error");
  };

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "0.32rem 0.75rem", borderRadius: 7, fontSize: "0.75rem",
    fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
    textDecoration: "none", border: "none", transition: "all 0.15s",
  };
  const goldBtn: React.CSSProperties  = { ...btnBase, background: "var(--gradient-gold)", color: "#000" };
  const ghostBtn: React.CSSProperties = { ...btnBase, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "var(--color-text-muted)" };

  return (
    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
      {b.status === "CONFIRMED" && (
        <Link href={`/dashboard/payment/${b.id}`} style={goldBtn}>
          <CreditCard size={12} /> Pay Now
        </Link>
      )}
      {b.status === "IN_ESCROW" && (
        <button style={goldBtn} onClick={markReceived}>
          <CheckCircle size={12} /> Mark Received
        </button>
      )}
      {(b.status === "RELEASED" || b.status === "COMPLETED") && (
        <Link href={`/dashboard/bookings`} style={{ ...ghostBtn, color: "#50c878", borderColor: "rgba(80,200,120,0.3)" }}>
          <Star size={12} /> Leave Review
        </Link>
      )}
      {b.provider?.userId && (
        <Link href={`/dashboard/messages?with=${b.provider.userId}`} style={ghostBtn}>
          <MessageSquare size={12} /> Message
        </Link>
      )}
      <Link href="/dashboard/disputes" style={{ ...ghostBtn, color: "#f2c94c", borderColor: "rgba(242,201,76,0.25)" }}>
        <AlertTriangle size={12} /> Dispute
      </Link>
    </div>
  );
}

// ── Booking row inside the card ───────────────────────────────────────────────
function BookingRow({ b, onMutate }: { b: Booking; onMutate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(0,0,0,0.2)", overflow: "hidden",
    }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        {/* Provider initials */}
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: "rgba(196,164,82,0.15)", border: "1px solid rgba(196,164,82,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-gold)",
        }}>
          {b.provider?.businessName?.charAt(0) || "?"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-primary)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {b.provider?.businessName || "Provider"}
          </p>
          <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
            {b.package?.name || "Service"}{b.package?.duration ? ` · ${b.package.duration}` : ""}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-gold)" }}>
            {formatPrice(Number(b.amount))}
          </span>
          <StatusBadge status={b.status} />
          {open ? <ChevronUp size={14} color="var(--color-text-muted)" /> : <ChevronDown size={14} color="var(--color-text-muted)" />}
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 1rem 0.85rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {b.payment && (
            <p style={{ fontSize: "0.73rem", color: "var(--color-text-muted)", marginTop: "0.6rem",
              display: "flex", alignItems: "center", gap: 5 }}>
              <ShieldCheck size={12} color="#a78bfa" />
              Paid via {b.payment.method.replace("_", " ")} on {new Date(b.payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
          {b.message && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic",
              margin: "0.5rem 0 0", lineHeight: 1.5 }}>
              "{b.message.slice(0, 120)}{b.message.length > 120 ? "…" : ""}"
            </p>
          )}
          <BookingActions b={b} onMutate={onMutate} />
        </div>
      )}
    </div>
  );
}

// ── Occasion Card ─────────────────────────────────────────────────────────────
function OccasionCard({ ev, onMutate, onCancel }: {
  ev: OccasionEvent; onMutate: () => void; onCancel: (id: string) => void;
}) {
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const daysUntil = Math.floor((new Date(ev.date).getTime() - Date.now()) / 86400000);
  const isPast    = daysUntil < 0;
  const emoji     = TYPE_EMOJI[ev.type?.toLowerCase()] || "✨";
  const totalSpend = ev.bookings.reduce((s, b) => s + Number(b.amount || 0), 0);
  const canCancel  = !["CANCELLED", "COMPLETED"].includes(ev.status);

  // Overall occasion status based on bookings
  const hasConfirmed  = ev.bookings.some(b => b.status === "CONFIRMED");
  const hasInEscrow   = ev.bookings.some(b => b.status === "IN_ESCROW");
  const allComplete   = ev.bookings.length > 0 && ev.bookings.every(b => ["RELEASED", "COMPLETED"].includes(b.status));
  const displayStatus = allComplete ? "COMPLETED" : hasInEscrow ? "IN_ESCROW" : hasConfirmed ? "CONFIRMED_EVENT" : ev.status;

  return (
    <div style={{
      background: "rgba(14,15,22,0.95)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      {/* Card header strip */}
      <div style={{
        background: isPast ? "rgba(107,114,128,0.15)" : "rgba(196,164,82,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "1.25rem 1.5rem",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1, minWidth: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: "rgba(196,164,82,0.12)", border: "1px solid rgba(196,164,82,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem",
          }}>
            {emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700,
              color: "var(--color-text-primary)", letterSpacing: "0.04em", margin: 0,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {ev.name}
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.15rem", textTransform: "capitalize" }}>
              {ev.type}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
          <StatusBadge status={displayStatus} />
          {!isPast && daysUntil <= 30 && (
            <span style={{ fontSize: "0.68rem", color: daysUntil <= 7 ? "#f87171" : "var(--color-gold)",
              fontWeight: 700, letterSpacing: "0.04em" }}>
              {daysUntil === 0 ? "Today!" : `${daysUntil}d away`}
            </span>
          )}
          {isPast && (
            <span style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}>
              {Math.abs(daysUntil)}d ago
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "1.25rem 1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* Occasion details */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
            <Calendar size={12} />
            {new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
          {ev.location && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
              <MapPin size={12} /> {ev.location}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
            <Users size={12} /> {ev.guestCount.toLocaleString("en-US")} guests
          </span>
          {ev.budget && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
              <FileText size={12} /> Budget: {formatPrice(ev.budget)}
            </span>
          )}
        </div>

        {/* Financials row */}
        {ev.bookings.length > 0 && (
          <div style={{
            display: "flex", gap: "1rem", padding: "0.85rem 1rem",
            background: "rgba(0,0,0,0.25)", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em",
                color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>Services Booked</p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {ev.bookings.length}
              </p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em",
                color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>Total Value</p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gold)" }}>
                {formatPrice(totalSpend)}
              </p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em",
                color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>Paid</p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "#50c878" }}>
                {formatPrice(ev.bookings
                  .filter(b => ["IN_ESCROW", "RELEASED", "COMPLETED"].includes(b.status))
                  .reduce((s, b) => s + Number(b.amount || 0), 0))}
              </p>
            </div>
          </div>
        )}

        {/* Bookings accordion */}
        {ev.bookings.length > 0 && (
          <div>
            <button
              onClick={() => setBookingsOpen(!bookingsOpen)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "none", border: "none", cursor: "pointer", padding: "0 0 0.5rem",
                color: "var(--color-text-muted)", fontFamily: "var(--font-body)", fontSize: "0.78rem" }}
            >
              <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Services & Providers ({ev.bookings.length})
              </span>
              {bookingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {bookingsOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {ev.bookings.map(b => (
                  <BookingRow key={b.id} b={b} onMutate={onMutate} />
                ))}
              </div>
            )}
          </div>
        )}

        {ev.bookings.length === 0 && (
          <div style={{ textAlign: "center", padding: "1rem",
            background: "rgba(255,255,255,0.02)", borderRadius: 10,
            border: "1px dashed rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.6rem" }}>
              No services booked yet
            </p>
            <Link href="/providers"
              style={{ fontSize: "0.78rem", color: "var(--color-gold)", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Plus size={12} /> Browse Providers
            </Link>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{
        padding: "0.85rem 1.5rem",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", gap: "0.5rem", justifyContent: "flex-end",
      }}>
        <Link href="/providers"
          style={{ display: "inline-flex", alignItems: "center", gap: 5,
            padding: "0.4rem 0.9rem", background: "var(--gradient-gold)",
            border: "none", borderRadius: 8, color: "#000",
            fontWeight: 700, fontSize: "0.75rem", fontFamily: "var(--font-body)",
            cursor: "pointer", textDecoration: "none" }}>
          <Plus size={12} /> Add Service
        </Link>
        {canCancel && (
          <button
            onClick={() => onCancel(ev.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5,
              padding: "0.4rem 0.9rem", background: "transparent",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171",
              fontWeight: 600, fontSize: "0.75rem", fontFamily: "var(--font-body)", cursor: "pointer" }}>
            <X size={12} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OccasionsPage() {
  const { toast } = useToast();
  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const { data, isLoading, mutate } = useSWR("/api/events", fetcher, { refreshInterval: 10000 });
  const events: OccasionEvent[] = data?.events || [];

  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [cancelling, setCancelling]       = useState(false);
  const [filter, setFilter]               = useState<"all" | "upcoming" | "past">("all");

  const handleCancel = async (id: string) => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate({ events: events.filter(e => e.id !== id) }, false);
        toast("Occasion cancelled.", "success");
      } else {
        toast("Failed to cancel.", "error");
      }
    } finally {
      setCancelling(false);
      setConfirmCancel(null);
    }
  };

  // Sort and filter
  const now = Date.now();
  const sorted = [...events].sort((a, b) => {
    const aDate = new Date(a.date).getTime();
    const bDate = new Date(b.date).getTime();
    const aUpcoming = aDate >= now;
    const bUpcoming = bDate >= now;
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    return aUpcoming ? aDate - bDate : bDate - aDate;
  });

  const filtered = sorted.filter(ev => {
    const isPast = new Date(ev.date).getTime() < now;
    if (filter === "upcoming") return !isPast;
    if (filter === "past")     return isPast;
    return true;
  });

  const upcomingCount = sorted.filter(e => new Date(e.date).getTime() >= now).length;
  const pastCount     = sorted.filter(e => new Date(e.date).getTime() < now).length;

  return (
    <div style={{ padding: "0 0 3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700,
            color: "var(--color-text-primary)", letterSpacing: "0.06em", margin: 0 }}>
            My Occasions
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
            {upcomingCount} upcoming · {pastCount} past
          </p>
        </div>
        <Link href="/events/new"
          style={{ display: "inline-flex", alignItems: "center", gap: 6,
            padding: "0.65rem 1.25rem", background: "var(--gradient-gold)",
            borderRadius: 10, color: "#000", fontWeight: 700, fontSize: "0.85rem",
            fontFamily: "var(--font-body)", textDecoration: "none", whiteSpace: "nowrap" }}
          id="occasions-new">
          <Plus size={16} /> Plan New Occasion
        </Link>
      </div>

      {/* Filter tabs */}
      {events.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {(["all", "upcoming", "past"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "0.4rem 1rem", borderRadius: 8, fontSize: "0.78rem",
                fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
                border: `1px solid ${filter === f ? "var(--color-gold)" : "rgba(255,255,255,0.08)"}`,
                background: filter === f ? "rgba(196,164,82,0.12)" : "transparent",
                color: filter === f ? "var(--color-gold)" : "var(--color-text-muted)",
                textTransform: "capitalize",
              }}>
              {f} {f === "upcoming" ? `(${upcomingCount})` : f === "past" ? `(${pastCount})` : `(${events.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 280, borderRadius: 16, background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)", animation: "pulse 1.8s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <div style={{ textAlign: "center", padding: "5rem 2rem",
          background: "rgba(255,255,255,0.02)", borderRadius: 20,
          border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem", opacity: 0.4 }}>✨</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem",
            color: "var(--color-text-primary)", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
            No occasions yet
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginBottom: "1.5rem", maxWidth: 320, margin: "0 auto 1.5rem" }}>
            Start planning your dream occasion and connect with the best providers in Egypt.
          </p>
          <Link href="/providers"
            style={{ display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0.75rem 1.5rem", background: "var(--gradient-gold)",
              borderRadius: 10, color: "#000", fontWeight: 700, fontSize: "0.88rem",
              fontFamily: "var(--font-body)", textDecoration: "none" }}
            id="occasions-empty-browse">
            <Diamond size={16} /> Browse Providers
          </Link>
        </div>
      )}

      {/* Empty filter state */}
      {!isLoading && events.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem",
          color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
          No {filter} occasions found.
        </div>
      )}

      {/* Occasion cards grid */}
      {!isLoading && filtered.length > 0 && (
        <>
          {/* Upcoming section */}
          {filter !== "past" && filtered.filter(e => new Date(e.date).getTime() >= now).length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              {filter === "all" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <Clock size={14} color="var(--color-gold)" />
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.1em", color: "var(--color-gold)" }}>
                    Upcoming
                  </p>
                  <div style={{ flex: 1, height: 1, background: "rgba(196,164,82,0.15)" }} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
                {filtered
                  .filter(e => new Date(e.date).getTime() >= now)
                  .map(ev => (
                    <OccasionCard key={ev.id} ev={ev} onMutate={mutate} onCancel={setConfirmCancel} />
                  ))}
              </div>
            </div>
          )}

          {/* Past section */}
          {filter !== "upcoming" && filtered.filter(e => new Date(e.date).getTime() < now).length > 0 && (
            <div>
              {filter === "all" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", marginTop: "1rem" }}>
                  <CheckCircle size={14} color="var(--color-text-muted)" />
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.1em", color: "var(--color-text-muted)" }}>
                    Past
                  </p>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem", opacity: 0.75 }}>
                {filtered
                  .filter(e => new Date(e.date).getTime() < now)
                  .map(ev => (
                    <OccasionCard key={ev.id} ev={ev} onMutate={mutate} onCancel={setConfirmCancel} />
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "var(--color-bg-alt)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 420, textAlign: "center" }}>
            <AlertTriangle size={36} color="var(--color-gold)" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem",
              color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>
              Cancel this occasion?
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem",
              marginBottom: "1.75rem", lineHeight: 1.6, maxWidth: 300, margin: "0 auto 1.75rem" }}>
              All pending bookings associated with this occasion will be cancelled. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setConfirmCancel(null)}
                style={{ flex: 1, padding: "0.8rem", background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                  color: "var(--color-text-primary)", fontFamily: "var(--font-body)",
                  fontSize: "0.88rem", cursor: "pointer" }}>
                Keep it
              </button>
              <button onClick={() => handleCancel(confirmCancel)} disabled={cancelling}
                style={{ flex: 1, padding: "0.8rem", background: "rgba(239,68,68,0.85)",
                  border: "none", borderRadius: 10, color: "white",
                  fontFamily: "var(--font-body)", fontSize: "0.88rem",
                  fontWeight: 700, cursor: cancelling ? "wait" : "pointer" }}>
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

"use client";
import styles from "../page.module.css";
import { useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/Toaster";
import { humanStatus, statusClass } from "@/lib/ui";
import { Star, CalendarCheck, CheckCircle, CreditCard, Smartphone, Building2, QrCode } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "0.3rem" }}>
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.8rem",
            color: n <= (hovered || value) ? "var(--color-gold)" : "rgba(255,255,255,0.15)",
            transition: "color 0.1s, transform 0.1s",
            transform: n <= (hovered || value) ? "scale(1.1)" : "scale(1)",
            lineHeight: 1,
          }}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <Star size={24} fill={n <= (hovered || value) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

const PAY_METHODS = [
  { id: "card", label: "Credit Card", icon: <CreditCard size={18} /> },
  { id: "fawry", label: "Fawry", icon: <QrCode size={18} /> },
  { id: "wallet", label: "Vodafone Cash", icon: <Smartphone size={18} /> },
  { id: "bank", label: "Bank Transfer", icon: <Building2 size={18} /> },
];

export default function BookingsPage() {
  const { toast } = useToast();
  
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data, isLoading: loading, mutate } = useSWR("/api/bookings", fetcher, { refreshInterval: 10000 });
  const bookings = data?.bookings || [];

  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [payBooking, setPayBooking] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState("card");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: reviewBooking.id, rating, comment }),
      });
      if (res.ok) {
        toast("Review submitted! Thank you.", "success");
        mutate({ bookings: bookings.map((b: any) => b.id === reviewBooking.id ? { ...b, review: true } : b) }, false);
        setReviewBooking(null);
        setComment("");
        setRating(5);
      } else {
        const err = await res.json();
        toast(err.error || "Failed to submit review.", "error");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBooking) return;
    setSubmittingPayment(true);
    try {
      // Simulate payment delay
      await new Promise(r => setTimeout(r, 1000));
      
      const res = await fetch(`/api/bookings/${payBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_ESCROW" }),
      });
      if (res.ok) {
        toast("Payment successful! Funds are held in escrow.", "success");
        mutate({ bookings: bookings.map((b: any) => b.id === payBooking.id ? { ...b, status: "IN_ESCROW" } : b) }, false);
        setPayBooking(null);
      } else {
        toast("Payment failed. Please try again.", "error");
      }
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className={styles.sectionTitle}>My Bookings</h2>
        {bookings.length > 0 && (
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className={styles.bookingsList}>
          {[1,2,3].map(i => (
            <div key={i} className={styles.bookingRow} style={{ opacity: 0.4, height: 80, background: "rgba(255,255,255,0.03)", borderRadius: 10 }} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", opacity: 0.4 }}><CalendarCheck size={48} strokeWidth={1} /></div>
          <p className={styles.eventName} style={{ marginBottom: "0.5rem" }}>No bookings yet</p>
          <p className={styles.eventMeta}>Browse providers and book your dream team!</p>
        </div>
      ) : (
        <div className={styles.bookingsList}>
          {bookings.map((b: any) => (
            <div key={b.id} id={`booking-card-${b.id}`} className={styles.bookingRow}>
              <div className={styles.bookingAvatar}>
                {b.provider?.businessName?.charAt(0) || "?"}
              </div>
              <div className={styles.bookingInfo}>
                <p className={styles.bookingProvider}>{b.provider?.businessName || "Unknown Provider"}</p>
                <p className={styles.bookingService}>
                  {b.event?.name || "Unknown Event"}
                  {b.eventDate ? ` · ${new Date(b.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                </p>
                {b.message && (
                  <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.25rem", fontStyle: "italic" }}>
                    "{b.message.length > 80 ? b.message.slice(0, 80) + "..." : b.message}"
                  </p>
                )}
              </div>
              <div className={styles.bookingRight} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                <p className={styles.bookingAmount}>{formatPrice(Number(b.amount))}</p>
                
                {b.status === "PENDING" ? (
                  <span className={`${styles.statusPill} ${styles.statusPending}`}>
                    Awaiting Confirmation
                  </span>
                ) : (
                  <span className={`${styles.statusPill} ${styles[statusClass(b.status)]}`}>
                    {humanStatus(b.status)}
                  </span>
                )}

                {b.status === "CONFIRMED" && (
                  <button
                    className={styles.btnGold}
                    onClick={() => setPayBooking(b)}
                    style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                    id={`pay-btn-${b.id}`}
                  >
                    Pay Now
                  </button>
                )}
                
                {b.status === "COMPLETED" && !b.review && (
                  <button
                    className={styles.btnGold}
                    onClick={() => setReviewBooking(b)}
                    style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 6 }}
                    id={`review-btn-${b.id}`}
                  >
                    <Star size={14} fill="currentColor" /> Leave Review
                  </button>
                )}
                {b.status === "COMPLETED" && b.review && (
                  <span style={{ fontSize: "0.75rem", color: "#4ade80", display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle size={12} /> Reviewed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {payBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <form
            onSubmit={submitPayment}
            style={{ background: "var(--color-bg-alt)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 460, animation: "fadeInUp 0.25s ease" }}
          >
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "0.25rem", letterSpacing: "0.05em" }}>
              Secure Payment
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.75rem" }}>
              {payBooking.provider?.businessName} — {formatPrice(Number(payBooking.amount))}
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Select Payment Method
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {PAY_METHODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayMethod(m.id)}
                    style={{
                      padding: "0.75rem",
                      background: payMethod === m.id ? "rgba(212,175,85,0.15)" : "rgba(0,0,0,0.3)",
                      border: `1px solid ${payMethod === m.id ? "var(--color-gold)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 8,
                      color: payMethod === m.id ? "var(--color-gold)" : "var(--color-text-primary)",
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: "0.85rem", cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.75rem", fontSize: "0.8rem", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.05)" }}>
              <p style={{ color: "var(--color-gold)", marginBottom: "0.5rem" }}>🔒 Demo Mode</p>
              <p>No real charge will be made. Clicking "Confirm Payment" will instantly deposit the funds into escrow.</p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                disabled={submittingPayment}
                className={styles.btnGold}
                style={{ flex: 1 }}
              >
                {submittingPayment ? "Processing..." : "Confirm Payment"}
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                style={{ flex: 1 }}
                onClick={() => setPayBooking(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <form
            onSubmit={submitReview}
            style={{ background: "var(--color-bg-alt)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 460, animation: "fadeInUp 0.25s ease" }}
          >
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "0.25rem", letterSpacing: "0.05em" }}>
              Rate Your Experience
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.75rem" }}>
              {reviewBooking.provider?.businessName || "Provider"}
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Your Rating
              </label>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Your Review
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this provider..."
                style={{ width: "100%", padding: "0.85rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "var(--color-text-primary)", fontSize: "0.9rem", fontFamily: "var(--font-body)", resize: "vertical", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                disabled={submittingReview}
                className={styles.btnGold}
                style={{ flex: 1 }}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                style={{ flex: 1 }}
                onClick={() => setReviewBooking(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

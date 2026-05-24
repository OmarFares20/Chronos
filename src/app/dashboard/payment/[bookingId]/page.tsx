"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { formatPrice } from "@/lib/formatPrice";
import {
  CreditCard, QrCode, Smartphone, Building2,
  CheckCircle, Lock, ArrowLeft, ShieldCheck, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  status: string;
  amount: number;
  eventDate?: string;
  message?: string;
  provider?: { businessName: string; location?: string };
  package?: { name: string; duration?: string };
  event?: { name: string; type: string };
}

type Method = "card" | "fawry" | "vodafone" | "bank";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MethodTab({
  id, active, icon, label, sub, onClick,
}: {
  id: Method; active: boolean; icon: React.ReactNode; label: string; sub: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: "140px",
        padding: "0.9rem 0.75rem",
        borderRadius: "10px",
        border: `1px solid ${active ? "var(--color-gold)" : "rgba(255,255,255,0.08)"}`,
        background: active ? "rgba(196,164,82,0.12)" : "rgba(0,0,0,0.25)",
        color: active ? "var(--color-gold)" : "var(--color-text-muted)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
        cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-body)",
      }}
    >
      {icon}
      <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>{sub}</span>
    </button>
  );
}

function Field({
  label, id, children,
}: {
  label: string; id?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label
        htmlFor={id}
        style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--color-text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.35)",
  color: "var(--color-text-primary)",
  fontSize: "0.92rem",
  fontFamily: "var(--font-body)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking]     = useState<Booking | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [method, setMethod]       = useState<Method>("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]     = useState(false);

  // Card fields
  const [cardNumber, setCardNumber]   = useState("");
  const [cardName, setCardName]       = useState("");
  const [cardExpiry, setCardExpiry]   = useState("");
  const [cardCvc, setCardCvc]         = useState("");

  // Fawry
  const [fawryRef, setFawryRef] = useState("");

  // Vodafone Cash / InstaPay
  const [walletNumber, setWalletNumber] = useState("+20 ");

  // Bank transfer
  const [receiptName, setReceiptName] = useState<string>("");

  // ── Fetch booking ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.booking) { setError("Booking not found."); return; }
        const b = data.booking;
        // Guard: only CONFIRMED bookings can be paid
        if (!["CONFIRMED"].includes(b.status)) {
          setError(
            b.status === "IN_ESCROW" || b.status === "RELEASED"
              ? "This booking has already been paid."
              : b.status === "DECLINED"
              ? "This booking was declined by the provider."
              : "Payment is not available for this booking yet. Wait for the provider to confirm."
          );
          return;
        }
        setBooking(b);
      })
      .catch(() => setError("Failed to load booking."))
      .finally(() => setLoading(false));
  }, [bookingId]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (method === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length !== 16) return "Card number must be 16 digits.";
      if (!cardName.trim()) return "Cardholder name is required.";
      const [mm, yy] = cardExpiry.split("/").map(Number);
      const now = new Date();
      if (!mm || !yy || mm < 1 || mm > 12) return "Invalid expiry month.";
      const expYear = 2000 + yy;
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1))
        return "Card has expired.";
      if (cardCvc.replace(/\D/g, "").length !== 3) return "CVC must be 3 digits.";
    }
    if (method === "fawry") {
      if (!fawryRef.trim()) return "Fawry reference number is required.";
    }
    if (method === "vodafone") {
      const digits = walletNumber.replace(/\D/g, "");
      if (digits.length < 11) return "Please enter a valid wallet number.";
    }
    if (method === "bank") {
      if (!receiptName) return "Please upload your transfer receipt.";
    }
    return null;
  };

  // ── Submit payment ─────────────────────────────────────────────────────────
  const handlePay = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setProcessing(true);

    // 1-2s simulated processing
    await new Promise((r) => setTimeout(r, 1500));

    try {
      const methodMap: Record<Method, string> = {
        card: "CARD", fawry: "FAWRY", vodafone: "VODAFONE_CASH", bank: "BANK_TRANSFER",
      };

      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: methodMap[method],
          reference:
            method === "card"     ? `**** **** **** ${cardNumber.replace(/\s/g, "").slice(-4)}`
            : method === "fawry"  ? fawryRef
            : method === "vodafone" ? walletNumber
            : receiptName,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Payment failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
        Loading payment details…
      </div>
    );
  }

  // ── Access denied ──────────────────────────────────────────────────────────
  if (error && !booking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "1rem", background: "var(--color-bg)", padding: "2rem" }}>
        <AlertTriangle size={48} color="var(--color-gold)" strokeWidth={1.5} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--color-text-primary)", textAlign: "center" }}>
          {error}
        </h2>
        <Link href="/dashboard/bookings"
          style={{ color: "var(--color-gold)", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Back to My Bookings
        </Link>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "1.5rem", background: "var(--color-bg)", padding: "2rem", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(80,200,120,0.12)",
          border: "2px solid rgba(80,200,120,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle size={40} color="#50c878" />
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--color-text-primary)",
            letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
            Payment Successful!
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", maxWidth: 380, margin: "0 auto" }}>
            Your payment of <strong style={{ color: "var(--color-gold)" }}>{formatPrice(Number(booking?.amount || 0))}</strong> is
            now securely held in escrow. It will be released to {booking?.provider?.businessName} after your occasion concludes.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/dashboard/bookings"
            style={{ padding: "0.7rem 1.5rem", background: "var(--gradient-gold)", borderRadius: 8,
              color: "#000", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}>
            View My Bookings
          </Link>
          <Link href="/dashboard"
            style={{ padding: "0.7rem 1.5rem", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
              color: "var(--color-text-primary)", fontSize: "0.85rem", textDecoration: "none" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Payment page ───────────────────────────────────────────────────────────
  const platformFee = Math.round(Number(booking?.amount || 0) * 0.05);
  const total = Number(booking?.amount || 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", padding: "2rem 1rem", fontFamily: "var(--font-body)" }}>
      {/* Back link */}
      <Link href="/dashboard/bookings"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)",
          fontSize: "0.82rem", textDecoration: "none", marginBottom: "1.5rem" }}>
        <ArrowLeft size={14} /> Back to Bookings
      </Link>

      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid",
        gridTemplateColumns: "1fr minmax(280px, 340px)", gap: "1.5rem", alignItems: "start" }}>

        {/* ── Left: Payment Form ── */}
        <div style={{ background: "rgba(16,17,26,0.9)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--color-text-primary)",
              letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
              Secure Payment
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={12} /> All transactions are encrypted and secured
            </p>
          </div>

          {/* Method selector */}
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
              Choose Payment Method
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <MethodTab id="card"      active={method === "card"}     onClick={() => setMethod("card")}
                icon={<CreditCard size={20} />} label="Card" sub="Visa / MC / Meeza" />
              <MethodTab id="fawry"     active={method === "fawry"}    onClick={() => setMethod("fawry")}
                icon={<QrCode size={20} />}     label="Fawry" sub="FawryPay" />
              <MethodTab id="vodafone"  active={method === "vodafone"} onClick={() => setMethod("vodafone")}
                icon={<Smartphone size={20} />} label="Wallet" sub="VF Cash / InstaPay" />
              <MethodTab id="bank"      active={method === "bank"}     onClick={() => setMethod("bank")}
                icon={<Building2 size={20} />}  label="Bank" sub="Wire Transfer" />
            </div>
          </div>

          {/* ── Card form ── */}
          {method === "card" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Field label="Card Number" id="card-number">
                <input
                  id="card-number"
                  style={INPUT_STYLE}
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  inputMode="numeric"
                  maxLength={19}
                />
              </Field>
              <Field label="Cardholder Name" id="card-name">
                <input
                  id="card-name"
                  style={INPUT_STYLE}
                  placeholder="Name as on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Expiry Date" id="card-expiry">
                  <input
                    id="card-expiry"
                    style={INPUT_STYLE}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="CVC" id="card-cvc">
                  <input
                    id="card-cvc"
                    style={INPUT_STYLE}
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    inputMode="numeric"
                    maxLength={3}
                    type="password"
                  />
                </Field>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {["visa", "mastercard", "meeza"].map((brand) => (
                  <span key={brand} style={{ padding: "0.2rem 0.6rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: "0.7rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Fawry form ── */}
          {method === "fawry" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(255,165,0,0.07)",
                border: "1px solid rgba(255,165,0,0.2)", fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                <p style={{ color: "#ffa500", fontWeight: 700, marginBottom: "0.4rem" }}>How to pay with Fawry:</p>
                <p>1. Go to any Fawry outlet or use the FawryPay app.</p>
                <p>2. Select <strong>Pay Bills</strong> → <strong>Chronos</strong></p>
                <p>3. Enter your reference number below and pay <strong>{formatPrice(total)}</strong></p>
              </div>
              <Field label="Fawry Reference Number" id="fawry-ref">
                <input
                  id="fawry-ref"
                  style={INPUT_STYLE}
                  placeholder="e.g. FW-123456789"
                  value={fawryRef}
                  onChange={(e) => setFawryRef(e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* ── Vodafone Cash / InstaPay form ── */}
          {method === "vodafone" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(196,164,82,0.06)",
                border: "1px solid rgba(196,164,82,0.15)", fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                <p style={{ color: "var(--color-gold)", fontWeight: 700, marginBottom: "0.4rem" }}>InstaPay / Vodafone Cash:</p>
                <p>Send <strong>{formatPrice(total)}</strong> to our wallet number:</p>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "0.4rem" }}>
                  +20 100 000 1234
                </p>
                <p style={{ marginTop: "0.4rem" }}>Then enter your wallet number below to confirm.</p>
              </div>
              <Field label="Your Wallet Number" id="wallet-number">
                <input
                  id="wallet-number"
                  style={INPUT_STYLE}
                  placeholder="+20 1XX XXX XXXX"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  inputMode="tel"
                />
              </Field>
            </div>
          )}

          {/* ── Bank Transfer form ── */}
          {method === "bank" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(196,164,82,0.06)",
                border: "1px solid rgba(196,164,82,0.15)", fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                <p style={{ color: "var(--color-gold)", fontWeight: 700, marginBottom: "0.5rem" }}>Bank Transfer Details:</p>
                <p><strong>Bank:</strong> CIB — Commercial International Bank</p>
                <p><strong>Account Name:</strong> Chronos Events Platform</p>
                <p><strong>IBAN:</strong> EG12 0010 0999 0000 0001 2345 6789</p>
                <p><strong>Amount:</strong> {formatPrice(total)}</p>
              </div>
              <Field label="Upload Transfer Receipt" id="bank-receipt">
                <div
                  style={{ border: "2px dashed rgba(196,164,82,0.3)", borderRadius: 10, padding: "1.5rem",
                    textAlign: "center", cursor: "pointer", position: "relative",
                    background: receiptName ? "rgba(80,200,120,0.06)" : "rgba(0,0,0,0.2)",
                    transition: "all 0.2s" }}
                  onClick={() => document.getElementById("receipt-input")?.click()}
                >
                  <input
                    id="receipt-input"
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setReceiptName(file.name);
                    }}
                  />
                  {receiptName ? (
                    <p style={{ color: "#50c878", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <CheckCircle size={16} /> {receiptName}
                    </p>
                  ) : (
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                      Click to upload receipt (PNG, JPG, PDF)
                    </p>
                  )}
                </div>
              </Field>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(220,53,69,0.1)",
              border: "1px solid rgba(220,53,69,0.3)", fontSize: "0.83rem", color: "#ff6b6b",
              display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handlePay}
            disabled={processing}
            style={{
              padding: "0.9rem 2rem", background: processing ? "rgba(196,164,82,0.4)" : "var(--gradient-gold)",
              border: "none", borderRadius: 10, color: processing ? "rgba(255,255,255,0.6)" : "#000",
              fontWeight: 800, fontSize: "0.95rem", fontFamily: "var(--font-body)", cursor: processing ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all 0.2s", letterSpacing: "0.04em",
            }}
          >
            {processing ? (
              <>
                <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                Processing payment…
              </>
            ) : (
              <>
                <Lock size={16} /> Confirm Payment — {formatPrice(total)}
              </>
            )}
          </button>

          <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.6 }}>
            🔒 Demo mode — no real charge will be made. Your funds will be held in escrow until your occasion concludes.
          </p>
        </div>

        {/* ── Right: Booking Summary ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "1rem" }}>
          <div style={{ background: "rgba(16,17,26,0.9)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--color-text-muted)", marginBottom: "1rem" }}>
              Booking Summary
            </p>

            {/* Provider */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem",
              paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(196,164,82,0.15)",
                border: "1px solid var(--color-border-gold)", display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "1.1rem",
                color: "var(--color-gold)", fontWeight: 700, flexShrink: 0 }}>
                {booking?.provider?.businessName?.charAt(0) || "?"}
              </div>
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {booking?.provider?.businessName}
                </p>
                {booking?.provider?.location && (
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    📍 {booking.provider.location}
                  </p>
                )}
              </div>
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.82rem" }}>
              {booking?.event?.name && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Occasion</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{booking.event.name}</span>
                </div>
              )}
              {booking?.package?.name && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Package</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{booking.package.name}</span>
                </div>
              )}
              {booking?.package?.duration && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Duration</span>
                  <span style={{ color: "var(--color-text-primary)" }}>{booking.package.duration}</span>
                </div>
              )}
              {booking?.eventDate && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Date</span>
                  <span style={{ color: "var(--color-text-primary)" }}>
                    {new Date(booking.eventDate).toLocaleDateString("en-US",
                      { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Service fee</span>
                <span style={{ color: "var(--color-text-primary)" }}>{formatPrice(total - platformFee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Platform fee (5%)</span>
                <span style={{ color: "var(--color-text-primary)" }}>{formatPrice(platformFee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem",
                borderTop: "1px solid rgba(255,255,255,0.06)", fontWeight: 700 }}>
                <span style={{ color: "var(--color-text-primary)" }}>Total</span>
                <span style={{ color: "var(--color-gold)", fontSize: "1rem" }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Escrow info */}
          <div style={{ background: "rgba(16,17,26,0.9)", border: "1px solid rgba(80,200,120,0.15)",
            borderRadius: 16, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
              <ShieldCheck size={18} color="#50c878" />
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#50c878" }}>Protected by Escrow</p>
            </div>
            <p style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              Your payment is held securely until your occasion concludes. If anything goes wrong, your money is protected.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

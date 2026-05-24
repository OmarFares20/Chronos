"use client";
import styles from "./checkout.module.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCart, clearCart, getCartTotal, getPlatformFee, CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/formatPrice";
import {
  ArrowLeft, Check, Calendar, FileText, ArrowRight,
  CheckCircle, FileDown
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { mutate } from "swr";

type Step = 1 | 2;

interface BookingResult {
  id: string;
  providerName: string;
  packageName: string;
  amount: number;
}

export default function PlannerCheckoutPage() {
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [step, setStep]             = useState<Step>(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [bookings, setBookings]     = useState<BookingResult[]>([]);
  const [eventName, setEventName]   = useState("");
  const [eventDate, setEventDate]   = useState("");
  const [location, setLocation]     = useState("");
  const [guestCount, setGuestCount] = useState("");

  useEffect(() => {
    const c = getCart();
    setCart(c);
    const times = c.map((item) => item.scheduledTime).filter(Boolean) as string[];
    if (times.length > 0) {
      setEventDate(times.sort()[0].slice(0, 10));
    }
  }, []);

  const total      = getCartTotal(cart);
  const fee        = getPlatformFee(total);
  const grandTotal = total + fee;

  const STEPS = [
    { n: 1, label: "Review" },
    { n: 2, label: "Request Sent" },
  ];

  const handleCheckout = async () => {
    if (!eventName || !eventDate) {
      setError("Please fill in occasion name and date.");
      return;
    }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName, eventDate, location,
          guestCount: guestCount ? Number(guestCount) : 1,
          items: cart,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed. Please try again.");
        return;
      }
      const results = (data.bookings || cart).map((item: { id?: string; providerName?: string; packageName?: string; amount?: number; price?: number }) => ({
        id:           item.id || `bk_${Math.random().toString(36).slice(2)}`,
        providerName: item.providerName || "Provider",
        packageName:  item.packageName  || "Package",
        amount:       item.amount || item.price,
      }));
      setBookings(results);
      clearCart();
      setStep(2);
      mutate("/api/events");
      mutate("/api/bookings");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadBrief = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CHRONOS", 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Occasion Brief", 14, 28);
    
    // Occasion Details
    doc.setFontSize(10);
    doc.text(`Occasion: ${eventName}`, 14, 40);
    doc.text(`Date: ${eventDate}`, 14, 46);
    doc.text(`Location: ${location || "TBD"}`, 14, 52);
    doc.text(`Guests: ${guestCount || "TBD"}`, 14, 58);
    
    // Table of Services
    const tableData = bookings.map((b) => [
      b.providerName,
      b.packageName,
      formatPrice(b.amount)
    ]);
    
    autoTable(doc, {
      startY: 68,
      head: [["Provider", "Service / Package", "Estimated Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [212, 175, 55] }, // Gold color
    });
    
    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFont("helvetica", "normal");
    doc.text(`Subtotal: ${formatPrice(total)}`, 14, finalY + 10);
    doc.text(`Platform Fee (5%): ${formatPrice(fee)}`, 14, finalY + 16);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Estimated Total: ${formatPrice(grandTotal)}`, 14, finalY + 26);
    
    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Payments are held securely in escrow until your occasion concludes successfully.", 14, finalY + 40);
    doc.text(`Generated on: ${new Date().toLocaleString("en-US")}`, 14, finalY + 45);
    
    // Save
    const filename = `chronos-occasion-brief-${(eventName || "plan").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    doc.save(filename);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.orb1} aria-hidden="true" />

      <div className={styles.container}>
        {step < 2 && (
          <Link href="/planner" className={styles.backLink} id="checkout-back" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={16} /> Back to Planner
          </Link>
        )}

        {/* Step indicator */}
        <div className={styles.stepIndicator}>
          {STEPS.map(({ n, label }) => (
            <div key={n} className={`${styles.step} ${step >= n ? styles.stepActive : ""} ${step === n ? styles.stepCurrent : ""}`}>
              <div className={styles.stepCircle}>{step > n ? <Check size={14} strokeWidth={3} /> : n}</div>
              <span className={styles.stepLabel}>{label}</span>
              {n < STEPS.length && <div className={`${styles.stepLine} ${step > n ? styles.stepLineDone : ""}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Review ── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h1 className={styles.stepTitle}>Review Your Request</h1>
            <p className={styles.stepDesc}>Submit booking requests to your chosen providers.</p>

            <div className={styles.reviewList}>
              {cart.map((item) => (
                <div key={item.id} className={styles.reviewItem} id={`review-${item.id}`}>
                  <div className={styles.reviewItemLeft}>
                    <p className={styles.reviewProvider}>{item.providerName}</p>
                    <p className={styles.reviewPackage}>{item.packageName}</p>
                    {item.scheduledTime && (
                      <p className={styles.reviewMeta} style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={14} /> {new Date(item.scheduledTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                    )}
                    {item.deliveryNotes && (
                      <p className={styles.reviewMeta} style={{ display: "flex", alignItems: "center", gap: 4 }}><FileText size={14} /> {item.deliveryNotes}</p>
                    )}
                  </div>
                  <p className={styles.reviewPrice}>{formatPrice(item.price)}</p>
                </div>
              ))}
            </div>

            {/* Occasion details */}
            <div className={styles.eventDetails}>
              <h3 className={styles.detailsTitle}>Occasion Details</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailField}>
                  <label className={styles.detailLabel}>Occasion Name *</label>
                  <input className={styles.detailInput} value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Sarah & Omar's Wedding" required id="event-name" />
                </div>
                <div className={styles.detailField}>
                  <label className={styles.detailLabel}>Occasion Date *</label>
                  <input className={styles.detailInput} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required id="event-date" min={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className={styles.detailField}>
                  <label className={styles.detailLabel}>Venue / Location</label>
                  <input className={styles.detailInput} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. The Grand Nile Tower, Cairo" id="event-location" />
                </div>
                <div className={styles.detailField}>
                  <label className={styles.detailLabel}>Guest Count</label>
                  <input className={styles.detailInput} type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="e.g. 150" id="guest-count" />
                </div>
              </div>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.summaryStrip}>
              <span className={styles.summaryStripLabel}>Estimated Grand Total</span>
              <span className={styles.summaryStripValue}>{formatPrice(grandTotal)}</span>
              <button
                className={styles.nextBtn}
                onClick={handleCheckout}
                disabled={loading}
                id="checkout-step2"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {loading
                  ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Processing…</>
                  : <>Submit Request <ArrowRight size={16} /></>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Confirmation ── */}
        {step === 2 && (
          <div className={`${styles.stepContent} ${styles.confirmStep}`}>
            <div className={styles.confirmIcon} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle size={48} strokeWidth={1.5} /></div>
            <h1 className={styles.confirmTitle}>Request Sent!</h1>
            <p className={styles.confirmDesc}>
              All {bookings.length} service request{bookings.length > 1 ? "s have" : " has"} been sent. You will be able to pay securely once providers accept.
            </p>

            <div className={styles.bookingsList}>
              {bookings.map((b) => (
                <div key={b.id} className={styles.bookingItem} id={`confirmation-${b.id}`}>
                  <div className={styles.bookingItemLeft}>
                    <p className={styles.bookingProvider}>{b.providerName}</p>
                    <p className={styles.bookingPackage}>{b.packageName}</p>
                  </div>
                  <span className={styles.bookingAmount}>{formatPrice(b.amount)}</span>
                </div>
              ))}
            </div>

            <div className={styles.confirmActions}>
              <button className={styles.downloadBtn} onClick={downloadBrief} id="download-brief" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <FileDown size={16} /> Download Occasion Brief
              </button>
              <Link href="/dashboard/bookings" className={styles.dashboardBtn} id="go-to-dashboard" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Track Bookings <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

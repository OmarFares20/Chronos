"use client";
import styles from "./planner.module.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getCart,
  removeFromCart,
  updateScheduledTime,
  updateDeliveryNotes,
  getCartTotal,
  getPlatformFee,
  CartItem,
} from "@/lib/cart";
import { formatPrice } from "@/lib/formatPrice";
import { Camera, Video, Utensils, Sparkles, Music, CalendarDays, MapPin, Car, Flower2, Scissors, PartyPopper, Shield, Printer, ArrowRight, Diamond, Clock, X, Pin, ShieldCheck } from "lucide-react";

function timeLabel(iso?: string) {
  if (!iso) return "No time set";
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function CategoryIcon({ category }: { category?: string }) {
  const cat = category?.toUpperCase() || "";
  if (cat === "PHOTOGRAPHY") return <Camera size={20} />;
  if (cat === "VIDEOGRAPHY") return <Video size={20} />;
  if (cat === "CATERING") return <Utensils size={20} />;
  if (cat === "DECOR") return <Sparkles size={20} />;
  if (cat === "MUSIC") return <Music size={20} />;
  if (cat === "PLANNING") return <CalendarDays size={20} />;
  if (cat === "VENUE") return <MapPin size={20} />;
  if (cat === "TRANSPORT") return <Car size={20} />;
  if (cat === "FLORIST") return <Flower2 size={20} />;
  if (cat === "MAKEUP") return <Scissors size={20} />;
  if (cat === "ENTERTAINMENT") return <PartyPopper size={20} />;
  if (cat === "SECURITY") return <Shield size={20} />;
  return <Diamond size={20} />;
}

export default function PlannerPage() {
  const [cart, setCart]     = useState<CartItem[]>([]);
  const [notes, setNotes]   = useState<Record<string, string>>({});
  const [times, setTimes]   = useState<Record<string, string>>({});
  const [customNote, setCustomNote] = useState("");
  const [customNotes, setCustomNotes] = useState<string[]>([]);

  useEffect(() => {
    const c = getCart();
    setCart(c);
    const n: Record<string, string> = {};
    const t: Record<string, string> = {};
    c.forEach((item) => {
      n[item.id] = item.deliveryNotes || "";
      t[item.id] = item.scheduledTime || "";
    });
    setNotes(n);
    setTimes(t);
  }, []);

  const handleRemove = (id: string) => {
    removeFromCart(id);
    setCart(getCart());
  };

  const handleTimeChange = (id: string, val: string) => {
    setTimes((prev) => ({ ...prev, [id]: val }));
    updateScheduledTime(id, val);
  };

  const handleNotesChange = (id: string, val: string) => {
    setNotes((prev) => ({ ...prev, [id]: val }));
    updateDeliveryNotes(id, val);
  };

  const addCustomNote = () => {
    const trimmed = customNote.trim();
    if (trimmed) {
      setCustomNotes((prev) => [...prev, trimmed]);
      setCustomNote("");
    }
  };

  const sortedForTimeline = [...cart].sort((a, b) => {
    if (!a.scheduledTime && !b.scheduledTime) return 0;
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
  });

  const total      = getCartTotal(cart);
  const fee        = getPlatformFee(total);
  const grandTotal = total + fee;

  const printPlan = () => window.print();

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.orb1} aria-hidden="true" />

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <p className={styles.eyebrow} style={{ display: "flex", alignItems: "center", gap: 6 }}><Diamond size={14} /> Occasion Planning</p>
          <h1 className={styles.pageTitle}>Your Occasion Plan</h1>
          <p className={styles.pageSubtitle}>
            {cart.length === 0
              ? "Your plan is empty. Browse providers to get started."
              : `${cart.length} service${cart.length > 1 ? "s" : ""} planned`}
          </p>
        </div>
        {cart.length > 0 && (
          <div className={styles.pageHeaderActions}>
            <button className={styles.printBtn} onClick={printPlan} id="planner-print" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Printer size={16} /> Export Plan
            </button>
            <Link href="/planner/checkout" className={styles.checkoutBtn} id="planner-checkout" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {cart.length === 0 ? (
        /* ── Empty state ── */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Diamond size={48} strokeWidth={1} /></div>
          <h2 className={styles.emptyTitle}>Your occasion plan is empty</h2>
          <p className={styles.emptyDesc}>
            Browse our curated providers and add services to build your perfect occasion.
          </p>
          <Link href="/providers" className={styles.emptyBtn} id="planner-browse" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            Browse Providers <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className={styles.shell}>
          {/* ── LEFT: Cart ── */}
          <section className={styles.cartSection}>
            <h2 className={styles.sectionTitle}>Services</h2>
            <div className={styles.cartList}>
              {cart.map((item) => (
                <div key={item.id} className={styles.cartCard} id={`cart-item-${item.id}`}>
                  <div className={styles.cartCardTop}>
                    <div className={styles.cartIcon}>
                      <CategoryIcon category={item.category} />
                    </div>
                    <div className={styles.cartInfo}>
                      <p className={styles.cartProvider}>{item.providerName}</p>
                      <p className={styles.cartPackage}>{item.packageName}</p>
                      {item.serviceDuration && (
                        <p className={styles.cartDuration} style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {item.serviceDuration}</p>
                      )}
                    </div>
                    <div className={styles.cartRight}>
                      <p className={styles.cartPrice}>{formatPrice(item.price)}</p>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemove(item.id)}
                        aria-label="Remove from plan"
                        id={`remove-item-${item.id}`}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      ><X size={16} /></button>
                    </div>
                  </div>

                  <div className={styles.cartCardFields}>
                    <div className={styles.cartField}>
                      <label className={styles.cartLabel}>Scheduled Time</label>
                      <input
                        type="datetime-local"
                        className={styles.cartInput}
                        value={times[item.id] || ""}
                        onChange={(e) => handleTimeChange(item.id, e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        id={`time-${item.id}`}
                      />
                    </div>
                    <div className={styles.cartField}>
                      <label className={styles.cartLabel}>Notes</label>
                      <input
                        type="text"
                        className={styles.cartInput}
                        placeholder="Any special requirements..."
                        value={notes[item.id] || ""}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        id={`notes-${item.id}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom schedule notes */}
            <div className={styles.customNotesSection}>
              <h3 className={styles.customNotesTitle}>Schedule Annotations</h3>
              <p className={styles.customNotesDesc}>Add custom notes to your timeline (e.g. "Dance floor opens at 9pm")</p>
              <div className={styles.customNoteRow}>
                <input
                  type="text"
                  className={styles.cartInput}
                  placeholder="Type a note..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomNote(); }}}
                  id="custom-note-input"
                />
                <button className={styles.addNoteBtn} onClick={addCustomNote} id="add-note-btn">+ Add</button>
              </div>
              {customNotes.length > 0 && (
                <ul className={styles.customNotesList}>
                  {customNotes.map((n, i) => (
                    <li key={i} className={styles.customNoteItem}>
                      <span className={styles.customNoteIcon} style={{ display: "flex", alignItems: "center" }}><Diamond size={12} /></span>
                      {n}
                      <button
                        className={styles.removeNoteBtn}
                        onClick={() => setCustomNotes((prev) => prev.filter((_, j) => j !== i))}
                        aria-label="Remove note"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      ><X size={14} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ── RIGHT: Timeline + Summary ── */}
          <aside className={styles.rightPanel}>
            {/* Visual timeline */}
            <div className={styles.timelineCard}>
              <h2 className={styles.sectionTitle}>Occasion Timeline</h2>
              {sortedForTimeline.length === 0 ? (
                <p className={styles.timelineEmpty}>Set times on your services to see the timeline.</p>
              ) : (
                <div className={styles.timeline}>
                  {sortedForTimeline.map((item, i) => (
                    <div key={item.id} className={styles.timelineItem} id={`timeline-${item.id}`}>
                      <div className={styles.timelineDot} />
                      {i < sortedForTimeline.length - 1 && <div className={styles.timelineLine} />}
                      <div className={styles.timelineContent}>
                        <p className={styles.timelineTime}>{timeLabel(item.scheduledTime)}</p>
                        <p className={styles.timelineProvider}>{item.providerName}</p>
                        <p className={styles.timelineService}>{item.packageName}</p>
                        {item.serviceDuration && (
                          <div
                            className={styles.timelineDurationBar}
                            style={{ width: `${Math.min(100, parseInt(item.serviceDuration) * 10)}%` }}
                            title={item.serviceDuration}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {customNotes.map((n, i) => (
                    <div key={`cn-${i}`} className={`${styles.timelineItem} ${styles.timelineItemNote}`}>
                      <div className={`${styles.timelineDot} ${styles.timelineDotNote}`} />
                      <div className={styles.timelineContent}>
                        <p className={styles.timelineProvider} style={{ color: "var(--color-gold)", display: "flex", alignItems: "center", gap: 4 }}><Pin size={12} /> {n}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price summary */}
            <div className={styles.summaryCard}>
              <h2 className={styles.sectionTitle}>Summary</h2>
              <div className={styles.summaryRows}>
                {cart.map((item) => (
                  <div key={item.id} className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>{item.providerName} — {item.packageName}</span>
                    <span className={styles.summaryValue}>{formatPrice(item.price)}</span>
                  </div>
                ))}
                <div className={styles.summaryDivider} />
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Subtotal</span>
                  <span className={styles.summaryValue}>{formatPrice(total)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Platform fee (5%)</span>
                  <span className={styles.summaryValue}>{formatPrice(fee)}</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span className={styles.summaryLabel}>Grand Total</span>
                  <span className={styles.summaryValueTotal}>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <Link href="/planner/checkout" className={styles.checkoutBtnFull} id="planner-checkout-2" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
              <p className={styles.escrowNote} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><ShieldCheck size={14} /> Payments held in escrow until your event concludes.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

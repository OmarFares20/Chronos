"use client";
import styles from "./page.module.css";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/AuthProvider";
import { humanStatus, statusClass, formatCurrency, daysUntil } from "@/lib/ui";
import { formatPrice } from "@/lib/formatPrice";
import { CustomerInsights, ProviderInsights } from "@/components/InsightsPanel";
import { ArrowRight, Plus, ShieldCheck, CalendarPlus, CalendarCheck, MessageSquare, Wallet, Search, CreditCard, BarChart2, LayoutDashboard } from "lucide-react";


export default function DashboardPage() {
  const { user } = useAuth();
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  const { data: eventsData, isLoading: eventsLoading } = useSWR("/api/events", fetcher, { refreshInterval: 10000 });
  const { data: bookingsData, isLoading: bookingsLoading } = useSWR("/api/bookings", fetcher, { refreshInterval: 10000 });

  const events = eventsData?.events || [];
  const bookings = bookingsData?.bookings || [];
  const loading = eventsLoading || bookingsLoading;

  // Memoize computed stats to avoid recalculating on every render
  const activeEvents    = useMemo(() => events.filter((e: any) => e.status !== "CANCELLED").length, [events]);
  const totalSpent      = useMemo(() => bookings.reduce((s: number, b: any) => s + Number(b.amount || 0), 0), [bookings]);
  const totalEarnings   = useMemo(() => bookings.reduce((s: number, b: any) => s + Number(b.providerPayout || b.amount || 0), 0), [bookings]);
  const inEscrow        = useMemo(() => bookings.filter((b: any) => b.status === "IN_ESCROW").reduce((s: number, b: any) => s + Number(b.amount || 0), 0), [bookings]);
  const providersHired  = useMemo(() => new Set(bookings.map((b: any) => b.providerId)).size, [bookings]);
  const activeBookings  = useMemo(() => bookings.filter((b: any) => b.status !== "CANCELLED" && b.status !== "COMPLETED").length, [bookings]);

  const isProvider = user?.role === "PROVIDER";
  const [activeTab, setActiveTab] = useState<"overview" | "insights">("overview");

  const STATS = isProvider ? [
    { id: "active-bookings", label: "Active Bookings", value: activeBookings.toString(), delta: "Pending completion", up: true },
    { id: "total-earnings",  label: "Total Earnings",  value: formatPrice(totalEarnings), delta: "Lifetime generated", up: true },
    { id: "held-in-escrow",  label: "Pending Payouts", value: formatPrice(inEscrow), delta: "Held in escrow securely", up: null },
    { id: "profile-views",   label: "Profile Views",   value: "142", delta: "Up 23% this week", up: true },
  ] : [
    { id: "active-events",   label: "Active Occasions",    value: activeEvents.toString(), delta: "+1 this month", up: true },
    { id: "total-spent",     label: "Total Spent",      value: formatPrice(totalSpent), delta: "Total historical", up: null },
    { id: "held-in-escrow",  label: "Held in Escrow",   value: formatPrice(inEscrow), delta: "Secured funds", up: null },
    { id: "providers-hired", label: "Providers Hired",  value: providersHired.toString(), delta: "Unique providers", up: true },
  ];

  return (
    <div className={styles.page}>
      {/* ── Tab switcher ── */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "0.3rem", width: "fit-content", border: "1px solid rgba(255,255,255,0.07)" }}>
        {(["overview", "insights"] as const).map((tab) => (
          <button
            key={tab}
            id={`dash-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1rem", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 500,
              letterSpacing: "0.04em", textTransform: "capitalize",
              background: activeTab === tab ? "rgba(196,164,82,0.15)" : "transparent",
              color: activeTab === tab ? "var(--color-gold)" : "var(--color-text-muted)",
              transition: "all 0.15s",
            }}
          >
            {tab === "overview" ? <LayoutDashboard size={14} /> : <BarChart2 size={14} />}
            {tab === "overview" ? "Overview" : "Insights"}
          </button>
        ))}
      </div>
      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <>
          {/* Stats row */}
          <section className={styles.statsRow} aria-label="Overview statistics">
            {STATS.map((s) => (
              <div key={s.id} id={`stat-${s.id}`} className={styles.statCard}>
                <p className={styles.statLabel}>{s.label}</p>
                <p className={styles.statValue}>{s.value}</p>
                <p className={`${styles.statDelta} ${s.up === true ? styles.statUp : ""}`}>
                  {s.delta}
                </p>
              </div>
            ))}
          </section>

          {/* Body grid */}
          <div className={styles.grid}>

            {/* Upcoming occasions */}
            {!isProvider && (
              <section className={styles.card} aria-label="Upcoming occasions">
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Upcoming Occasions</h2>
                  <Link href="/dashboard/events" className={styles.cardLink} id="dash-view-all-events" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    View All <ArrowRight size={14} />
                  </Link>
                </div>

                <div className={styles.eventsList}>
                  {events.slice(0, 3).map((ev: any) => (
                    <div key={ev.id} id={`dash-event-${ev.id}`} className={styles.eventRow}>
                      <div className={styles.eventLeft}>
                        <div className={styles.eventCountdown}>
                          <span className={`${styles.eventDays} text-gold`}>
                            {daysUntil(ev.date)}
                          </span>
                          <span className={styles.eventDaysLabel}>days</span>
                        </div>
                        <div className={styles.eventInfo}>
                          <p className={styles.eventName}>{ev.name}</p>
                          <p className={styles.eventMeta}>{new Date(ev.date).toLocaleDateString()} · {ev.guestCount} guests</p>
                          <div className={styles.progressTrack} aria-label="Event progress">
                            <div className={styles.progressFill} style={{ width: ev.status === "DRAFT" ? "20%" : ev.status === "PLANNING" ? "50%" : "100%" }} />
                          </div>
                        </div>
                      </div>
                      <span className={`${styles.statusPill} ${styles[statusClass(ev.status)]}`}>
                        {humanStatus(ev.status)}
                      </span>
                    </div>
                  ))}
                  {events.length === 0 && !loading && (
                    <p className={styles.eventMeta}>No occasions yet. Plan your first one!</p>
                  )}
                </div>

                <Link href="/events/new" className={styles.newEventBtn} id="dash-plan-new-event" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Plus size={16} /> Plan a New Occasion
                </Link>
              </section>
            )}

            {/* Recent Bookings */}
            <section className={styles.card} aria-label="Recent bookings">
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Bookings</h2>
                <Link href="/dashboard/bookings" className={styles.cardLink} id="dash-view-all-bookings" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div className={styles.bookingsList}>
                {bookings.slice(0, 4).map((b: any) => (
                  <div key={b.id} id={`dash-booking-${b.id}`} className={styles.bookingRow}>
                    <div className={styles.bookingAvatar}>
                      {b.provider?.businessName?.charAt(0) || "?"}
                    </div>
                    <div className={styles.bookingInfo}>
                      <p className={styles.bookingProvider}>{b.provider?.businessName || "Unknown Provider"}</p>
                      <p className={styles.bookingService}>{new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={styles.bookingRight}>
                      <p className={styles.bookingAmount}>{formatCurrency(Number(b.amount))}</p>
                      <span className={`${styles.statusPill} ${styles[statusClass(b.status)]}`}>
                        {humanStatus(b.status)}
                      </span>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && !loading && (
                  <p className={styles.eventMeta}>No bookings yet.</p>
                )}
              </div>
            </section>

            {/* Escrow notice */}
            <section className={styles.escrowCard} aria-label="Escrow balance">
              <div className={styles.escrowIcon} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={24} /></div>
              <div className={styles.escrowText}>
                <h3 className={styles.escrowTitle}>
                  <span className="text-gold">{formatPrice(inEscrow)}</span> in Escrow
                </h3>
                <p className={styles.escrowDesc}>
                  Your payments are safely held and release to the providers automatically once your occasions conclude.
                </p>
              </div>
              <Link href="/dashboard/payments" className={styles.escrowLink} id="dash-view-escrow" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                View Details <ArrowRight size={14} />
              </Link>
            </section>

            {/* Quick actions */}
            <section className={styles.card} aria-label="Quick actions">
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Quick Actions</h2>
              </div>
              <div className={styles.quickGrid}>
                {(isProvider ? [
                  { href: "/dashboard/provider/services", label: "Add Service",   icon: <Plus size={20} /> },
                  { href: "/dashboard/provider/bookings", label: "View Bookings", icon: <CalendarCheck size={20} /> },
                  { href: "/dashboard/messages",          label: "Messages",       icon: <MessageSquare size={20} /> },
                  { href: "/dashboard/provider/earnings", label: "Earnings",       icon: <Wallet size={20} /> },
                ] : [
                  { href: "/events/new",          label: "Plan Occasion",    icon: <CalendarPlus size={20} /> },
                  { href: "/providers",            label: "Browse Providers", icon: <Search size={20} /> },
                  { href: "/dashboard/messages",   label: "Messages",         icon: <MessageSquare size={20} /> },
                  { href: "/dashboard/payments",   label: "Payments",         icon: <CreditCard size={20} /> },
                ]).map((a) => (
                  <Link key={a.href} href={a.href} className={styles.quickAction} id={`dash-quick-${a.label.toLowerCase().replace(/\s/g, "-")}`}>
                    <span className={styles.quickIcon}>{a.icon}</span>
                    <span className={styles.quickLabel}>{a.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      {/* ── Insights tab ── */}
      {activeTab === "insights" && (
        <div style={{ animation: "fadeInUp 0.2s ease" }}>
          {isProvider ? <ProviderInsights /> : <CustomerInsights />}
        </div>
      )}
    </div>
  );
}

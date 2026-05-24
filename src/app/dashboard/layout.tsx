"use client";
import styles from "./layout.module.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BadgeProvider, useBadges } from "@/components/BadgeContext";
import { LayoutDashboard, CalendarDays, CalendarCheck, MessageSquare, CreditCard, Settings, Briefcase, BadgePercent, Clock, User, ShieldAlert, Sparkles, Menu, Bell, LogOut, Mail, CalendarClock, X, AlertTriangle } from "lucide-react";

const CUSTOMER_NAV = [
  { href: "/dashboard",          icon: <LayoutDashboard size={18} />, label: "Overview" },
  { href: "/dashboard/events",   icon: <CalendarDays size={18} />, label: "My Occasions" },
  { href: "/dashboard/bookings", icon: <CalendarCheck size={18} />, label: "Bookings" },
  { href: "/dashboard/messages", icon: <MessageSquare size={18} />, label: "Messages", badgeKey: "messages" },
  { href: "/dashboard/payments", icon: <CreditCard size={18} />, label: "Payments" },
  { href: "/dashboard/disputes", icon: <AlertTriangle size={18} />, label: "Support" },
  { href: "/dashboard/settings", icon: <Settings size={18} />, label: "Settings" },
];

const PROVIDER_NAV = [
  { href: "/dashboard",                        icon: <LayoutDashboard size={18} />, label: "Overview" },
  { href: "/dashboard/provider/bookings",      icon: <CalendarCheck size={18} />, label: "Bookings", badgeKey: "bookings" },
  { href: "/dashboard/provider/services",      icon: <Briefcase size={18} />, label: "My Services" },
  { href: "/dashboard/messages",               icon: <MessageSquare size={18} />, label: "Messages", badgeKey: "messages" },
  { href: "/dashboard/provider/earnings",      icon: <CreditCard size={18} />, label: "Earnings" },
  { href: "/dashboard/provider/promotions",    icon: <BadgePercent size={18} />, label: "Promotions" },
  { href: "/dashboard/provider/availability",  icon: <Clock size={18} />, label: "Availability" },
  { href: "/dashboard/provider/profile",       icon: <User size={18} />, label: "My Profile" },
  { href: "/dashboard/disputes", icon: <AlertTriangle size={18} />, label: "Support" },
  { href: "/dashboard/settings",               icon: <Settings size={18} />, label: "Settings" },
];

const ADMIN_EXTRA = { href: "/admin", icon: <ShieldAlert size={18} />, label: "Admin Console" };

// ── Inner layout — uses BadgeContext, must be a child of BadgeProvider ──────
function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, logout } = useAuth();
  // Live badge counts from shared context (refresh on route-change + polling + events)
  const { unreadMessages, pendingBookings, totalUnread, refresh: refreshBadges } = useBadges();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<{
    id: string; type: string; title: string; body: string; href: string; createdAt: string; isRead: boolean;
  }[]>([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sync bell dot with badge context total
  useEffect(() => { setNotifUnread(totalUnread); }, [totalUnread]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  const badges: Record<string, number> = {
    messages: unreadMessages,
    bookings: pendingBookings,
  };

  // Resolve navigation links contextually. Default to customer to avoid crashes before auth hydration.
  const nav = user?.role === "PROVIDER" ? PROVIDER_NAV : CUSTOMER_NAV;

  return (
    <div className={styles.shell}>
      {/* Mobile sidebar backdrop */}
      {mobileNavOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileNavOpen ? styles.sidebarMobileOpen : ""}`}>
        {/* Logo */}
        <Link href="/" className={styles.sidebarLogo} id="dash-logo">
          <Image src="/chronos-logo.webp" alt="Chronos" width={36} height={36} className={styles.sidebarLogoImg} />
          {!collapsed && <span className={styles.sidebarLogoText}>CHRONOS</span>}
        </Link>

        {/* Role pill */}
        {!collapsed && user && (
          <div className={styles.rolePill}>
            <span className={styles.roleDot} />
            {user.role === "PROVIDER" ? "Provider Account" : "Customer Account"}
          </div>
        )}

        <div className={styles.sidebarDivider} />

        {/* Nav links */}
        <nav className={styles.nav} aria-label="Dashboard navigation">
          {nav.map((item) => {
            const active = pathname === item.href;
            const badgeCount = item.badgeKey ? (badges[item.badgeKey] || 0) : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`dash-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                {!collapsed && badgeCount > 0 && (
                  <span className={styles.navBadge}>{badgeCount}</span>
                )}
                {collapsed && badgeCount > 0 && (
                  <span className={styles.navBadgeDot} />
                )}
              </Link>
            );
          })}

          {/* Admin Console — visible only to admins */}
          {user?.role === "ADMIN" && (
            <Link
              href={ADMIN_EXTRA.href}
              id="dash-nav-admin"
              className={`${styles.navLink} ${pathname.startsWith("/admin") ? styles.navLinkActive : ""}`}
              title={collapsed ? ADMIN_EXTRA.label : undefined}
              style={{ marginTop: "0.5rem", borderTop: "1px solid var(--color-border-gold)", paddingTop: "0.85rem" }}
            >
              <span className={styles.navIcon}>{ADMIN_EXTRA.icon}</span>
              {!collapsed && <span className={styles.navLabel} style={{ color: "var(--color-gold)" }}>{ADMIN_EXTRA.label}</span>}
            </Link>
          )}
        </nav>


        {/* Collapse toggle */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
          id="dash-collapse-sidebar"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>

        {/* User card / Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: 'auto', paddingBottom: '1rem' }}>
          <div className={`${styles.userCard} ${collapsed ? styles.userCardCollapsed : ""}`}>
            <div className={styles.userAvatar}>{user?.name?.charAt(0).toUpperCase() || "?"}</div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <p className={styles.userName}>{user?.name || "Guest"}</p>
                <p className={styles.userEmail}>{user?.email}</p>
              </div>
            )}
          </div>
          <button 
            className={`${styles.userCard} ${collapsed ? styles.userCardCollapsed : ""}`} 
            style={{ cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', background: 'transparent' }} 
            onClick={logout}
          >
            <div className={styles.userAvatar} style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}><LogOut size={16} /></div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <p className={styles.userName} style={{ color: 'var(--color-silver-light)' }}>Log Out</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Mobile menu toggle */}
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label="Open navigation"
              id="dash-mobile-menu"
            >
              <Menu size={20} />
            </button>
            <p className={styles.topBarGreeting} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Good morning, {user?.name?.split(' ')[0] || "Guest"} <Sparkles size={14} color="var(--color-gold)" />
            </p>
          </div>
          <div className={styles.topBarRight}>
            {user?.role === "PROVIDER" ? (
              <Link href="/dashboard/provider/services" className={styles.topBarCta} id="dash-add-service">
                + Add Service
              </Link>
            ) : (
              <Link href="/events/new" className={styles.topBarCta} id="dash-new-event">
                + Plan New Occasion
              </Link>
            )}
            {/* Bell notification button + dropdown */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                className={styles.topBarNotif}
                id="dash-notifications"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                onClick={() => {
                  if (!notifOpen) {
                    setNotifOpen(true);
                    setNotifLoading(true);
                    fetch("/api/notifications")
                      .then((r) => r.ok ? r.json() : { notifications: [], unreadCount: 0 })
                      .then((d) => {
                        setNotifications(d.notifications || []);
                        setNotifUnread(d.unreadCount || 0);
                      })
                      .catch(() => {})
                      .finally(() => setNotifLoading(false));
                  } else {
                    setNotifOpen(false);
                  }
                }}
                style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Bell size={20} />
                {notifUnread > 0 && (
                  <span className={styles.notifDot} style={{ position: "absolute", top: 2, right: 2 }}>
                    {notifUnread > 9 ? "" : ""}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {notifOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  width: 360, maxHeight: 480, overflowY: "auto",
                  background: "rgba(14,15,22,0.98)",
                  border: "1px solid var(--color-border-gold)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "0 16px 60px rgba(0,0,0,0.6)",
                  backdropFilter: "blur(20px)",
                  zIndex: 200,
                }}>
                  {/* Header */}
                  <div style={{ padding: "1rem 1.25rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "0.88rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--color-text-primary)" }}>
                      Notifications {notifUnread > 0 && <span style={{ marginLeft: 6, background: "var(--gradient-gold)", color: "var(--color-bg)", fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: 99 }}>{notifUnread}</span>}
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {notifUnread > 0 && (
                        <button
                          onClick={() => {
                            fetch("/api/notifications", { method: "POST" }).catch(() => {});
                            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                            setNotifUnread(0);
                            // Immediately update shared badge context
                            refreshBadges();
                          }}
                          style={{ fontSize: "0.68rem", color: "var(--color-gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", letterSpacing: "0.05em", textTransform: "uppercase" }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex" }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  {notifLoading ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: "2.5rem 1.25rem", textAlign: "center" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.3 }}>🔔</div>
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>You're all caught up!</p>
                    </div>
                  ) : (
                    <div>
                      {notifications.map((n) => {
                        const Icon = n.type === "message" ? Mail : CalendarClock;
                        const diff = Date.now() - new Date(n.createdAt).getTime();
                        const ago = diff < 60_000 ? "just now"
                          : diff < 3_600_000 ? `${Math.floor(diff / 60_000)}m ago`
                          : diff < 86_400_000 ? `${Math.floor(diff / 3_600_000)}h ago`
                          : `${Math.floor(diff / 86_400_000)}d ago`;
                        return (
                          <Link
                            key={n.id}
                            href={n.href}
                            onClick={() => setNotifOpen(false)}
                            style={{
                              display: "flex", gap: "0.85rem", padding: "0.9rem 1.25rem",
                              borderBottom: "1px solid var(--color-border)",
                              background: n.isRead ? "transparent" : "rgba(196,164,82,0.04)",
                              transition: "background 0.15s",
                              textDecoration: "none",
                            }}
                          >
                            <div style={{
                              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                              background: n.isRead ? "rgba(255,255,255,0.04)" : "rgba(196,164,82,0.12)",
                              border: "1px solid " + (n.isRead ? "var(--color-border)" : "var(--color-border-gold)"),
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: n.isRead ? "var(--color-text-muted)" : "var(--color-gold)",
                            }}>
                              <Icon size={15} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "0.82rem", fontWeight: n.isRead ? 400 : 600, color: "var(--color-text-primary)", marginBottom: "0.15rem", lineHeight: 1.3 }}>{n.title}</p>
                              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</p>
                            </div>
                            <span style={{ fontSize: "0.67rem", color: "var(--color-text-muted)", flexShrink: 0, paddingTop: "0.1rem" }}>{ago}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--color-border)", textAlign: "center" }}>
                    <Link href="/dashboard/messages" onClick={() => setNotifOpen(false)}
                      style={{ fontSize: "0.72rem", color: "var(--color-gold)", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}
                    >
                      View all messages →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          {user?.role === "PROVIDER" && user.provider?.isVerified === false && (
            <div style={{
              backgroundColor: "rgba(196, 164, 82, 0.1)",
              border: "1px solid var(--color-gold)",
              color: "var(--color-gold)",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.9rem"
            }}>
              <ShieldAlert size={20} />
              <div>
                <strong>Your account is pending verification.</strong>
                <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)" }}>
                  You can browse your dashboard, but your public profile is hidden and you cannot receive bookings until an administrator approves your legal documents.
                </p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Public export — wraps shell in BadgeProvider ─────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BadgeProvider>
      <DashboardShell>{children}</DashboardShell>
    </BadgeProvider>
  );
}

"use client";
import styles from "./admin.module.css";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/formatPrice";

interface Stats {
  totalUsers:       number;
  totalProviders:   number;
  totalCustomers:   number;
  totalBookings:    number;
  pendingBookings:  number;
  escrowBookings:   number;
  disputedBookings: number;
  totalEvents:      number;
  totalMessages:    number;
  platformRevenue:  number;
  totalVolume:      number;
}
interface User    { id: string; name: string; email: string; role: string; createdAt: string; provider?: { businessName: string; isVerified: boolean }; _count: { bookingsAs: number; events: number } }
interface Booking { id: string; amount: number; status: string; createdAt: string; customer: { name: string }; provider: { businessName: string }; package?: { name: string } }
interface Provider{ id: string; businessName: string; location?: string; reviewCount: number; bookingCount: number; avgRating: number }
interface Application { id: string; status: string; commercialRegister: string; taxCard: string; idCard: string; createdAt: string; user: { name: string; email: string }; rejectionReason: string | null }
interface Dispute { id: string; title: string; description: string; status: string; creatorRole: string; adminResponse?: string; resolvedAt?: string; createdAt: string; creator: { name: string; email: string }; booking?: { id: string; amount: number; provider?: { businessName: string } }; attachments: { id: string; fileName: string; filePath: string }[] }

type AdminTab = "overview" | "users" | "bookings" | "applications" | "disputes";

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "#c4a452", IN_ESCROW: "#50c878",  RELEASED: "#6488ea",
  DISPUTED:  "#f87171", CANCELLED: "#6b7280",  REFUNDED: "#a78bfa",
};

function Pill({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "var(--color-text-muted)";
  return (
    <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "0.18rem 0.55rem", borderRadius: "99px", border: `1px solid ${color}55`, background: `${color}18`, color }}>
      {status}
    </span>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab]             = useState<AdminTab>("overview");
  const [stats, setStats]         = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers]     = useState<User[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [topProviders, setTopProviders]   = useState<Provider[]>([]);
  const [users, setUsers]         = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userSearch, setUserSearch]       = useState("");
  const [userRole, setUserRole]   = useState("");
  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingUsers, setLoadingUsers]   = useState(false);
  const [loadingApps, setLoadingApps]     = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [disputes, setDisputes]   = useState<Dispute[]>([]);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeResponse, setDisputeResponse] = useState<Record<string, string>>({});
  const [disputeFilter, setDisputeFilter] = useState("");
  const [expandedDispute, setExpandedDispute]   = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute]   = useState<Dispute | null>(null);
  const [disputeRoleFilter, setDisputeRoleFilter] = useState("");
  const [savingDispute, setSavingDispute]         = useState(false);
  const [disputeSaveMsg, setDisputeSaveMsg]       = useState("");

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  // ── Load stats ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setStats(data.stats);
          setRecentUsers(data.recentUsers || []);
          setRecentBookings(data.recentBookings || []);
          setTopProviders(data.topProviders || []);
        }
      })
      .finally(() => setLoadingStats(false));
  }, []);

  // ── Load user list ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "users") return;
    setLoadingUsers(true);
    const params = new URLSearchParams();
    if (userSearch) params.set("search", userSearch);
    if (userRole)   params.set("role",   userRole);
    fetch(`/api/admin/users?${params}`)
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoadingUsers(false));
  }, [tab, userSearch, userRole, disputeFilter, disputeRoleFilter]);

  // ── Load applications ──────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === "disputes") {
      setDisputeLoading(true);
      const params = new URLSearchParams();
      if (disputeFilter) params.set("status", disputeFilter);
      if (disputeRoleFilter) params.set("role", disputeRoleFilter);
      fetch("/api/disputes" + (params.toString() ? `?${params}` : ""))
        .then((r) => r.ok ? r.json() : { disputes: [] })
        .then((d) => setDisputes(d.disputes || []))
        .catch(() => {})
        .finally(() => setDisputeLoading(false));
      return;
    }
    if (tab !== "applications") return;
    setLoadingApps(true);
    fetch("/api/admin/applications")
      .then((r) => (r.ok ? r.json() : { applications: [] }))
      .then((data) => setApplications(data.applications || []))
      .finally(() => setLoadingApps(false));
  }, [tab]);

  // ── Application actions ────────────────────────────────────────────────────
  const handleApplication = async (id: string, status: "APPROVED" | "REJECTED") => {
    let reason = "";
    if (status === "REJECTED") {
      reason = prompt("Reason for rejection:") || "";
      if (!reason) return;
    }
    setActionMsg("");
    const res = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, reason }),
    });
    if (res.ok) {
      setActionMsg(`✓ Application ${status.toLowerCase()} successfully.`);
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status, rejectionReason: reason } : a));
    } else {
      setActionMsg("✗ Failed to update application.");
    }
  };

  // ── User actions ───────────────────────────────────────────────────────────
  const userAction = async (userId: string, action: string, value?: any) => {
    setActionMsg("");
    const res = await fetch("/api/admin/users", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, action, value }),
    });
    if (res.ok) {
      setActionMsg(`✓ Action "${action}" applied successfully.`);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          if (action === "verifyProvider" && u.provider) {
            return { ...u, provider: { ...u.provider, isVerified: Boolean(value) } };
          }
          if (action === "setRole") return { ...u, role: value };
          return u;
        })
      );
    } else {
      setActionMsg("✗ Action failed.");
    }
  };

  if (authLoading || (!user && !authLoading)) return null;
  if (user?.role !== "ADMIN") return null;

  const TABS: { id: AdminTab; label: string }[] = [
    { id: "overview", label: "◈ Overview"  },
    { id: "applications", label: "▤ Applications" },
    { id: "users",    label: "◆ Users"     },
    { id: "bookings", label: "◉ Bookings"  },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>◈ Admin Console</p>
          <h1 className={styles.title}>Chronos Administration</h1>
        </div>
        <Link href="/dashboard" className={styles.backBtn} id="admin-back-dashboard">← Dashboard</Link>
      </div>

      {/* Tab bar */}
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`admin-tab-${t.id}`}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className={styles.section}>
          {loadingStats ? (
            <p className={styles.loading}>Loading statistics…</p>
          ) : stats ? (
            <>
              {/* KPI grid */}
              <div className={styles.kpiGrid}>
                {[
                  { id: "total-users",    label: "Total Users",        value: stats.totalUsers.toLocaleString(),          color: "gold"  },
                  { id: "providers",      label: "Providers",          value: stats.totalProviders.toLocaleString(),      color: "gold"  },
                  { id: "customers",      label: "Customers",          value: stats.totalCustomers.toLocaleString(),      color: "silver"},
                  { id: "total-bookings", label: "Total Bookings",     value: stats.totalBookings.toLocaleString(),       color: "silver"},
                  { id: "in-escrow",      label: "In Escrow",          value: stats.escrowBookings.toLocaleString(),      color: "green" },
                  { id: "disputed",       label: "Disputed",           value: stats.disputedBookings.toLocaleString(),    color: "red"   },
                  { id: "platform-rev",   label: "Platform Revenue",   value: formatPrice(stats.platformRevenue), color: "gold" },
                  { id: "total-volume",   label: "Total GMV",           value: formatPrice(stats.totalVolume),     color: "gold" },
                ].map((k) => (
                  <div key={k.id} id={`admin-kpi-${k.id}`} className={`${styles.kpi} ${styles[`kpi${k.color.charAt(0).toUpperCase() + k.color.slice(1)}`] || ""}`}>
                    <p className={styles.kpiLabel}>{k.label}</p>
                    <p className={styles.kpiValue}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className={styles.twoCol}>
                {/* Recent users */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Recent Sign-ups</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                      <tbody>
                        {recentUsers.map((u) => (
                          <tr key={u.id} id={`admin-user-${u.id}`}>
                            <td>{u.name}</td>
                            <td className={styles.tdMuted}>{u.email}</td>
                            <td><Pill status={u.role} /></td>
                            <td className={styles.tdMuted}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top providers */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Top Providers</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead><tr><th>Business</th><th>Rating</th><th>Bookings</th></tr></thead>
                      <tbody>
                        {topProviders.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <Link href={`/providers/${p.id}`} className={styles.tableLink} id={`admin-provider-${p.id}`}>
                                {p.businessName}
                              </Link>
                            </td>
                            <td className={styles.tdGold}>★ {p.avgRating.toFixed(1)}</td>
                            <td className={styles.tdMuted}>{p.bookingCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent bookings */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Recent Bookings</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead><tr><th>Customer</th><th>Provider</th><th>Package</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {recentBookings.map((b) => (
                        <tr key={b.id} id={`admin-booking-${b.id}`}>
                          <td>{b.customer.name}</td>
                          <td>{b.provider.businessName}</td>
                          <td className={styles.tdMuted}>{b.package?.name || "—"}</td>
                          <td className={styles.tdGold}>{formatPrice(Number(b.amount))}</td>
                          <td><Pill status={b.status} /></td>
                          <td className={styles.tdMuted}>{new Date(b.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className={styles.loading}>Failed to load stats. Are you an admin?</p>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <div className={styles.section}>
          {actionMsg && (
            <div className={`${styles.actionMsg} ${actionMsg.startsWith("✓") ? styles.actionMsgOk : styles.actionMsgErr}`}>
              {actionMsg}
            </div>
          )}
          <div className={styles.filterRow}>
            <input
              className={styles.searchInput}
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              id="admin-user-search"
            />
            <select
              className={styles.roleSelect}
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              id="admin-user-role"
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="PROVIDER">Provider</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {loadingUsers ? (
            <p className={styles.loading}>Loading…</p>
          ) : (
            <div className={styles.card}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th>
                      <th>Provider</th><th>Bookings</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} id={`admin-users-row-${u.id}`}>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td className={styles.tdMuted}>{u.email}</td>
                        <td><Pill status={u.role} /></td>
                        <td className={styles.tdMuted}>
                          {u.provider
                            ? <span>{u.provider.businessName} {u.provider.isVerified ? "✓" : ""}</span>
                            : "—"}
                        </td>
                        <td className={styles.tdMuted}>{u._count.bookingsAs}</td>
                        <td className={styles.tdMuted}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            {u.role === "PROVIDER" && !u.provider?.isVerified && (
                              <button
                                className={styles.actionBtn}
                                onClick={() => userAction(u.id, "verifyProvider", true)}
                                id={`admin-verify-${u.id}`}
                              >
                                Verify
                              </button>
                            )}
                            {u.role === "PROVIDER" && u.provider?.isVerified && (
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => userAction(u.id, "verifyProvider", false)}
                                id={`admin-unverify-${u.id}`}
                              >
                                Unverify
                              </button>
                            )}
                            {u.role !== "ADMIN" && (
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => { if (confirm(`Demote ${u.name} to CUSTOMER?`)) userAction(u.id, "setRole", "CUSTOMER"); }}
                                id={`admin-demote-${u.id}`}
                              >
                                Demote
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BOOKINGS ── */}
      {tab === "bookings" && (
        <div className={styles.section}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Recent Bookings</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>ID</th><th>Customer</th><th>Provider</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id} id={`admin-book-row-${b.id}`}>
                      <td className={styles.tdMuted} style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{b.id.slice(0, 8)}…</td>
                      <td>{b.customer.name}</td>
                      <td>{b.provider.businessName}</td>
                      <td className={styles.tdGold}>{formatPrice(Number(b.amount))}</td>
                      <td><Pill status={b.status} /></td>
                      <td className={styles.tdMuted}>{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── APPLICATIONS ── */}

      {tab === "disputes" && (() => {
        const STATUS_COLOR: Record<string, string> = { OPEN: "#f2c94c", IN_PROGRESS: "#56b3ff", RESOLVED: "#50c878", CLOSED: "#9ca3af" };
        const SEL = selectedDispute;
        const LABEL: Record<string,string> = { OPEN:"Open", IN_PROGRESS:"In Progress", RESOLVED:"Resolved", CLOSED:"Closed" };

        const saveDispute = async (updates: { status?: string; adminResponse?: string }) => {
          if (!SEL) return;
          setSavingDispute(true);
          try {
            const res = await fetch(`/api/disputes/${SEL.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates),
            });
            if (res.ok) {
              const merged = { ...SEL, ...updates };
              setSelectedDispute(merged as Dispute);
              setDisputes(prev => prev.map(x => x.id === SEL.id ? merged as Dispute : x));
              setDisputeSaveMsg("✓ Saved");
              setTimeout(() => setDisputeSaveMsg(""), 2000);
            }
          } finally { setSavingDispute(false); }
        };

        return (
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

            {/* ── LEFT: dispute list ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header + filters */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--color-text-primary)", letterSpacing: "0.06em", margin: 0 }}>
                    Dispute Management
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                    {disputes.length} ticket{disputes.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select value={disputeFilter} onChange={(e) => setDisputeFilter(e.target.value)}
                    style={{ padding: "0.45rem 0.8rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.78rem" }}>
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <select value={disputeRoleFilter} onChange={(e) => setDisputeRoleFilter(e.target.value)}
                    style={{ padding: "0.45rem 0.8rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.78rem" }}>
                    <option value="">All Roles</option>
                    <option value="CUSTOMER">Customers</option>
                    <option value="PROVIDER">Providers</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {disputeLoading ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Loading disputes…</p>
              ) : disputes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)", fontSize: "0.88rem", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.07)" }}>
                  No disputes match the selected filters.
                </div>
              ) : (
                <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 100px 80px 90px", gap: "0", background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0.6rem 1rem" }}>
                    {["Title", "Filed By", "Date", "Role", ""].map((h, i) => (
                      <span key={i} style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>{h}</span>
                    ))}
                  </div>
                  {disputes.map((d, i) => {
                    const col = STATUS_COLOR[d.status] || "#9ca3af";
                    const isSelected = SEL?.id === d.id;
                    return (
                      <div key={d.id} style={{
                        display: "grid", gridTemplateColumns: "1fr 160px 100px 80px 90px",
                        gap: 0, padding: "0.85rem 1rem", alignItems: "center",
                        borderBottom: i < disputes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        background: isSelected ? "rgba(196,164,82,0.07)" : "rgba(16,17,26,0.8)",
                        cursor: "pointer", transition: "background 0.15s",
                      }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(16,17,26,0.8)"; }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</p>
                          {d.booking?.provider?.businessName && (
                            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>re: {d.booking.provider.businessName}</p>
                          )}
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.creator.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 99, border: `1px solid ${col}44`, background: `${col}15`, color: col }}>
                          {LABEL[d.status] || d.status}
                        </span>
                        <button onClick={() => setSelectedDispute(d)}
                          style={{ padding: "0.3rem 0.7rem", borderRadius: 7, background: isSelected ? "var(--gradient-gold)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: isSelected ? "#000" : "var(--color-text-primary)", fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                          {isSelected ? "Viewing" : "View →"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── RIGHT: detail panel ── */}
            {SEL && (
              <div style={{ width: 380, flexShrink: 0, background: "rgba(14,15,22,0.98)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", position: "sticky", top: "1rem", maxHeight: "85vh", overflowY: "auto" }}>
                {/* Panel header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gold)", marginBottom: "0.3rem" }}>
                      Dispute #{SEL.id.slice(-6).toUpperCase()}
                    </p>
                    <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--color-text-primary)", letterSpacing: "0.04em", margin: 0, lineHeight: 1.3 }}>
                      {SEL.title}
                    </h4>
                  </div>
                  <button onClick={() => setSelectedDispute(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "1.1rem", padding: "0.1rem 0.3rem" }}>✕</button>
                </div>

                {/* Creator info */}
                <div style={{ padding: "0.85rem", background: "rgba(0,0,0,0.25)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>Filed by:</strong> {SEL.creator.name} ({SEL.creator.email})
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>Role:</strong> {SEL.creatorRole}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>Date:</strong> {new Date(SEL.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {SEL.booking && (
                    <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      <strong style={{ color: "var(--color-text-primary)" }}>Booking:</strong> #{SEL.booking.id.slice(-6).toUpperCase()}
                      {SEL.booking.provider?.businessName && ` · ${SEL.booking.provider.businessName}`}
                      {SEL.booking.amount && ` · EGP ${Number(SEL.booking.amount).toLocaleString("en-US")}`}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Description</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.65, padding: "0.75rem", background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                    {SEL.description}
                  </p>
                </div>

                {/* Attachments */}
                {SEL.attachments.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Attachments</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {SEL.attachments.map((a) => (
                        <a key={a.id} href={a.filePath} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: "0.72rem", padding: "0.25rem 0.65rem", borderRadius: 6, background: "rgba(196,164,82,0.1)", color: "var(--color-gold)", textDecoration: "none", border: "1px solid rgba(196,164,82,0.2)" }}>
                          📎 {a.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status update */}
                <div>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                    Update Status
                  </label>
                  <select value={SEL.status}
                    onChange={(e) => { setSelectedDispute({ ...SEL, status: e.target.value }); saveDispute({ status: e.target.value }); }}
                    style={{ width: "100%", padding: "0.6rem 0.9rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.85rem", outline: "none" }}>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {/* Admin response */}
                <div>
                  <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                    Admin Response
                  </label>
                  <textarea rows={4} value={disputeResponse[SEL.id] ?? SEL.adminResponse ?? ""}
                    placeholder="Write a response visible to the user…"
                    onChange={(e) => setDisputeResponse(prev => ({ ...prev, [SEL.id]: e.target.value }))}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "var(--color-text-primary)", fontSize: "0.85rem", fontFamily: "var(--font-body)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.6rem" }}>
                    <button
                      onClick={() => saveDispute({ adminResponse: disputeResponse[SEL.id] ?? SEL.adminResponse ?? "" })}
                      disabled={savingDispute}
                      style={{ flex: 1, padding: "0.6rem", background: savingDispute ? "rgba(196,164,82,0.4)" : "var(--gradient-gold)", border: "none", borderRadius: 8, color: savingDispute ? "rgba(0,0,0,0.5)" : "#000", fontWeight: 700, fontSize: "0.82rem", fontFamily: "var(--font-body)", cursor: savingDispute ? "wait" : "pointer" }}>
                      {savingDispute ? "Saving…" : "Save Response"}
                    </button>
                    {disputeSaveMsg && (
                      <span style={{ fontSize: "0.78rem", color: "#50c878", fontWeight: 600 }}>{disputeSaveMsg}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
      {tab === "applications" && (
        <div className={styles.section}>
          {actionMsg && (
            <div className={`${styles.actionMsg} ${actionMsg.startsWith("✓") ? styles.actionMsgOk : styles.actionMsgErr}`}>
              {actionMsg}
            </div>
          )}
          {loadingApps ? (
            <p className={styles.loading}>Loading applications…</p>
          ) : (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Provider Applications</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Documents</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>{app.user.name}</td>
                        <td className={styles.tdMuted}>{app.user.email}</td>
                        <td><Pill status={app.status} /></td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <a href={app.commercialRegister} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>CR</a>
                            <a href={app.taxCard} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>Tax</a>
                            <a href={app.idCard} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>ID</a>
                          </div>
                        </td>
                        <td className={styles.tdMuted}>{new Date(app.createdAt).toLocaleDateString()}</td>
                        <td>
                          {app.status === "PENDING" && (
                            <div className={styles.actionBtns}>
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleApplication(app.id, "APPROVED")}
                              >
                                Approve
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => handleApplication(app.id, "REJECTED")}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {app.status === "REJECTED" && (
                            <span className={styles.tdMuted} title={app.rejectionReason || ""}>Reason: {app.rejectionReason}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {applications.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>No applications found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

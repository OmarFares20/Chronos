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

type AdminTab = "overview" | "users" | "bookings" | "applications";

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
  }, [tab, userSearch, userRole]);

  // ── Load applications ──────────────────────────────────────────────────────
  useEffect(() => {
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

"use client";
/**
 * InsightsPanel — Shared insight component for customer & provider dashboards.
 * Uses SWR + pure CSS bar charts. No charting library dependencies.
 */
import useSWR from "swr";
import { formatPrice } from "@/lib/formatPrice";
import {
  TrendingUp, Star, CheckCircle, Clock,
  CalendarCheck, Wallet, Users, BarChart2, Award,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Shared primitives ─────────────────────────────────────────────────────────

function StatTile({
  label, value, sub, icon, gold,
}: { label: string; value: string; sub?: string; icon: React.ReactNode; gold?: boolean }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${gold ? "rgba(196,164,82,0.35)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 12,
      padding: "1.1rem 1.25rem",
      display: "flex", alignItems: "flex-start", gap: "0.85rem",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: gold ? "rgba(196,164,82,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${gold ? "rgba(196,164,82,0.3)" : "rgba(255,255,255,0.08)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: gold ? "var(--color-gold)" : "var(--color-text-secondary)",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>{label}</p>
        <p style={{ fontSize: "1.35rem", fontWeight: 700, fontFamily: "var(--font-display)", color: gold ? "var(--color-gold)" : "var(--color-text-primary)", letterSpacing: "0.02em" }}>{value}</p>
        {sub && <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>{sub}</p>}
      </div>
    </div>
  );
}

/** Pure-CSS horizontal bar chart */
function BarChart({
  data, valueKey, labelKey, colorFn, formatVal,
}: {
  data: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  colorFn?: (item: Record<string, unknown>, i: number) => string;
  formatVal?: (v: number) => string;
}) {
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = Math.round((val / max) * 100);
        const color = colorFn ? colorFn(d, i) : "var(--color-gold)";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <span style={{ width: 52, fontSize: "0.7rem", color: "var(--color-text-muted)", flexShrink: 0, textAlign: "right", whiteSpace: "nowrap" }}>
              {String(d[labelKey])}
            </span>
            <div style={{ flex: 1, height: 8, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 99,
                background: color,
                transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                minWidth: val > 0 ? 4 : 0,
              }} />
            </div>
            <span style={{ width: 72, fontSize: "0.72rem", color: "var(--color-text-secondary)", textAlign: "right", flexShrink: 0 }}>
              {formatVal ? formatVal(val) : val.toLocaleString("en-US")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Star rating display */
function StarRating({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={13} fill={s <= Math.round(value) ? "var(--color-gold)" : "transparent"}
          color={s <= Math.round(value) ? "var(--color-gold)" : "rgba(255,255,255,0.2)"} />
      ))}
    </span>
  );
}

/** Section container */
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "1.4rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.1rem" }}>
        {icon && <span style={{ color: "var(--color-gold)" }}>{icon}</span>}
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.82rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Customer Insights ─────────────────────────────────────────────────────────

export function CustomerInsights() {
  const { data, isLoading } = useSWR("/api/insights/customer", fetcher, { refreshInterval: 60_000 });

  if (isLoading) return <InsightsSkeleton />;
  if (!data?.stats) return null;

  const { stats, favouriteProviders = [], monthlySpend = [], typeBreakdown = {} } = data;

  const typeData = Object.entries(typeBreakdown as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ label: type.replace(/_/g, " "), value: count }));

  return (
    <div>
      <SectionHeader title="Your Insights" subtitle="A summary of your activity on Chronos" />

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.9rem", marginBottom: "1.25rem" }}>
        <StatTile label="Total Occasions"    value={stats.totalOccasions.toString()}      icon={<CalendarCheck size={17} />} />
        <StatTile label="Upcoming"           value={stats.upcomingOccasions.toString()}   icon={<Clock size={17} />} />
        <StatTile label="Total Bookings"     value={stats.totalBookings.toString()}        icon={<CheckCircle size={17} />} />
        <StatTile label="Total Spent"        value={formatPrice(stats.totalSpent)}         icon={<Wallet size={17} />} gold />
        <StatTile label="In Escrow"          value={formatPrice(stats.inEscrow)}           icon={<TrendingUp size={17} />} />
        <StatTile label="Reviews Given"      value={stats.reviewsGiven.toString()}         icon={<Star size={17} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", marginBottom: "1.25rem" }}>
        {/* Monthly spend chart */}
        <Section title="Monthly Spend" icon={<BarChart2 size={14} />}>
          <BarChart
            data={monthlySpend}
            labelKey="month"
            valueKey="amount"
            formatVal={v => formatPrice(v)}
            colorFn={(_, i) => {
              const opacity = 0.4 + (i / (monthlySpend.length - 1 || 1)) * 0.6;
              return `rgba(196,164,82,${opacity})`;
            }}
          />
          {(monthlySpend as { month: string; amount: number }[]).every(m => m.amount === 0) && (
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textAlign: "center", padding: "1rem 0" }}>No spend data yet.</p>
          )}
        </Section>

        {/* Occasion type breakdown */}
        <Section title="Occasion Types" icon={<Award size={14} />}>
          {typeData.length === 0
            ? <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textAlign: "center", padding: "1rem 0" }}>No occasions planned yet.</p>
            : <BarChart data={typeData} labelKey="label" valueKey="value"
                colorFn={(_, i) => `hsl(${40 + i * 25}, 60%, 55%)`} />}
        </Section>
      </div>

      {/* Favourite providers */}
      {favouriteProviders.length > 0 && (
        <Section title="Favourite Providers" icon={<Users size={14} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {favouriteProviders.map((p: { id: string; name: string; count: number; avatarUrl: string | null; categories: string[] }) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(196,164,82,0.12)", border: "1px solid rgba(196,164,82,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-gold)", fontSize: "0.8rem",
                  overflow: "hidden",
                }}>
                  {p.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.avatarUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : p.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{p.categories.join(", ")}</p>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", flexShrink: 0 }}>{p.count} booking{p.count !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Provider Insights ─────────────────────────────────────────────────────────

export function ProviderInsights() {
  const { data, isLoading } = useSWR("/api/insights/provider", fetcher, { refreshInterval: 60_000 });

  if (isLoading) return <InsightsSkeleton />;
  if (!data?.stats) return null;

  const { stats, monthlyRevenue = [], topCustomers = [], ratingBreakdown = [], recentReviews = [] } = data;

  return (
    <div>
      <SectionHeader title="Business Insights" subtitle="Your performance overview" />

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.9rem", marginBottom: "1.25rem" }}>
        <StatTile label="Total Bookings"    value={stats.totalBookings.toString()}                         icon={<CalendarCheck size={17} />} />
        <StatTile label="Pending"           value={stats.pendingCount.toString()}                          icon={<Clock size={17} />} />
        <StatTile label="Completion Rate"   value={`${stats.completionRate}%`}                             icon={<CheckCircle size={17} />} />
        <StatTile label="Revenue (Released)" value={formatPrice(stats.totalRevenue)}                       icon={<Wallet size={17} />} gold />
        <StatTile label="Pending Payout"    value={formatPrice(stats.pendingRevenue)}                      icon={<TrendingUp size={17} />} />
        <StatTile label="Avg Rating"        value={stats.avgRating > 0 ? `${stats.avgRating} / 5` : "—"}  icon={<Star size={17} />} gold />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", marginBottom: "0.9rem" }}>
        {/* Monthly revenue */}
        <Section title="Monthly Revenue" icon={<BarChart2 size={14} />}>
          <BarChart
            data={monthlyRevenue}
            labelKey="month"
            valueKey="amount"
            formatVal={v => formatPrice(v)}
            colorFn={(_, i) => {
              const opacity = 0.35 + (i / (monthlyRevenue.length - 1 || 1)) * 0.65;
              return `rgba(196,164,82,${opacity})`;
            }}
          />
        </Section>

        {/* Rating breakdown */}
        <Section title="Rating Breakdown" icon={<Star size={14} />}>
          {stats.reviewCount === 0
            ? <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textAlign: "center", padding: "1rem 0" }}>No reviews yet.</p>
            : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--color-gold)", lineHeight: 1 }}>{stats.avgRating}</span>
                  <div>
                    <StarRating value={stats.avgRating} />
                    <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 3 }}>{stats.reviewCount} review{stats.reviewCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <BarChart
                  data={(ratingBreakdown as { star: number; count: number }[]).map(r => ({ label: `${r.star}★`, value: r.count }))}
                  labelKey="label"
                  valueKey="value"
                  colorFn={(d) => {
                    const s = Number((d as { label: string }).label.charAt(0));
                    return s >= 4 ? "rgba(74,222,128,0.8)" : s === 3 ? "rgba(250,204,21,0.8)" : "rgba(239,68,68,0.8)";
                  }}
                />
              </>
            )
          }
        </Section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
        {/* Top customers */}
        {topCustomers.length > 0 && (
          <Section title="Top Customers" icon={<Users size={14} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {(topCustomers as { id: string; name: string; count: number; spent: number }[]).map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-secondary)",
                  }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                    <p style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}>{c.count} booking{c.count !== 1 ? "s" : ""}</p>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-gold)", flexShrink: 0 }}>{formatPrice(c.spent)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recent reviews */}
        {recentReviews.length > 0 && (
          <Section title="Recent Reviews" icon={<Star size={14} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(recentReviews as { id: string; rating: number; comment: string | null; createdAt: string }[]).map((r) => (
                <div key={r.id} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <StarRating value={r.rating} />
                    <span style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}>
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-primary)", marginBottom: "0.2rem" }}>{title}</h2>
      <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{subtitle}</p>
    </div>
  );
}

function InsightsSkeleton() {
  const boxes = [6, 6, 2];
  return (
    <div style={{ animation: "fadeInUp 0.2s ease" }}>
      <div style={{ height: 44, marginBottom: "1.1rem", background: "rgba(255,255,255,0.04)", borderRadius: 8, width: 220 }} />
      {boxes.map((cols, gi) => (
        <div key={gi} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0.9rem", marginBottom: "0.9rem" }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} style={{ height: 80, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite alternate" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

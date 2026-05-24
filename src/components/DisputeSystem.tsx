"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { AlertTriangle, Plus, X, Upload, CheckCircle, Clock, Search, ChevronDown } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type DisputeStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface Dispute {
  id: string;
  title: string;
  description: string;
  status: DisputeStatus;
  creatorRole: string;
  adminResponse?: string;
  resolvedAt?: string;
  createdAt: string;
  booking?: { id: string; amount: number; provider?: { businessName: string } };
  attachments: { id: string; fileName: string; filePath: string }[];
}

interface Booking { id: string; provider?: { businessName: string }; event?: { name: string } }

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_META: Record<DisputeStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  OPEN:        { label: "Open",        color: "#f2c94c", bg: "rgba(242,201,76,0.12)",   icon: <Clock size={12} /> },
  IN_PROGRESS: { label: "In Progress", color: "#56b3ff", bg: "rgba(86,179,255,0.1)",   icon: <Search size={12} /> },
  RESOLVED:    { label: "Resolved",    color: "#50c878", bg: "rgba(80,200,120,0.12)",  icon: <CheckCircle size={12} /> },
  CLOSED:      { label: "Closed",      color: "#9ca3af", bg: "rgba(156,163,175,0.1)",  icon: <X size={12} /> },
};

function StatusBadge({ status }: { status: DisputeStatus }) {
  const m = STATUS_META[status] || STATUS_META.OPEN;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0.2rem 0.6rem",
      borderRadius: 99, border: `1px solid ${m.color}55`, background: m.bg,
      color: m.color, fontSize: "0.7rem", fontWeight: 700 }}>
      {m.icon} {m.label}
    </span>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "0.75rem 1rem", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)",
  color: "var(--color-text-primary)", fontSize: "0.9rem",
  fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box",
};

// ── File upload helper (reuses /api/upload) ────────────────────────────────────
async function uploadFile(file: File): Promise<{ filePath: string; fileName: string; fileSize: number } | null> {
  if (file.size > 5 * 1024 * 1024) return null; // 5 MB max
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) return null;

  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) return null;
  const data = await res.json();
  return { filePath: data.url || data.path || "", fileName: file.name, fileSize: file.size };
}

// ── Dispute Form Modal ─────────────────────────────────────────────────────────
function DisputeFormModal({
  onClose, onCreated, bookings,
}: { onClose: () => void; onCreated: () => void; bookings: Booking[] }) {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId]     = useState("");
  const [files, setFiles]             = useState<File[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
  };

  const handleSubmit = async () => {
    if (!title.trim() || title.length < 5) { setError("Title must be at least 5 characters."); return; }
    if (!description.trim() || description.length < 20) { setError("Please describe the issue in more detail (at least 20 characters)."); return; }
    setError("");
    setSubmitting(true);

    // Upload attachments first
    let attachments: { filePath: string; fileName: string; fileSize: number }[] = [];
    if (files.length > 0) {
      setUploading(true);
      const results = await Promise.all(files.map(uploadFile));
      attachments = results.filter(Boolean) as typeof attachments;
      setUploading(false);
    }

    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, bookingId: bookingId || null, attachments }),
    });

    if (res.ok) {
      onCreated();
      onClose();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to submit dispute.");
    }
    setSubmitting(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "var(--color-bg-alt)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 540,
        display: "flex", flexDirection: "column", gap: "1.25rem", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem",
              color: "var(--color-text-primary)", letterSpacing: "0.05em", margin: 0 }}>
              File a Dispute
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
              Our support team will review and respond within 24–48 hours.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer",
            color: "var(--color-text-muted)", padding: "0.25rem" }}>
            <X size={20} />
          </button>
        </div>

        {/* Title */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>
            Issue Title *
          </label>
          <input style={INPUT} placeholder="e.g. Provider did not show up on event day"
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>
            Description *
          </label>
          <textarea style={{ ...INPUT, resize: "vertical", minHeight: 120 }}
            placeholder="Please describe what happened in detail, including dates, amounts, and any relevant context..."
            value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
            {description.length}/2000
          </p>
        </div>

        {/* Booking reference */}
        {bookings.length > 0 && (
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>
              Related Booking (optional)
            </label>
            <div style={{ position: "relative" }}>
              <select style={{ ...INPUT, appearance: "none", paddingRight: "2rem" }}
                value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                <option value="">— No specific booking —</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.event?.name || "Booking"} {b.provider ? `· ${b.provider.businessName}` : ""} (#{b.id.slice(-6)})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            </div>
          </div>
        )}

        {/* File upload */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>
            Attachments (optional, max 5 files, 5MB each)
          </label>
          <div style={{ border: "2px dashed rgba(196,164,82,0.25)", borderRadius: 10,
            padding: "1rem", textAlign: "center", cursor: "pointer",
            background: "rgba(0,0,0,0.2)" }}
            onClick={() => document.getElementById("dispute-files")?.click()}>
            <input id="dispute-files" type="file" multiple accept="image/*,application/pdf"
              style={{ display: "none" }} onChange={handleFiles} />
            <Upload size={20} color="var(--color-text-muted)" style={{ margin: "0 auto 0.4rem" }} />
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              Click to upload images or PDFs
            </p>
          </div>
          {files.length > 0 && (
            <div style={{ marginTop: "0.6rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: "0.78rem", color: "var(--color-text-muted)",
                  padding: "0.3rem 0.6rem", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                  <span>{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)", color: "#ff6b6b", fontSize: "0.83rem",
            display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleSubmit} disabled={submitting || uploading}
            style={{ flex: 1, padding: "0.85rem", background: submitting ? "rgba(196,164,82,0.4)" : "var(--gradient-gold)",
              border: "none", borderRadius: 10, color: submitting ? "rgba(255,255,255,0.6)" : "#000",
              fontWeight: 700, fontSize: "0.88rem", fontFamily: "var(--font-body)", cursor: submitting ? "wait" : "pointer" }}>
            {uploading ? "Uploading files…" : submitting ? "Submitting…" : "Submit Dispute"}
          </button>
          <button onClick={onClose}
            style={{ padding: "0.85rem 1.5rem", background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
              color: "var(--color-text-muted)", fontSize: "0.88rem", fontFamily: "var(--font-body)", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dispute Card ───────────────────────────────────────────────────────────────
function DisputeCard({ d }: { d: Dispute }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "rgba(16,17,26,0.8)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.92rem",
            marginBottom: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {d.title}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Filed {new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {d.booking?.provider?.businessName && ` · ${d.booking.provider.businessName}`}
          </p>
        </div>
        <StatusBadge status={d.status} />
      </div>

      {expanded && (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {d.description}
          </p>
          {d.attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {d.attachments.map((a) => (
                <a key={a.id} href={a.filePath} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: 6,
                    background: "rgba(255,255,255,0.06)", color: "var(--color-gold)",
                    textDecoration: "none", border: "1px solid rgba(196,164,82,0.2)" }}>
                  📎 {a.fileName}
                </a>
              ))}
            </div>
          )}
          {d.adminResponse && (
            <div style={{ padding: "0.85rem 1rem", borderRadius: 10, background: "rgba(80,200,120,0.07)",
              border: "1px solid rgba(80,200,120,0.2)" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#50c878", marginBottom: "0.4rem",
                textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Admin Response
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                {d.adminResponse}
              </p>
            </div>
          )}
        </>
      )}

      <button onClick={() => setExpanded(!expanded)}
        style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer",
          color: "var(--color-gold)", fontSize: "0.78rem", fontFamily: "var(--font-body)", padding: 0 }}>
        {expanded ? "Show less ▲" : "Show details ▼"}
      </button>
    </div>
  );
}

// ── Main DisputeSystem component ───────────────────────────────────────────────
export default function DisputeSystem({ userRole = "CUSTOMER" }: { userRole?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const { data, mutate } = useSWR<{ disputes: Dispute[] }>("/api/disputes", fetcher, { refreshInterval: 15000 });
  const disputes = data?.disputes || [];

  // Load user's bookings for the dropdown
  useEffect(() => {
    const endpoint = userRole === "PROVIDER" ? "/api/bookings?role=provider" : "/api/bookings";
    fetch(endpoint)
      .then((r) => r.ok ? r.json() : { bookings: [] })
      .then((d) => setBookings(d.bookings || []))
      .catch(() => {});
  }, [userRole]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem",
            color: "var(--color-text-primary)", letterSpacing: "0.06em", margin: 0 }}>
            My Disputes
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            {disputes.length} dispute{disputes.length !== 1 ? "s" : ""} filed
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.6rem 1.1rem",
            background: "var(--gradient-gold)", border: "none", borderRadius: 8,
            color: "#000", fontWeight: 700, fontSize: "0.82rem", fontFamily: "var(--font-body)", cursor: "pointer" }}>
          <Plus size={15} /> File Dispute
        </button>
      </div>

      {/* Disputes list */}
      {disputes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 2rem", background: "rgba(255,255,255,0.02)",
          borderRadius: 14, border: "1px dashed rgba(255,255,255,0.07)" }}>
          <AlertTriangle size={40} strokeWidth={1} color="var(--color-text-muted)" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>No disputes filed yet</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", marginTop: "0.4rem" }}>
            If you have an issue, use the button above to get support.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {disputes.map((d) => <DisputeCard key={d.id} d={d} />)}
        </div>
      )}

      {showForm && (
        <DisputeFormModal
          onClose={() => setShowForm(false)}
          onCreated={() => mutate()}
          bookings={bookings}
        />
      )}
    </div>
  );
}

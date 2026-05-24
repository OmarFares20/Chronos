"use client";
import styles from "../../page.module.css";
import { useState, useEffect } from "react";
import { useToast } from "@/components/Toaster";
import { Diamond, Plus, X } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CATEGORIES = ["PHOTOGRAPHY","CATERING","DECOR","MUSIC","PLANNING","VENUE","TRANSPORT","SECURITY"];

interface Pkg { name: string; price: string; duration: string; features: string; }

export default function ServicesPage() {
  const { toast } = useToast();
  const { data, isLoading: loading, mutate } = useSWR("/api/provider/services", fetcher);
  const services = data?.services || [];

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState("PHOTOGRAPHY");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [packages, setPackages] = useState<Pkg[]>([
    { name: "", price: "", duration: "", features: "" },
  ]);

  const addPkg = () =>
    setPackages((prev) => [...prev, { name: "", price: "", duration: "", features: "" }]);

  const updatePkg = (i: number, field: keyof Pkg, val: string) =>
    setPackages((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const removePkg = (i: number) =>
    setPackages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        category,
        name,
        description,
        packages: packages.map((p) => ({
          name: p.name,
          price: p.price,
          duration: p.duration,
          features: p.features.split(",").map((f) => f.trim()).filter(Boolean),
        })),
      };
      const res = await fetch("/api/provider/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        mutate();
        toast("Service created successfully!", "success");
        setShowForm(false);
        setName(""); setDescription(""); setCategory("PHOTOGRAPHY");
        setPackages([{ name: "", price: "", duration: "", features: "" }]);
      } else {
        const err = await res.json();
        toast(err.error || "Failed to create service.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
        toast("Service removed.", "success");
      } else {
        toast("Failed to remove service.", "error");
      }
    } catch {
      toast("Network error.", "error");
    }
  };

  const inputStyle = {
    width: "100%", padding: "0.8rem", borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.25)", color: "white",
    fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none",
  };
  const labelStyle = {
    display: "block", marginBottom: "0.4rem",
    color: "var(--color-text-muted)", fontSize: "0.78rem",
    textTransform: "uppercase" as const, letterSpacing: "0.08em",
  };

  return (
    <div className={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className={styles.sectionTitle}>My Services</h2>
        <button
          className={styles.btnGold}
          onClick={() => setShowForm((v) => !v)}
          id="add-service-toggle"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {showForm ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add New Service</>}
        </button>
      </div>

      {/* Service list */}
      {loading ? (
        <p className={styles.eventMeta}>Loading services...</p>
      ) : services.length === 0 && !showForm ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.08)", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", opacity: 0.4 }}><Diamond size={48} strokeWidth={1} /></div>
          <p className={styles.eventName} style={{ marginBottom: "0.5rem" }}>No services yet</p>
          <p className={styles.eventMeta}>Add your first service to start receiving bookings.</p>
        </div>
      ) : (
        <div className={styles.bookingsList} style={{ marginBottom: "1.5rem" }}>
          {services.map((s: any) => (
            <div key={s.id} id={`service-item-${s.id}`} className={styles.bookingRow}>
              <div className={styles.bookingAvatar} style={{ background: "rgba(196,164,82,0.1)", color: "var(--color-gold)", borderColor: "rgba(196,164,82,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.category?.charAt(0) || <Diamond size={16} />}
              </div>
              <div className={styles.bookingInfo}>
                <p className={styles.bookingProvider}>{s.name}</p>
                <p className={styles.bookingService}>
                  {s.category} · {s.packages?.length || 0} package{(s.packages?.length || 0) !== 1 ? "s" : ""}
                </p>
                {s.packages?.length > 0 && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                    {s.packages.map((p: any) => (
                      <span key={p.id} style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "var(--color-silver)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {p.name} — {formatPrice(Number(p.price))}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.bookingRight}>
                <button
                  className={styles.btnGhost}
                  onClick={() => deleteService(s.id)}
                  style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                  id={`delete-service-${s.id}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSave} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", padding: "2rem", animation: "fadeInUp 0.2s ease" }} id="add-service-form">
          <h3 className={styles.eventName} style={{ marginBottom: "1.5rem" }}>New Service</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle }}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Service Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="e.g. Cinematic Wedding Photography" style={{ ...inputStyle }} />
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes your service unique..."
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ color: "var(--color-text-primary)", fontSize: "0.95rem" }}>Pricing Packages</h4>
              <button type="button" onClick={addPkg} className={styles.btnGhost}
                style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Plus size={14} /> Add Package
              </button>
            </div>

            {packages.map((pkg, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)", padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={labelStyle}>Package Name</label>
                    <input type="text" value={pkg.name} onChange={(e) => updatePkg(i, "name", e.target.value)}
                      placeholder="e.g. Standard" required style={{ ...inputStyle }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Price ($)</label>
                    <input type="number" value={pkg.price} onChange={(e) => updatePkg(i, "price", e.target.value)}
                      placeholder="2500" min="0" required style={{ ...inputStyle }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Duration</label>
                    <input type="text" value={pkg.duration} onChange={(e) => updatePkg(i, "duration", e.target.value)}
                      placeholder="e.g. 8 hours" style={{ ...inputStyle }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Features (comma separated)</label>
                  <input type="text" value={pkg.features} onChange={(e) => updatePkg(i, "features", e.target.value)}
                    placeholder="e.g. HD delivery, 300 edited photos, Online gallery" style={{ ...inputStyle }} />
                </div>
                {packages.length > 1 && (
                  <button type="button" onClick={() => removePkg(i)}
                    style={{ marginTop: "0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", color: "#ef4444", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <X size={12} /> Remove package
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="submit" className={styles.btnGold} style={{ width: "100%" }} disabled={submitting} id="save-service-btn">
            {submitting ? "Saving..." : "✓ Save Service"}
          </button>
        </form>
      )}
    </div>
  );
}

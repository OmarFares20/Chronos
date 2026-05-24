"use client";
import styles from "../../page.module.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/Toaster";
import Image from "next/image";
import { Upload, X, ImagePlus, CheckCircle, Loader2 } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Tab = "storefront" | "gallery";

interface GalleryItem { id: string; imageUrl: string; label: string | null; }

// ── Drag-and-drop file upload zone ────────────────────────────────────────────
function DropZone({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowed.includes(file.type)) {
      alert("Only JPEG, PNG, WEBP, GIF and AVIF images are supported.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("File is too large. Maximum size is 8 MB.");
      return;
    }
    onUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "var(--color-gold)" : "rgba(255,255,255,0.15)"}`,
        borderRadius: 12,
        padding: "2rem",
        textAlign: "center",
        cursor: uploading ? "wait" : "pointer",
        background: dragging ? "rgba(196,164,82,0.06)" : "rgba(255,255,255,0.02)",
        transition: "all 0.2s",
        marginBottom: "1.25rem",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        disabled={uploading}
        id="gallery-file-input"
      />
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem", color: dragging ? "var(--color-gold)" : "var(--color-text-muted)", opacity: uploading ? 0.5 : 1 }}>
        {uploading ? <Loader2 size={36} strokeWidth={1.5} style={{ animation: "spin 0.8s linear infinite" }} /> : <Upload size={36} strokeWidth={1.5} />}
      </div>
      <p style={{ color: "var(--color-text-primary)", fontSize: "0.9rem", marginBottom: "0.3rem", fontWeight: 500 }}>
        {uploading ? "Uploading…" : dragging ? "Drop image here" : "Click or drag an image here"}
      </p>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
        JPEG, PNG, WEBP, GIF, AVIF · max 8 MB
      </p>
    </div>
  );
}

// ── Avatar upload button ──────────────────────────────────────────────────────
function AvatarUpload({
  currentUrl,
  onUpload,
}: {
  currentUrl: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreview(currentUrl); }, [currentUrl]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("type", "avatar");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        setPreview(url);
        onUpload(url);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
      <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
        {preview ? (
          <Image
            src={preview}
            alt="Profile avatar"
            fill
            unoptimized
            style={{ objectFit: "cover", borderRadius: "50%", border: "2px solid var(--color-border-gold)" }}
          />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: "2px dashed rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-text-muted)",
          }}>
            <ImagePlus size={24} strokeWidth={1.5} />
          </div>
        )}
        {uploading && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite", color: "var(--color-gold)" }} />
          </div>
        )}
      </div>
      <div>
        <p style={{ color: "var(--color-text-primary)", fontSize: "0.88rem", fontWeight: 500, marginBottom: "0.3rem" }}>Profile Photo</p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginBottom: "0.6rem" }}>Appears on your public storefront</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
          id="avatar-file-input"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "0.4rem 0.85rem", borderRadius: 6,
            border: "1px solid var(--color-border-gold)",
            background: "rgba(196,164,82,0.08)", color: "var(--color-gold)",
            fontSize: "0.78rem", cursor: uploading ? "wait" : "pointer",
            fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Upload size={13} />
          {uploading ? "Uploading…" : preview ? "Change Photo" : "Upload Photo"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProviderProfileSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab]               = useState<Tab>("storefront");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio]               = useState("");
  const [location, setLocation]     = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [since, setSince]           = useState("");
  const [avatarUrl, setAvatarUrl]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [justAdded, setJustAdded]   = useState<string | null>(null); // id of last added item
  const [newImgLabel, setNewImgLabel] = useState("");
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const { data: profileData, mutate: mutateProfile } = useSWR("/api/provider/profile", fetcher);
  const { data: galleryData, mutate: mutateGallery } = useSWR("/api/provider/gallery", fetcher);

  const gallery = galleryData?.items || [];

  useEffect(() => {
    if (profileData?.profile) {
      setBusinessName(profileData.profile.businessName || "");
      setBio(profileData.profile.bio || "");
      setLocation(profileData.profile.location || "");
      setResponseTime(profileData.profile.responseTime || "");
      setSince(profileData.profile.since ? String(profileData.profile.since) : "");
      setAvatarUrl(profileData.profile.avatarUrl || "");
    }
  }, [profileData]);

  // ── Save storefront info ────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/provider/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, bio, location, responseTime, since: since ? parseInt(since) : null, avatarUrl: avatarUrl || null }),
      });
      if (res.ok) {
        mutateProfile();
        toast("Storefront updated successfully!", "success");
      }
      else toast("Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Upload gallery image ────────────────────────────────────────────────────
  const uploadGalleryFile = useCallback(async (file: File) => {
    setUploadingGallery(true);
    try {
      // 1. Upload the file
      const form = new FormData();
      form.append("file", file);
      form.append("type", "gallery");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        toast(err.error || "Upload failed.", "error");
        return;
      }
      const { url } = await uploadRes.json();

      // 2. Add to gallery
      const galleryRes = await fetch("/api/provider/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, label: newImgLabel.trim() || null }),
      });
      if (galleryRes.ok) {
        const data = await galleryRes.json();
        mutateGallery({ items: [...gallery, data.item] }, false);
        setNewImgLabel("");
        setJustAdded(data.item.id);
        setTimeout(() => setJustAdded(null), 2000);
        toast("Photo added to your gallery!", "success");
      } else {
        toast("Photo uploaded but failed to save to gallery.", "error");
      }
    } finally {
      setUploadingGallery(false);
    }
  }, [newImgLabel, toast]);

  // ── Remove gallery image ────────────────────────────────────────────────────
  const removeGalleryItem = async (id: string) => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/provider/gallery?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        mutateGallery({ items: gallery.filter((g: any) => g.id !== id) }, false);
        toast("Image removed.", "success");
      } else {
        toast("Failed to remove image.", "error");
      }
    } finally {
      setGalleryLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.8rem", borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.25)", color: "white",
    fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: "0.4rem",
    color: "var(--color-text-muted)", fontSize: "0.78rem",
    textTransform: "uppercase", letterSpacing: "0.08em",
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.sectionTitle} style={{ marginBottom: "1.5rem" }}>My Profile &amp; Storefront</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {(["storefront", "gallery"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            id={`profile-tab-${t}`}
            style={{
              background: "none", border: "none", cursor: "pointer",
              paddingBottom: "0.75rem", paddingInline: "1rem",
              borderBottom: tab === t ? "2px solid var(--color-gold)" : "2px solid transparent",
              color: tab === t ? "var(--color-gold)" : "var(--color-text-muted)",
              fontSize: "0.88rem", fontWeight: tab === t ? 600 : 400,
              textTransform: "capitalize", transition: "color 0.15s",
            }}
          >
            {t === "storefront" ? "Storefront Info" : `Photo Gallery${gallery.length > 0 ? ` (${gallery.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── Storefront tab ── */}
      {tab === "storefront" && (
        <form onSubmit={handleSave} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", padding: "2rem", maxWidth: 640, animation: "fadeInUp 0.2s ease" }}>
          {/* Avatar upload */}
          <AvatarUpload
            currentUrl={avatarUrl}
            onUpload={(url) => setAvatarUrl(url)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Business Name</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required style={inputStyle} placeholder="e.g. Lumière Studios" id="business-name-input" />
            </div>
            <div>
              <label style={labelStyle}>City / Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} placeholder="e.g. Cairo, Egypt" id="location-input" />
            </div>
            <div>
              <label style={labelStyle}>Response Time</label>
              <input type="text" value={responseTime} onChange={(e) => setResponseTime(e.target.value)} style={inputStyle} placeholder="e.g. Within 2 hours" id="response-time-input" />
            </div>
            <div>
              <label style={labelStyle}>Member Since (Year)</label>
              <input type="number" value={since} onChange={(e) => setSince(e.target.value)} style={inputStyle} placeholder="e.g. 2020" min="2000" max={new Date().getFullYear()} id="since-input" />
            </div>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={labelStyle}>Business Bio</label>
            <textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients what makes your service extraordinary..."
              style={{ ...inputStyle, resize: "vertical" }} id="bio-input" />
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.35rem" }}>
              {bio.length} / 500 characters
            </p>
          </div>

          <button type="submit" className={styles.btnGold} style={{ width: "100%" }} disabled={loading} id="save-profile-btn">
            {loading ? "Saving…" : "Save Storefront"}
          </button>
        </form>
      )}

      {/* ── Gallery tab ── */}
      {tab === "gallery" && (
        <div style={{ animation: "fadeInUp 0.2s ease", maxWidth: 780 }}>
          {/* Upload zone */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p className={styles.eventName} style={{ marginBottom: "0.75rem" }}>Add Photos</p>

            {/* Optional label input */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={labelStyle}>Photo Label <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input
                type="text"
                value={newImgLabel}
                onChange={(e) => setNewImgLabel(e.target.value)}
                placeholder="e.g. Wedding Ceremony, Corporate Gala…"
                style={{ ...inputStyle, maxWidth: 380 }}
                id="gallery-label-input"
              />
            </div>

            <DropZone onUpload={uploadGalleryFile} uploading={uploadingGallery} />

            <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textAlign: "center" }}>
              Or paste an image URL directly:
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                style={{ ...inputStyle, flex: 1 }}
                id="gallery-url-input"
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const url = (e.target as HTMLInputElement).value.trim();
                    if (!url) return;
                    const res = await fetch("/api/provider/gallery", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ imageUrl: url, label: newImgLabel.trim() || null }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      mutateGallery({ items: [...gallery, data.item] }, false);
                      setNewImgLabel("");
                      setJustAdded(data.item.id);
                      setTimeout(() => setJustAdded(null), 2000);
                      (e.target as HTMLInputElement).value = "";
                      toast("Image added to gallery.", "success");
                    }
                  }
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", alignSelf: "center", whiteSpace: "nowrap" }}>↵ Enter to add</span>
            </div>
          </div>

          {/* Gallery grid */}
          {gallery.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem", opacity: 0.35 }}>
                <ImagePlus size={48} strokeWidth={1} />
              </div>
              <p className={styles.eventMeta}>No gallery photos yet. Upload your first photo above!</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                {gallery.length} photo{gallery.length !== 1 ? "s" : ""} · Hover to remove
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                {gallery.map((item: any) => (
                  <div
                    key={item.id}
                    id={`gallery-item-${item.id}`}
                    style={{
                      position: "relative", borderRadius: 10, overflow: "hidden",
                      border: `1px solid ${justAdded === item.id ? "var(--color-gold)" : "rgba(255,255,255,0.08)"}`,
                      aspectRatio: "4/3",
                      background: "rgba(255,255,255,0.04)",
                      transition: "border-color 0.3s",
                    }}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.label || "Gallery"}
                      fill
                      unoptimized
                      style={{ objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                    {/* Overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)",
                      display: "flex", flexDirection: "column", justifyContent: "flex-end",
                      padding: "0.75rem",
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    >
                      {item.label && (
                        <span style={{ fontSize: "0.78rem", color: "white", fontWeight: 500, marginBottom: "0.35rem" }}>{item.label}</span>
                      )}
                      <button
                        onClick={() => removeGalleryItem(item.id)}
                        style={{
                          background: "rgba(239,68,68,0.85)", border: "none", borderRadius: 6,
                          color: "white", fontSize: "0.72rem", cursor: "pointer",
                          padding: "0.28rem 0.65rem", alignSelf: "flex-start",
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                        disabled={galleryLoading}
                        id={`remove-gallery-${item.id}`}
                      >
                        <X size={11} /> Remove
                      </button>
                    </div>
                    {/* Just-added checkmark */}
                    {justAdded === item.id && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        background: "rgba(74,222,128,0.9)", borderRadius: "50%",
                        width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <CheckCircle size={14} color="white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

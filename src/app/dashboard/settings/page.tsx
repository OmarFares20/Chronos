"use client";
import styles from "../page.module.css";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/Toaster";
import { Lock, Camera, UploadCloud } from "lucide-react";

type Tab = "account" | "security" | "provider";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("account");

  // Account fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Provider fields
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [addressesStr, setAddressesStr] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [savingProvider, setSavingProvider] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatarUrl || "");

      if (user.provider) {
        setBusinessName(user.provider.businessName || "");
        setBio(user.provider.bio || "");
        setLocation(user.provider.location || "");
        setAddressesStr(user.provider.addresses?.join(", ") || "");
        if (user.provider.socialLinks) {
          try {
            const social = JSON.parse(user.provider.socialLinks);
            setWebsite(social.website || "");
            setInstagram(social.instagram || "");
            setFacebook(social.facebook || "");
          } catch {}
        }
      }
    }
  }, [user]);

  const handleUploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }
    const data = await res.json();
    return data.url;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast("Uploading profile picture...", "success");
      const url = await handleUploadFile(file);
      setAvatarUrl(url);
      toast("Picture uploaded. Remember to save changes.", "success");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      toast("Uploading gallery image(s)...", "success");
      const urls = await Promise.all(files.map(file => handleUploadFile(file)));
      setGalleryUrls(prev => [...prev, ...urls]);
      toast("Images uploaded. Remember to save changes.", "success");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "account", name, email, phone, avatarUrl }),
      });
      if (res.ok) toast("Account details saved successfully!", "success");
      else {
        const err = await res.json();
        toast(err.error || "Failed to save settings.", "error");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "security", currentPassword, newPassword }),
      });
      if (res.ok) {
        toast("Password changed successfully!", "success");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to change password.", "error");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProvider(true);
    try {
      const addresses = addressesStr.split(",").map(s => s.trim()).filter(Boolean);
      const socialLinks = JSON.stringify({ website, instagram, facebook });
      
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "provider", 
          businessName, 
          bio, 
          location, 
          addresses, 
          socialLinks,
          galleryUrls
        }),
      });
      if (res.ok) {
        toast("Provider profile saved successfully!", "success");
        setGalleryUrls([]); // Clear so we don't upload again next save
      } else {
        const err = await res.json();
        toast(err.error || "Failed to save provider profile.", "error");
      }
    } finally {
      setSavingProvider(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "0.8rem 1rem", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.25)", color: "white",
    fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none",
    transition: "border-color 0.2s",
  };
  const labelStyle = {
    display: "block" as const, marginBottom: "0.4rem",
    color: "var(--color-text-muted)", fontSize: "0.78rem",
    textTransform: "uppercase" as const, letterSpacing: "0.08em",
  };
  const fieldStyle = { marginBottom: "1.25rem" };

  return (
    <div className={styles.page}>
      <h2 className={styles.sectionTitle} style={{ marginBottom: "1.5rem" }}>Account Settings</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {(["account", "security", user?.role === "PROVIDER" ? "provider" : null].filter(Boolean) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              paddingBottom: "0.75rem", paddingInline: "1.25rem",
              borderBottom: tab === t ? "2px solid var(--color-gold)" : "2px solid transparent",
              color: tab === t ? "var(--color-gold)" : "var(--color-text-muted)",
              fontSize: "0.88rem", fontWeight: tab === t ? 600 : 400,
              textTransform: "capitalize", transition: "color 0.15s",
            }}
          >
            {t === "account" ? "Account Info" : t === "security" ? "Password & Security" : "Provider Profile"}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {tab === "account" && (
        <form onSubmit={handleSaveProfile} style={{ maxWidth: 520, animation: "fadeInUp 0.2s ease" }}>
          {/* Avatar Area */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem", padding: "1.25rem", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ position: "relative", width: 72, height: 72 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(196,164,82,0.4)" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, rgba(196,164,82,0.3) 0%, rgba(196,164,82,0.1) 100%)", border: "2px solid rgba(196,164,82,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--color-gold)" }}>
                  {name.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <button type="button" onClick={() => avatarInputRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, background: "var(--color-bg)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
                <Camera size={14} />
              </button>
              <input type="file" accept="image/*" ref={avatarInputRef} style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.2rem" }}>{name || user?.name || "Your Name"}</p>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{user?.role === "PROVIDER" ? "Provider Account" : "Customer Account"}</p>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle }} required />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle }} required />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle }} placeholder="e.g. +201012345678" />
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.35rem" }}>Egyptian format (+20) will be automatically applied if omitted.</p>
          </div>

          <button type="submit" className={styles.btnGold} style={{ width: "100%", marginTop: "0.5rem" }} disabled={savingProfile} id="save-account-btn">
            {savingProfile ? "Saving..." : "Save Account Details"}
          </button>
        </form>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <form onSubmit={handleChangePassword} style={{ maxWidth: 520, animation: "fadeInUp 0.2s ease" }}>
          <div style={{ padding: "1rem 1.25rem", background: "rgba(196,164,82,0.04)", borderRadius: 10, border: "1px solid rgba(196,164,82,0.15)", marginBottom: "1.75rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.6, display: "flex", gap: "0.5rem" }}>
              <Lock size={16} style={{ flexShrink: 0, marginTop: 2 }} /> 
              <span>
                For your security, we require your current password before making any changes.
                Choose a strong password of at least 8 characters.
              </span>
            </p>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Current Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ ...inputStyle }}
              required
              id="current-password"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ ...inputStyle }}
              required
              minLength={8}
              id="new-password"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ ...inputStyle, borderColor: confirmPassword && newPassword !== confirmPassword ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }}
              required
              id="confirm-password"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.35rem" }}>Passwords do not match</p>
            )}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} style={{ accentColor: "var(--color-gold)" }} />
            Show passwords
          </label>

          <button type="submit" className={styles.btnGold} style={{ width: "100%" }} disabled={savingPassword || newPassword !== confirmPassword || !newPassword} id="change-password-btn">
            {savingPassword ? "Updating..." : "Change Password"}
          </button>
        </form>
      )}

      {/* Provider Tab */}
      {tab === "provider" && user?.role === "PROVIDER" && (
        <form onSubmit={handleSaveProvider} style={{ maxWidth: 640, animation: "fadeInUp 0.2s ease" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={labelStyle}>Business Name</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={{ ...inputStyle }} required />
            </div>
            <div>
              <label style={labelStyle}>Location (City)</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={{ ...inputStyle }} placeholder="e.g. Cairo" />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Bio / Description</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} placeholder="Tell clients about your services..." />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Service Addresses (Comma Separated)</label>
            <input type="text" value={addressesStr} onChange={(e) => setAddressesStr(e.target.value)} style={{ ...inputStyle }} placeholder="e.g. Maadi, Heliopolis, Zayed" />
          </div>

          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "1rem", marginTop: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>Social Links</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={labelStyle}>Website</label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ ...inputStyle }} placeholder="https://" />
            </div>
            <div>
              <label style={labelStyle}>Instagram Profile</label>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={{ ...inputStyle }} placeholder="e.g. @mybusiness" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Facebook Profile</label>
              <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} style={{ ...inputStyle }} placeholder="https://facebook.com/..." />
            </div>
          </div>

          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "1rem", marginTop: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>Gallery Images</h3>
          <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", marginBottom: "1.5rem" }}>
            <UploadCloud size={32} color="var(--color-text-muted)" style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>Upload new images to your gallery showcase</p>
            <input type="file" multiple accept="image/*" ref={galleryInputRef} style={{ display: "none" }} onChange={handleGalleryUpload} />
            <button type="button" onClick={() => galleryInputRef.current?.click()} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "0.5rem 1rem", borderRadius: 6, fontSize: "0.85rem", cursor: "pointer" }}>Select Images</button>
            {galleryUrls.length > 0 && (
              <p style={{ fontSize: "0.8rem", color: "var(--color-gold)", marginTop: "1rem" }}>{galleryUrls.length} image(s) queued for upload upon saving.</p>
            )}
          </div>

          <button type="submit" className={styles.btnGold} style={{ width: "100%" }} disabled={savingProvider} id="save-provider-btn">
            {savingProvider ? "Saving Profile..." : "Save Provider Profile"}
          </button>
        </form>
      )}

    </div>
  );
}

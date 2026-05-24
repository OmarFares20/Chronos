"use client";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Diamond, Eye, EyeOff, User, Briefcase, Plus, X, ArrowLeft, Target } from "lucide-react";

type Role = "customer" | "provider";

const SERVICE_CATEGORIES = [
  { value: "PHOTOGRAPHY",   label: "Photography" },
  { value: "CATERING",      label: "Catering" },
  { value: "DECOR",         label: "Décor" },
  { value: "MUSIC",         label: "Live Music" },
  { value: "PLANNING",      label: "Planning" },
  { value: "VENUE",         label: "Venue" },
  { value: "TRANSPORT",     label: "Transport" },
  { value: "VIDEOGRAPHY",   label: "Videography" },
  { value: "FLORIST",       label: "Florist" },
  { value: "MAKEUP",        label: "Makeup" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "SECURITY",      label: "Security" },
];

export default function RegisterPage() {
  const [role, setRole]                       = useState<Role>("customer");
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  // Customer fields
  const [phone, setPhone]     = useState("");
  const [address, setAddress] = useState("");
  // Provider fields
  const [categories, setCategories] = useState<string[]>([]);
  const [addresses, setAddresses]   = useState<string[]>([]);
  const [addrInput, setAddrInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [commercialRegister, setCommercialRegister] = useState<File | null>(null);
  const [taxCard, setTaxCard]                       = useState<File | null>(null);
  const [idCard, setIdCard]                         = useState<File | null>(null);

  const toggleCategory = (val: string) => {
    setCategories((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  };

  const addAddress = () => {
    const trimmed = addrInput.trim();
    if (trimmed && !addresses.includes(trimmed)) {
      setAddresses((prev) => [...prev, trimmed]);
      setAddrInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (role === "provider") {
      if (categories.length === 0) {
        setError("Please select at least one service category.");
        return;
      }
      if (!commercialRegister || !taxCard || !idCard) {
        setError("Please upload all required legal documents.");
        return;
      }
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role.toUpperCase());
      
      if (role === "customer") {
        if (phone) formData.append("phone", phone);
        if (address) formData.append("address", address);
      } else {
        categories.forEach((cat) => formData.append("categories", cat));
        addresses.forEach((addr) => formData.append("addresses", addr));
        formData.append("commercialRegister", commercialRegister as Blob);
        formData.append("taxCard", taxCard as Blob);
        formData.append("idCard", idCard as Blob);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <Link href="/" className={styles.backLink} id="register-back-home" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <ArrowLeft size={16} /> Back to Chronos
      </Link>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <Image
            src="/chronos-logo.webp"
            alt="Chronos"
            width={70}
            height={70}
            className={styles.logoImg}
            priority
          />
          <h1 className={styles.brandName}>CHRONOS</h1>
          <p className={styles.brandTagline}>Timeless Events</p>
        </div>

        <div className={styles.divider}>
          <span /><Diamond size={14} className={styles.dividerIcon} /><span />
        </div>

        <h2 className={styles.title}>Create Your Account</h2>
        <p className={styles.subtitle}>Join Chronos and start crafting timeless events</p>

        {/* Role selector */}
        <div className={styles.roleSelector} role="group" aria-label="Account type">
          <button
            id="register-role-customer"
            type="button"
            className={`${styles.roleBtn} ${role === "customer" ? styles.roleActive : ""}`}
            onClick={() => setRole("customer")}
          >
            <span className={styles.roleIcon}><User size={20} /></span>
            <span className={styles.roleLabel}>Customer</span>
            <span className={styles.roleDesc}>Plan &amp; book events</span>
          </button>
          <button
            id="register-role-provider"
            type="button"
            className={`${styles.roleBtn} ${role === "provider" ? styles.roleActive : ""}`}
            onClick={() => setRole("provider")}
          >
            <span className={styles.roleIcon}><Briefcase size={20} /></span>
            <span className={styles.roleLabel}>Provider</span>
            <span className={styles.roleDesc}>Offer your services</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error && <div className={styles.errorBanner} role="alert">{error}</div>}

          {/* Name */}
          <div className={styles.fieldGroup}>
            <label htmlFor="register-name" className={styles.label}>
              {role === "provider" ? "Business / Full Name" : "Full Name"}
            </label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder={role === "provider" ? "Your business name" : "Your full name"}
              required
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <label htmlFor="register-email" className={styles.label}>Email Address</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {/* ── Customer-specific fields ── */}
          {role === "customer" && (
            <>
              <p className={styles.sectionHeading} style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={14} /> Contact Details</p>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="register-phone" className={styles.label}>Phone</label>
                  <input
                    id="register-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.input}
                    placeholder="+20 1xx xxx xxxx"
                    autoComplete="tel"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="register-address" className={styles.label}>City / Area</label>
                  <input
                    id="register-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={styles.input}
                    placeholder="e.g. Cairo, Maadi"
                    autoComplete="address-level2"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Provider-specific fields ── */}
          {role === "provider" && (
            <>
              <p className={styles.sectionHeading} style={{ display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={14} /> Service Categories</p>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>What services do you offer?</label>
                <div className={styles.chipsGrid}>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      id={`cat-${cat.value.toLowerCase()}`}
                      className={`${styles.chip} ${categories.includes(cat.value) ? styles.chipActive : ""}`}
                      onClick={() => toggleCategory(cat.value)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className={styles.sectionHeading} style={{ display: "flex", alignItems: "center", gap: 6 }}><Target size={14} /> Service Locations</p>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Areas you serve (optional)</label>
                <div className={styles.addressRow}>
                  <input
                    id="register-addr-input"
                    type="text"
                    value={addrInput}
                    onChange={(e) => setAddrInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAddress(); } }}
                    className={styles.input}
                    placeholder="e.g. Cairo"
                  />
                  <button type="button" className={styles.addBtn} onClick={addAddress} id="register-add-address" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {addresses.length > 0 && (
                  <div className={styles.addressList}>
                    {addresses.map((addr) => (
                      <div key={addr} className={styles.addressTag}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Target size={12} /> {addr}</span>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => setAddresses((prev) => prev.filter((a) => a !== addr))}
                          aria-label={`Remove ${addr}`}
                        ><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className={styles.sectionHeading} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Briefcase size={14} /> Legal Documents
              </p>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Commercial Register *</label>
                  <input
                    type="file"
                    className={styles.input}
                    accept="image/*,.pdf"
                    onChange={(e) => setCommercialRegister(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Tax Card *</label>
                  <input
                    type="file"
                    className={styles.input}
                    accept="image/*,.pdf"
                    onChange={(e) => setTaxCard(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>ID Card (Front & Back) *</label>
                <input
                  type="file"
                  className={styles.input}
                  accept="image/*,.pdf"
                  onChange={(e) => setIdCard(e.target.files?.[0] || null)}
                  required
                />
              </div>
            </>
          )}

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="register-password" className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                id="register-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="register-confirm-password" className={styles.label}>Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="register-confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                id="register-toggle-confirm"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <p className={styles.terms}>
            By creating an account you agree to our{" "}
            <Link href="/terms" className={styles.termsLink} id="register-terms">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className={styles.termsLink} id="register-privacy">Privacy Policy</Link>.
          </p>

          <button id="register-submit" type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : `Create ${role === "provider" ? "Provider" : ""} Account`}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.switchLink} id="register-go-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

"use client";
import styles from "./Navbar.module.css";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";
import { Sparkles, ChevronDown, Briefcase, User, LayoutDashboard, CalendarDays, Settings, MessageSquare, LogOut } from "lucide-react";

const navLinks = [
  { href: "/providers",  label: "Browse Providers" },
  { href: "/#services", label: "Categories" },
  { href: "/match",     label: "Find My Match", icon: <Sparkles size={14} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 6 }} /> },
  { href: "/security",  label: "Trust & Safety" },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);  // account dropdown
  const [mobileOpen, setMobileOpen] = useState(false);  // mobile drawer
  const { user, logout, loading }   = useAuth();
  const menuRef                     = useRef<HTMLDivElement>(null);
  const pathname                    = usePathname();

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
  };

  return (
    <>
      <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} id="nav-logo">
            <span className={styles.logoIcon}>
              <Image
                src="/chronos-logo.webp"
                alt="Chronos logo"
                width={48}
                height={48}
                className={styles.logoImg}
                priority
              />
            </span>
            <span className={styles.logotype}>CHRONOS</span>
          </Link>

          {/* Desktop Links */}
          <nav className={styles.links} aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.link}>
                {link.label}
                {link.icon}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA / Account */}
          <div className={styles.actions}>
            {!loading && (
              user ? (
                <div className={styles.accountWrapper} ref={menuRef}>
                  <button
                    className={styles.accountBtn}
                    onClick={() => setMenuOpen((o) => !o)}
                    id="nav-account-btn"
                    aria-label="Account menu"
                    aria-expanded={menuOpen}
                    aria-controls="nav-account-menu"
                  >
                    <span className={styles.accountAvatar}>
                      {user.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                    <span className={styles.accountName}>{user.name?.split(" ")[0]}</span>
                    <span className={`${styles.accountChevron} ${menuOpen ? styles.accountChevronOpen : ""}`}>
                      <ChevronDown size={14} />
                    </span>
                  </button>

                  {menuOpen && (
                    <div
                      id="nav-account-menu"
                      className={styles.accountMenu}
                      role="menu"
                    >
                      <div className={styles.accountMenuHeader}>
                        <p className={styles.accountMenuName}>{user.name}</p>
                        <p className={styles.accountMenuEmail}>{user.email}</p>
                        <span className={styles.accountMenuRole} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {user.role === "PROVIDER" ? <><Briefcase size={12} /> Provider</> : <><User size={12} /> Customer</>}
                        </span>
                      </div>
                      <div className={styles.accountMenuDivider} />
                      <Link href="/dashboard" className={styles.accountMenuItem} onClick={() => setMenuOpen(false)} id="nav-menu-dashboard" role="menuitem">
                        <LayoutDashboard size={14} /> Dashboard
                      </Link>
                      {user.role !== "PROVIDER" && (
                        <Link href="/planner" className={styles.accountMenuItem} onClick={() => setMenuOpen(false)} id="nav-menu-planner" role="menuitem">
                          <CalendarDays size={14} /> Occasion Planner
                        </Link>
                      )}
                      <Link href="/dashboard/settings" className={styles.accountMenuItem} onClick={() => setMenuOpen(false)} id="nav-menu-settings" role="menuitem">
                        <Settings size={14} /> Account Settings
                      </Link>
                      <Link href="/dashboard/messages" className={styles.accountMenuItem} onClick={() => setMenuOpen(false)} id="nav-menu-messages" role="menuitem">
                        <MessageSquare size={14} /> Messages
                      </Link>
                      <div className={styles.accountMenuDivider} />
                      <button className={`${styles.accountMenuItem} ${styles.accountMenuSignOut}`} onClick={handleLogout} id="nav-menu-logout" role="menuitem">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login"    className={styles.btnGhost} id="nav-login">Sign In</Link>
                  <Link href="/register" className={styles.btnGold}  id="nav-register">Get Started</Link>
                </>
              )
            )}

            {/* Mobile hamburger — always visible on small screens */}
            <button
              className={styles.hamburger}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              id="nav-hamburger"
            >
              <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBar1Open : ""}`} />
              <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBar2Open : ""}`} />
              <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBar3Open : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <nav
        id="mobile-nav"
        className={`${styles.mobileDrawer} ${mobileOpen ? styles.mobileDrawerOpen : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        {/* Drawer header */}
        <div className={styles.mobileHeader}>
          <Image src="/chronos-logo.webp" alt="Chronos" width={36} height={36} className={styles.logoImg} />
          <span className={`${styles.logotype} ${styles.mobileLogotype}`}>CHRONOS</span>
        </div>

        {/* Nav links */}
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
            {link.label} {link.icon && <span style={{ marginLeft: 6 }}>{link.icon}</span>}
          </Link>
        ))}

        <div className={styles.mobileDivider} />

        {/* Auth actions */}
        {!loading && (
          user ? (
            <>
              <div className={styles.mobileUserCard}>
                <span className={styles.mobileUserAvatar}>{user.name?.charAt(0).toUpperCase() || "?"}</span>
                <div>
                  <p className={styles.mobileUserName}>{user.name}</p>
                  <p className={styles.mobileUserRole} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {user.role === "PROVIDER" ? <><Briefcase size={12} /> Provider</> : <><User size={12} /> Customer</>}
                  </p>
                </div>
              </div>
              <Link href="/dashboard"          className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link href="/dashboard/messages" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Messages</Link>
              <Link href="/dashboard/settings" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Account Settings</Link>
              <button className={`${styles.mobileLink} ${styles.mobileLinkDanger}`} onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <div className={styles.mobileAuthBtns}>
              <Link href="/login"    className={styles.mobileBtnGhost} onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link href="/register" className={styles.mobileBtnGold}  onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          )
        )}
      </nav>
    </>
  );
}

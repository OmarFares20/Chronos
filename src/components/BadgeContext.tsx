"use client";
/**
 * BadgeContext — shared live badge counts across the dashboard.
 *
 * Provides:
 *   - unreadMessages: number  (sidebar Messages link badge + bell dot)
 *   - pendingBookings: number (sidebar Bookings link badge)
 *   - totalUnread: number     (sum used by the bell icon)
 *   - refresh(): void         (force an immediate re-fetch — call after marking messages read)
 *
 * Strategy:
 *   1. Initial fetch on mount.
 *   2. Re-fetch whenever the pathname changes (page navigation).
 *   3. Poll every 30 seconds while the tab is visible.
 *   4. Listen for the custom event `chronos:badges-updated` dispatched by
 *      child pages (e.g. messages page) so counts refresh instantly after reads.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

interface BadgeCounts {
  unreadMessages: number;
  pendingBookings: number;
  totalUnread: number;
  refresh: () => void;
}

const BadgeContext = createContext<BadgeCounts>({
  unreadMessages: 0,
  pendingBookings: 0,
  totalUnread: 0,
  refresh: () => {},
});

export function BadgeProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const pathname = usePathname();
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      // Fetch unread message count from the notifications API (lightest query)
      const r = await fetch("/api/notifications");
      if (r.ok) {
        const d = await r.json();
        // Notifications API returns message-type notifications that are unread
        const msgUnread = (d.notifications ?? []).filter(
          (n: { type: string; isRead: boolean }) => n.type === "message" && !n.isRead
        ).length;
        setUnreadMessages(msgUnread);
      }
    } catch { /* silently ignore */ }

    try {
      const r2 = await fetch("/api/bookings");
      if (r2.ok) {
        const d2 = await r2.json();
        const pending = (d2.bookings ?? []).filter(
          (b: { status: string }) => b.status === "PENDING"
        ).length;
        setPendingBookings(pending);
      }
    } catch { /* silently ignore */ }
  }, []);

  // 1. Fetch on mount
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // 2. Re-fetch on every route change
  useEffect(() => { fetchCounts(); }, [pathname, fetchCounts]);

  // 3. Poll every 30 seconds (only when tab is visible)
  useEffect(() => {
    const start = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        if (document.visibilityState === "visible") fetchCounts();
      }, 30_000);
    };
    const stop = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    start();
    document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" ? start() : stop();
    });
    return () => { stop(); };
  }, [fetchCounts]);

  // 4. Listen for custom event dispatched by child pages after marking messages read
  useEffect(() => {
    const handler = () => fetchCounts();
    window.addEventListener("chronos:badges-updated", handler);
    return () => window.removeEventListener("chronos:badges-updated", handler);
  }, [fetchCounts]);

  return (
    <BadgeContext.Provider
      value={{
        unreadMessages,
        pendingBookings,
        totalUnread: unreadMessages + pendingBookings,
        refresh: fetchCounts,
      }}
    >
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadges() {
  return useContext(BadgeContext);
}

/**
 * Call this from any page after marking messages / bookings as read.
 * It dispatches the custom event that BadgeProvider listens to.
 */
export function notifyBadgesUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("chronos:badges-updated"));
  }
}

/**
 * Shared UI utility functions used across Chronos dashboard pages.
 */

// ── Status label humanization ─────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  // Booking statuses
  PENDING:    "Pending Confirmation",
  CONFIRMED:  "Confirmed",
  IN_ESCROW:  "Payment Held (Escrow)",
  RELEASED:   "Completed & Released",
  DECLINED:   "Declined",
  COMPLETED:  "Completed",
  CANCELLED:  "Cancelled",
  REFUNDED:   "Refunded",
  DISPUTED:   "Under Dispute",
  // Event statuses
  DRAFT:      "Draft",
  PLANNING:   "Planning",
  BOOKED:     "Booked",
  // Generic
  ACTIVE:     "Active",
  INACTIVE:   "Inactive",
};

export function humanStatus(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

// ── Status → CSS class name ───────────────────────────────────────────────────

const STATUS_STYLE_MAP: Record<string, string> = {
  PENDING:   "statusPending",
  CONFIRMED: "statusConfirmed",
  IN_ESCROW: "statusEscrow",
  RELEASED:  "statusReleased",
  COMPLETED: "statusConfirmed",
  CANCELLED: "statusDraft",
  REFUNDED:  "statusDraft",
  DISPUTED:  "statusDraft",
  DRAFT:     "statusDraft",
  PLANNING:  "statusPlanning",
};

export function statusClass(status: string): string {
  return STATUS_STYLE_MAP[status] ?? "statusPending";
}

// ── Currency formatting ───────────────────────────────────────────────────────

/**
 * Format a monetary amount.
 * Always uses en-US locale (Western numerals). EGP → "EGP 5,000".
 * Delegates to formatPrice for consistency.
 */
export function formatCurrency(amount: number, _currency = "EGP"): string {
  // Always display as EGP with English numerals and comma separators
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? "-" : "";
  return `${sign}EGP ${formatted}`;
}

// ── Date formatting ───────────────────────────────────────────────────────────

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(date: string | Date): number {
  return Math.max(0, Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 3600 * 24)));
}

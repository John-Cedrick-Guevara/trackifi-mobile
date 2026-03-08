/**
 * Date formatting and computation utilities.
 */

/**
 * Format an ISO date string to a readable date.
 *
 * @example formatDate('2026-03-08T14:30:00.000Z') → "Mar 8, 2026"
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format an ISO date string to a short date (no year).
 *
 * @example formatShortDate('2026-03-08T14:30:00.000Z') → "Mar 8"
 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format relative time string.
 *
 * @example formatRelativeTime('2026-03-08T12:00:00.000Z') → "2h ago"
 */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  return formatDate(iso);
}

/**
 * Get the date label for transaction grouping.
 *
 * @returns "Today", "Yesterday", or formatted date string
 */
export function getDateGroupLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return formatDate(iso);
}

// ---------------------------------------------------------------------------
// Period computations
// ---------------------------------------------------------------------------

/** ISO date string for the start of today (local time) */
export function getStartOfDay(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** ISO date string for the start of the current week (Monday) */
export function getStartOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** ISO date string for the start of the current month */
export function getStartOfMonth(date: Date = new Date()): string {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** ISO string for `monthsAgo` months before the given date */
export function getMonthsAgo(months: number, date: Date = new Date()): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Format a period key from timeseries as a human-readable label */
export function formatPeriodLabel(period: string): string {
  // Monthly: "2026-03" → "Mar 2026"
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
  // Daily/weekly: "2026-03-08" → "Mar 8"
  return formatShortDate(period);
}

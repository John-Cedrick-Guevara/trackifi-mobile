/**
 * Application-wide constants.
 */

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Base URL for the TrackiFi backend API.
 * Change this per environment.
 */
export const API_BASE_URL = __DEV__
  ? "http://localhost:8787"
  : "https://trackifi-api.trackifi.workers.dev";

// ---------------------------------------------------------------------------
// React Query key factory
// ---------------------------------------------------------------------------

export const QueryKeys = {
  // Accounts
  accounts: ["accounts"] as const,
  accountBalance: (id: string) => ["accounts", id, "balance"] as const,

  // Transactions
  transactions: (filters?: Record<string, unknown>) =>
    filters
      ? (["transactions", filters] as const)
      : (["transactions"] as const),

  // Analytics
  todaySummary: ["analytics", "today"] as const,
  recentTransactions: ["analytics", "recent"] as const,
  timeSeries: (params: Record<string, string>) =>
    ["analytics", "timeseries", params] as const,
  categoryBreakdown: (params: Record<string, string>) =>
    ["analytics", "category", params] as const,

  // Goals
  goals: ["goals"] as const,
  goalPrediction: (goalId: string) => ["goals", goalId, "prediction"] as const,

  // Investments
  investments: ["investments"] as const,
  investmentDetail: (id: string) => ["investments", id] as const,
} as const;

// ---------------------------------------------------------------------------
// Default categories
// ---------------------------------------------------------------------------

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Bills & Utilities",
  "Other",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "Allowance",
  "Salary",
  "Savings",
  "Freelance",
  "Gift",
  "Other",
] as const;

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

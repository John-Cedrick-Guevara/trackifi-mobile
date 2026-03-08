/**
 * Analytics response types — mirrors backend docs/api/09-data-models.md §10.7
 */

export interface TodaySummary {
  inflow: number;
  outflow: number;
}

export interface RecentTransaction {
  uuid: string;
  amount: number;
  type: "in" | "out" | "transfer";
  metadata: {
    category_name: string;
    [key: string]: unknown;
  };
  logged_at: string;
}

export interface TimeSeriesEntry {
  /** Format: "YYYY-MM-DD" (daily/weekly) or "YYYY-MM" (monthly) */
  period: string;
  inflow: number;
  outflow: number;
  savings: number;
}

export type TimeView = "daily" | "weekly" | "monthly";

export interface TimeSeriesParams {
  timeView: TimeView;
  startDate: string;
  endDate: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface CategoryParams {
  startDate: string;
  endDate: string;
  type?: "in" | "out";
}

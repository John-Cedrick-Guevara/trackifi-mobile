/**
 * Analytics API service functions.
 * @see docs/api/05-cashflow-analytics.md
 */

import type {
  CategoryBreakdown,
  RecentTransaction,
  TimeSeriesEntry,
  TimeView,
  TodaySummary,
} from "@/types/analytics";
import { apiClient } from "./api-client";

/** Fetch today's inflow/outflow summary. */
export function getTodaySummary(): Promise<TodaySummary> {
  return apiClient.get<TodaySummary>("/api/cashflows/analytics/today");
}

/** Fetch last 20 recent transactions (legacy format). */
export function getRecentTransactions(): Promise<RecentTransaction[]> {
  return apiClient.get<RecentTransaction[]>("/api/cashflows/analytics/recent");
}

/** Fetch time-series analytics (daily/weekly/monthly). */
export function getTimeSeries(
  timeView: TimeView,
  startDate: string,
  endDate: string,
): Promise<TimeSeriesEntry[]> {
  return apiClient.get<TimeSeriesEntry[]>(
    "/api/cashflows/analytics/timeseries",
    { timeView, startDate, endDate },
  );
}

/** Fetch category breakdown for a date range. */
export function getCategoryBreakdown(
  startDate: string,
  endDate: string,
  type?: "in" | "out",
): Promise<CategoryBreakdown[]> {
  const params: Record<string, string> = { startDate, endDate };
  if (type) params.type = type;
  return apiClient.get<CategoryBreakdown[]>(
    "/api/cashflows/analytics/by-category",
    params,
  );
}

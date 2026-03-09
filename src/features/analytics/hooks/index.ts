/**
 * React Query hooks for analytics data.
 */

import { useQuery } from "@tanstack/react-query";

import {
  getCategoryBreakdown,
  getRecentTransactions,
  getTimeSeries,
  getTodaySummary,
} from "@/services/analytics.api";
import type { CategoryParams, TimeSeriesParams } from "@/types/analytics";
import { QueryKeys } from "@/utils/constants";

/** Fetch today's inflow/outflow. staleTime: 30s, refetchInterval: 30s */
export function useTodaySummary() {
  return useQuery({
    queryKey: QueryKeys.todaySummary,
    queryFn: getTodaySummary,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

/** Fetch last 20 recent transactions. staleTime: 2 min */
export function useRecentTransactions() {
  return useQuery({
    queryKey: QueryKeys.recentTransactions,
    queryFn: getRecentTransactions,
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetch time-series data. staleTime: 10 min */
export function useTimeSeries(params: TimeSeriesParams) {
  return useQuery({
    queryKey: QueryKeys.timeSeries(params as unknown as Record<string, string>),
    queryFn: () =>
      getTimeSeries(params.timeView, params.startDate, params.endDate),
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetch category breakdown. staleTime: 10 min */
export function useCategoryBreakdown(params: CategoryParams) {
  return useQuery({
    queryKey: QueryKeys.categoryBreakdown(
      params as unknown as Record<string, string>,
    ),
    queryFn: () =>
      getCategoryBreakdown(params.startDate, params.endDate, params.type),
    staleTime: 10 * 60 * 1000,
  });
}

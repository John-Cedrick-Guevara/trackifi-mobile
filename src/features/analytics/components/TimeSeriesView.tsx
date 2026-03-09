/**
 * Time series analytics view with period selector and chart.
 */

import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { TimeView } from "@/types/analytics";
import { formatCurrency } from "@/utils/currency";

import { useTimeSeries } from "../hooks";
import { PeriodSelector } from "./PeriodSelector";

function getDefaultRange(view: TimeView): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  if (view === "daily") {
    start.setDate(start.getDate() - 14);
  } else if (view === "weekly") {
    start.setDate(start.getDate() - 56); // 8 weeks
  } else {
    start.setMonth(start.getMonth() - 3);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function shiftRange(
  view: TimeView,
  start: Date,
  direction: 1 | -1,
): { start: Date; end: Date } {
  const s = new Date(start);
  const e = new Date(start);
  if (view === "daily") {
    s.setDate(s.getDate() + direction * 14);
    e.setDate(s.getDate() + 14);
  } else if (view === "weekly") {
    s.setDate(s.getDate() + direction * 56);
    e.setDate(s.getDate() + 56);
  } else {
    s.setMonth(s.getMonth() + direction * 3);
    e.setMonth(s.getMonth() + 3);
  }
  return { start: s, end: e };
}

export function TimeSeriesView() {
  const { spacing, radius, colors, shadows } = useThemeContext();
  const [timeView, setTimeView] = useState<TimeView>("monthly");
  const [range, setRange] = useState(() => getDefaultRange("monthly"));

  const handleViewChange = useCallback((view: TimeView) => {
    setTimeView(view);
    setRange(getDefaultRange(view));
  }, []);

  const handlePrev = useCallback(() => {
    setRange((r) => shiftRange(timeView, r.start, -1));
  }, [timeView]);

  const handleNext = useCallback(() => {
    setRange((r) => shiftRange(timeView, r.start, 1));
  }, [timeView]);

  const params = useMemo(
    () => ({
      timeView,
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
    }),
    [timeView, range],
  );

  const { data, isLoading } = useTimeSeries(params);

  const totals = useMemo(() => {
    if (!data) return { inflow: 0, outflow: 0, net: 0 };
    const inflow = data.reduce((s, d) => s + d.inflow, 0);
    const outflow = data.reduce((s, d) => s + d.outflow, 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [data]);

  return (
    <View>
      <PeriodSelector
        timeView={timeView}
        onTimeViewChange={handleViewChange}
        startDate={range.start.toISOString()}
        endDate={range.end.toISOString()}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <View style={{ height: spacing.md }} />

      {isLoading ? (
        <Skeleton height={220} borderRadius={radius.lg} />
      ) : (
        <TimeSeriesChart data={data ?? []} />
      )}

      {/* Summary row */}
      <View
        style={[
          styles.summaryRow,
          {
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
          },
          shadows.sm,
        ]}
      >
        <View style={styles.summaryItem}>
          <Text variant="small" color="textSecondary">
            Inflow
          </Text>
          <Text variant="bodyBold" style={{ color: colors.income }}>
            {formatCurrency(totals.inflow)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text variant="small" color="textSecondary">
            Outflow
          </Text>
          <Text variant="bodyBold" style={{ color: colors.expense }}>
            {formatCurrency(totals.outflow)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text variant="small" color="textSecondary">
            Net
          </Text>
          <Text
            variant="bodyBold"
            style={{
              color: totals.net >= 0 ? colors.income : colors.expense,
            }}
          >
            {formatCurrency(totals.net)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
});

/**
 * Grouped bar chart for time-series analytics.
 * Shows inflow (green), outflow (red), and savings (purple) per period.
 */

import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { TimeSeriesEntry } from "@/types/analytics";
import { formatCompactCurrency } from "@/utils/currency";
import { formatPeriodLabel } from "@/utils/date";

interface TimeSeriesChartProps {
  data: TimeSeriesEntry[];
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const { colors, spacing, radius } = useThemeContext();

  const barData = useMemo(() => {
    const items: {
      value: number;
      frontColor: string;
      label?: string;
      spacing?: number;
    }[] = [];

    for (const entry of data) {
      const label = formatPeriodLabel(entry.period);
      items.push({
        value: entry.inflow,
        frontColor: colors.income,
        label,
        spacing: 2,
      });
      items.push({
        value: entry.outflow,
        frontColor: colors.expense,
        spacing: 2,
      });
      items.push({
        value: entry.savings,
        frontColor: colors.savings,
        spacing: 16,
      });
    }
    return items;
  }, [data, colors]);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { padding: spacing.xl }]}>
        <Text variant="body" color="textSecondary" align="center">
          Not enough data
        </Text>
      </View>
    );
  }

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.inflow, d.outflow, d.savings]),
    1,
  );

  return (
    <View>
      <BarChart
        data={barData}
        barWidth={10}
        spacing={2}
        noOfSections={4}
        maxValue={maxVal * 1.15}
        width={SCREEN_WIDTH - spacing.md * 4}
        height={200}
        yAxisTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 9 }}
        formatYLabel={(val: string) => formatCompactCurrency(Number(val))}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        hideRules
        barBorderRadius={3}
        isAnimated
      />

      {/* Legend */}
      <View style={[styles.legend, { marginTop: spacing.sm }]}>
        <LegendItem color={colors.income} label="Inflow" />
        <LegendItem color={colors.expense} label="Outflow" />
        <LegendItem color={colors.savings} label="Savings" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const { spacing } = useThemeContext();
  return (
    <View style={[styles.legendItem, { marginRight: spacing.md }]}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
});

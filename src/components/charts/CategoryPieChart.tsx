/**
 * Donut/ring chart for category breakdown.
 */

import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { CategoryBreakdown } from "@/types/analytics";
import { formatCurrency } from "@/utils/currency";

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
}

const PALETTE = [
  "#6366F1", // indigo
  "#22C55E", // green
  "#EF4444", // red
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#64748B", // slate
];

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { colors, spacing, radius } = useThemeContext();
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.amount, 0),
    [data],
  );

  const pieData = useMemo(
    () =>
      data.map((d, i) => ({
        value: d.amount,
        color: PALETTE[i % PALETTE.length],
        text: d.category,
        focused: focusedIndex === i,
        onPress: () => setFocusedIndex(i === focusedIndex ? -1 : i),
      })),
    [data, focusedIndex],
  );

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { padding: spacing.xl }]}>
        <Text variant="body" color="textSecondary" align="center">
          Not enough data
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.chartWrap}>
        <PieChart
          data={pieData}
          donut
          radius={90}
          innerRadius={55}
          innerCircleColor={colors.surfaceElevated}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text variant="caption" color="textSecondary">
                Total
              </Text>
              <Text variant="bodyBold">{formatCurrency(total)}</Text>
            </View>
          )}
          focusOnPress
          isAnimated
        />
      </View>

      {/* Legend list */}
      <View style={{ marginTop: spacing.md }}>
        {data.map((d, i) => (
          <View
            key={d.category}
            style={[styles.legendRow, { marginBottom: spacing.sm }]}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: PALETTE[i % PALETTE.length] },
              ]}
            />
            <Text
              variant="body"
              style={styles.legendCategory}
              numberOfLines={1}
            >
              {d.category}
            </Text>
            <Text variant="bodyBold">{formatCurrency(d.amount)}</Text>
            <View
              style={[
                styles.percentBar,
                {
                  backgroundColor: `${PALETTE[i % PALETTE.length]}30`,
                  marginLeft: spacing.sm,
                },
              ]}
            >
              <View
                style={[
                  styles.percentFill,
                  {
                    backgroundColor: PALETTE[i % PALETTE.length],
                    width: `${d.percentage}%`,
                  },
                ]}
              />
            </View>
            <Text
              variant="small"
              color="textTertiary"
              style={{ width: 40, textAlign: "right" }}
            >
              {d.percentage.toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
  },
  chartWrap: {
    alignItems: "center",
  },
  centerLabel: {
    alignItems: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendCategory: {
    flex: 1,
    marginRight: 8,
  },
  percentBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  percentFill: {
    height: "100%",
    borderRadius: 3,
  },
});

/**
 * Line chart showing investment value over time.
 */

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { InvestmentValueHistory } from "@/types/investments";
import { formatCompactCurrency } from "@/utils/currency";
import { formatShortDate } from "@/utils/date";

interface ValueHistoryChartProps {
  history: InvestmentValueHistory[];
  principal: number;
}

export function ValueHistoryChart({
  history,
  principal,
}: ValueHistoryChartProps) {
  const { colors, spacing, radius } = useThemeContext();

  const chartData = useMemo(() => {
    if (history.length === 0) return [];
    return history.map((h) => ({
      value: h.value,
      label: formatShortDate(h.recorded_at),
      dataPointText: formatCompactCurrency(h.value),
    }));
  }, [history]);

  if (chartData.length < 2) {
    return (
      <View
        style={[
          styles.empty,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.lg,
          },
        ]}
      >
        <Text variant="body" color="textSecondary" align="center">
          Need at least 2 value entries to show chart
        </Text>
      </View>
    );
  }

  const maxVal = Math.max(...chartData.map((d) => d.value), principal);

  return (
    <View>
      <LineChart
        data={chartData}
        width={280}
        height={200}
        color={colors.accent}
        thickness={2}
        dataPointsColor={colors.accent}
        textColor={colors.textSecondary}
        textFontSize={10}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        hideRules
        showReferenceLine1
        referenceLine1Position={principal}
        referenceLine1Config={{
          color: colors.warning,
          dashWidth: 6,
          dashGap: 4,
          thickness: 1,
        }}
        maxValue={maxVal * 1.1}
        noOfSections={4}
        formatYLabel={(val: string) => formatCompactCurrency(Number(val))}
        curved
        isAnimated
        animationDuration={600}
      />
      {/* Legend */}
      <View style={[styles.legend, { marginTop: spacing.sm }]}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.accent }]}
          />
          <Text variant="small" color="textSecondary">
            Value
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendLine,
              { borderColor: colors.warning, borderStyle: "dashed" },
            ]}
          />
          <Text variant="small" color="textSecondary">
            Principal
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 0,
    borderWidth: 1,
  },
});

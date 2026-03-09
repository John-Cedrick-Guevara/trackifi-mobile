/**
 * Today summary card — shows inflow vs outflow with net below.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { TodaySummary } from "@/types/analytics";
import { formatCurrency } from "@/utils/currency";

interface TodaySummaryCardProps {
  summary: TodaySummary;
}

export function TodaySummaryCard({ summary }: TodaySummaryCardProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();

  const net = summary.inflow - summary.outflow;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        shadows.sm,
      ]}
    >
      <Text variant="caption" color="textSecondary">
        Today
      </Text>

      <View style={[styles.columns, { marginTop: spacing.sm }]}>
        <View style={styles.column}>
          <Text variant="small" color="textSecondary">
            Inflow
          </Text>
          <Text variant="bodyBold" style={{ color: colors.income }}>
            {formatCurrency(summary.inflow)}
          </Text>
        </View>

        <View style={styles.column}>
          <Text variant="small" color="textSecondary">
            Outflow
          </Text>
          <Text variant="bodyBold" style={{ color: colors.expense }}>
            {formatCurrency(summary.outflow)}
          </Text>
        </View>
      </View>

      <View style={[styles.netRow, { marginTop: spacing.sm }]}>
        <Text variant="caption" color="textSecondary">
          Net
        </Text>
        <Text
          variant="bodyBold"
          style={{ color: net >= 0 ? colors.income : colors.expense }}
        >
          {formatCurrency(net)}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  columns: {
    flexDirection: "row",
  },
  column: {
    flex: 1,
  },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

/**
 * Goal progress card with animated progress bar.
 */

import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { Goal, GoalStatus } from "@/types/goals";
import { formatCurrency } from "@/utils/currency";

interface GoalProgressCardProps {
  goal: Goal;
  currentSavings: number;
  onPress?: () => void;
}

const STATUS_BADGE: Record<
  GoalStatus,
  { label: string; variant: "income" | "neutral" | "expense" }
> = {
  active: { label: "Active", variant: "income" },
  completed: { label: "Completed", variant: "income" },
  cancelled: { label: "Cancelled", variant: "expense" },
};

function getProgressColor(pct: number): string {
  if (pct > 0.66) return "#22C55E";
  if (pct > 0.33) return "#F59E0B";
  return "#EF4444";
}

export function GoalProgressCard({
  goal,
  currentSavings,
  onPress,
}: GoalProgressCardProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();

  const pct = goal.amount > 0 ? Math.min(currentSavings / goal.amount, 1) : 0;
  const progressColor = getProgressColor(pct);
  const pctLabel = `${Math.round(pct * 100)}% reached`;

  const barWidth = useSharedValue(0);
  useEffect(() => {
    barWidth.value = withTiming(pct, { duration: 800 });
  }, [pct, barWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
    backgroundColor: progressColor,
  }));

  const status = (goal.status ?? "active") as GoalStatus;
  const sb = STATUS_BADGE[status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
          opacity: pressed ? 0.9 : 1,
        },
        shadows.sm,
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
          {goal.name}
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          <Badge variant={goal.type === "saving" ? "savings" : "warning"}>
            {goal.type === "saving" ? "Saving" : "Spending"}
          </Badge>
          <Badge variant={sb.variant}>{sb.label}</Badge>
        </View>
      </View>

      {/* Target amount */}
      <Text variant="bodyBold" style={{ marginTop: spacing.sm }}>
        {formatCurrency(goal.amount)}
      </Text>

      {/* Progress bar */}
      <View
        style={[
          styles.barTrack,
          {
            backgroundColor: colors.border,
            borderRadius: radius.full,
            marginTop: spacing.sm,
          },
        ]}
      >
        <Animated.View
          style={[styles.barFill, { borderRadius: radius.full }, barStyle]}
        />
      </View>

      {/* Percentage label */}
      <Text
        variant="small"
        color="textSecondary"
        style={{ marginTop: spacing.xs }}
      >
        {pctLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barTrack: {
    height: 8,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
  },
});

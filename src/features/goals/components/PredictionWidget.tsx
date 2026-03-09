/**
 * AI prediction insight widget for a goal.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/feedback/Skeleton";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { PredictionResponse } from "@/types/goals";
import { formatDate } from "@/utils/date";

interface PredictionWidgetProps {
  prediction: PredictionResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRefresh: () => void;
}

export function PredictionWidget({
  prediction,
  isLoading,
  isError,
  errorMessage,
  onRefresh,
}: PredictionWidgetProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();

  if (isLoading) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.md,
            borderLeftWidth: 3,
            borderLeftColor: colors.accent,
          },
          shadows.sm,
        ]}
      >
        <Skeleton width="60%" height={24} />
        <View style={{ height: spacing.sm }} />
        <Skeleton width="80%" height={16} />
        <View style={{ height: spacing.xs }} />
        <Skeleton width="40%" height={14} />
      </View>
    );
  }

  // Determine display state
  let icon = "🎯";
  let headline = "";
  let detail = "";
  let subtext = "";

  if (isError) {
    // Parse common backend error messages
    const msg = errorMessage ?? "";
    if (msg.includes("Not enough data")) {
      icon = "📊";
      headline = "Need more data";
      detail = "Add at least 4 transactions so we can forecast your progress.";
    } else if (msg.includes("unreachable")) {
      icon = "⚠️";
      headline = "Goal may not be reachable";
      detail =
        "Based on current spending habits, consider adjusting your target or timeline.";
    } else {
      icon = "⚠️";
      headline = "Prediction unavailable";
      detail = "We couldn't generate a forecast right now. Try again later.";
    }
  } else if (
    prediction?.success &&
    prediction.prediction === "Goal already reached"
  ) {
    icon = "🎉";
    headline = "Goal already reached!";
    detail = "Congratulations — you've hit your target.";
  } else if (prediction) {
    const months = prediction.monthsNeeded ?? 0;
    headline = `${months} month${months === 1 ? "" : "s"} to go`;
    if (prediction.estimatedCompletionDate) {
      subtext = `Estimated: ${formatDate(prediction.estimatedCompletionDate)}`;
    }
    detail = prediction.prediction;
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
        },
        shadows.sm,
      ]}
    >
      <View style={styles.headerRow}>
        <Text variant="headline">
          {icon} {headline}
        </Text>
        <Pressable
          onPress={onRefresh}
          hitSlop={12}
          style={[
            styles.refreshBtn,
            { backgroundColor: `${colors.accent}20`, borderRadius: radius.sm },
          ]}
        >
          <Text variant="small" style={{ color: colors.accent }}>
            Refresh
          </Text>
        </Pressable>
      </View>

      {subtext ? (
        <Text
          variant="bodyBold"
          style={{ color: colors.accent, marginTop: spacing.xs }}
        >
          {subtext}
        </Text>
      ) : null}

      <Text
        variant="body"
        color="textSecondary"
        style={{ marginTop: spacing.sm }}
      >
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

/**
 * AI prediction insight widget for a goal.
 *
 * Updated for the new `PredictionResult` shape from docs/api/06-goals.md.
 * Error cases are returned as 400 responses — the hook puts them in
 * `isError` / `error`, not inside the data payload.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/feedback/Skeleton";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import type { PredictionResult } from "@/types/goals";
import { formatDate } from "@/utils/date";

interface PredictionWidgetProps {
  prediction: PredictionResult | undefined;
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
    // Parse common backend error messages (returned as 400)
    const msg = errorMessage ?? "";
    if (msg.includes("Not enough contribution data")) {
      icon = "📊";
      headline = "Need more data";
      detail =
        "Add more contributions so we can forecast your progress.";
    } else if (msg.includes("already reached")) {
      icon = "🎉";
      headline = "Goal already reached!";
      detail = "Congratulations — you've hit your target.";
    } else if (msg.includes("unreachable")) {
      icon = "⚠️";
      headline = "Goal may not be reachable";
      detail =
        "Based on current contribution trends, consider adjusting your target or timeline.";
    } else if (msg.includes("10 years")) {
      icon = "⏳";
      headline = "Very long timeline";
      detail =
        "At the current pace this goal would take over 10 years. Try increasing your contributions.";
    } else {
      icon = "⚠️";
      headline = "Prediction unavailable";
      detail = "We couldn't generate a forecast right now. Try again later.";
    }
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

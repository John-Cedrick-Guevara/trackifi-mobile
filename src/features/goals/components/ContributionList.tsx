/**
 * List of goal contributions with swipe-to-delete.
 *
 * @see docs/api/06-goals.md §6.6 — Contribution list items
 */

import React, { useCallback } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/feedback/Skeleton";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import type { GoalContribution } from "@/types/goals";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { haptic } from "@/utils/haptics";

import { useContributions, useDeleteContribution } from "../hooks";

interface ContributionListProps {
  goalId: string;
}

export function ContributionList({ goalId }: ContributionListProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();
  const toast = useToast();
  const contributions = useContributions(goalId);
  const deleteContribution = useDeleteContribution();

  const handleDelete = useCallback(
    (contribution: GoalContribution) => {
      Alert.alert(
        "Remove Contribution",
        `Remove ${formatCurrency(contribution.amount)} contribution?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await haptic("medium");
                await deleteContribution.mutateAsync({
                  goalId,
                  contributionId: contribution.uuid,
                });
                toast.success("Contribution removed.");
              } catch {
                toast.error("Failed to remove contribution.");
              }
            },
          },
        ],
      );
    },
    [goalId, deleteContribution, toast],
  );

  if (contributions.isLoading) {
    return (
      <View>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            height={56}
            style={{ marginBottom: spacing.sm }}
          />
        ))}
      </View>
    );
  }

  const items = contributions.data ?? [];

  if (items.length === 0) {
    return (
      <View
        style={[
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.lg,
            alignItems: "center",
          },
          shadows.sm,
        ]}
      >
        <Text variant="body" color="textSecondary">
          No contributions yet
        </Text>
        <Text
          variant="small"
          color="textSecondary"
          style={{ marginTop: spacing.xs }}
        >
          Allocate transactions to track progress toward this goal.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text variant="bodyBold" style={{ marginBottom: spacing.sm }}>
        Contributions ({items.length})
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.uuid}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View
            style={[
              styles.row,
              {
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.md,
                padding: spacing.sm,
                marginBottom: spacing.xs,
              },
              shadows.sm,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="bodyBold">{formatCurrency(item.amount)}</Text>
              <Text variant="small" color="textSecondary">
                {formatDate(item.contributed_at)}
              </Text>
            </View>
            <Pressable
              onPress={() => handleDelete(item)}
              hitSlop={8}
              style={[
                styles.deleteBtn,
                {
                  backgroundColor: `${colors.expense}15`,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text variant="small" style={{ color: colors.expense }}>
                Remove
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

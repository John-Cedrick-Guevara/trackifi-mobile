/**
 * Goal detail page with prediction, contributions, and actions.
 *
 * Per docs/api/06-goals.md §6.8:
 * - On goal tap: fetch contributions and prediction in parallel
 * - Display prediction with fallback on 400
 * - Support adding/removing contributions
 */

import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { QueryError } from "@/components/feedback/QueryError";
import { Skeleton } from "@/components/feedback/Skeleton";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import {
  AddContributionSheet,
  ContributionList,
  GoalForm,
  GoalProgressCard,
  PredictionWidget,
} from "@/features/goals/components";
import {
  useDeleteGoal,
  useGoal,
  useGoalPrediction,
} from "@/features/goals/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import { QueryKeys } from "@/utils/constants";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { haptic } from "@/utils/haptics";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { spacing, colors, radius, shadows } = useThemeContext();
  const qc = useQueryClient();
  const toast = useToast();

  const [showEdit, setShowEdit] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);

  // Fetch goal detail, prediction, and contributions in parallel (hooks fire together)
  const goalQuery = useGoal(id);
  const prediction = useGoalPrediction(id);
  const deleteGoal = useDeleteGoal();

  const goal = goalQuery.data;

  const handleRefreshPrediction = useCallback(() => {
    qc.invalidateQueries({ queryKey: QueryKeys.goalPrediction(id!) });
  }, [qc, id]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await haptic("heavy");
          await deleteGoal.mutateAsync(id!);
          toast.success("Goal deleted.");
          router.back();
        },
      },
    ]);
  }, [deleteGoal, id, router, toast]);

  if (goalQuery.isLoading) {
    return (
      <PageLayout>
        <Skeleton height={140} style={{ marginBottom: spacing.md }} />
        <Skeleton height={120} style={{ marginBottom: spacing.md }} />
        <Skeleton height={80} />
      </PageLayout>
    );
  }

  if (goalQuery.isError || !goal) {
    return (
      <PageLayout>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          style={{ alignSelf: "flex-start", marginBottom: spacing.sm }}
        >
          ← Back
        </Button>
        <QueryError
          error={goalQuery.error}
          onRetry={() => goalQuery.refetch()}
        />
      </PageLayout>
    );
  }

  const errorMsg =
    prediction.error && typeof prediction.error === "object"
      ? (prediction.error as { message?: string }).message
      : undefined;

  const remaining = Math.max(goal.target_amount - (goal.current_amount ?? 0), 0);

  return (
    <PageLayout>
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onPress={() => router.back()}
        style={{ alignSelf: "flex-start", marginBottom: spacing.sm }}
      >
        ← Back
      </Button>

      {/* Progress card */}
      <GoalProgressCard goal={goal} prediction={prediction.data} />

      <View style={{ height: spacing.lg }} />

      {/* AI Prediction */}
      <PredictionWidget
        prediction={prediction.data}
        isLoading={prediction.isLoading}
        isError={prediction.isError}
        errorMessage={errorMsg}
        onRefresh={handleRefreshPrediction}
      />

      <View style={{ height: spacing.lg }} />

      {/* Goal info */}
      <View
        style={[
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.md,
          },
          shadows.sm,
        ]}
      >
        <Text variant="bodyBold" style={{ marginBottom: spacing.sm }}>
          Details
        </Text>
        {goal.description ? (
          <Text
            variant="body"
            color="textSecondary"
            style={{ marginBottom: spacing.sm }}
          >
            {goal.description}
          </Text>
        ) : null}
        <Text variant="caption" color="textSecondary">
          Target: {formatCurrency(goal.target_amount)}
        </Text>
        <Text variant="caption" color="textSecondary">
          Remaining: {formatCurrency(remaining)}
        </Text>
        <Text variant="caption" color="textSecondary">
          Start: {formatDate(goal.start_date)}
        </Text>
        {goal.end_date ? (
          <Text variant="caption" color="textSecondary">
            Target date: {formatDate(goal.end_date)}
          </Text>
        ) : null}
        <Text variant="caption" color="textSecondary">
          Type: {goal.type === "saving" ? "Saving" : "Spending"}
        </Text>
      </View>

      <View style={{ height: spacing.lg }} />

      {/* Contributions section */}
      <ContributionList goalId={goal.uuid} />

      <View style={{ height: spacing.md }} />

      <Button
        variant="secondary"
        onPress={() => setShowAddContribution(true)}
      >
        + Add Contribution
      </Button>

      <View style={{ height: spacing.lg }} />

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="secondary"
          onPress={() => setShowEdit(true)}
          style={{ flex: 1 }}
        >
          Edit
        </Button>
        <View style={{ width: spacing.sm }} />
        <Button
          variant="destructive"
          onPress={handleDelete}
          loading={deleteGoal.isPending}
          style={{ flex: 1 }}
        >
          Delete
        </Button>
      </View>

      <View style={{ height: spacing.xl }} />

      {/* Edit sheet */}
      <BottomSheet visible={showEdit} onClose={() => setShowEdit(false)}>
        <GoalForm editGoal={goal} onSuccess={() => setShowEdit(false)} />
      </BottomSheet>

      {/* Add contribution sheet */}
      <BottomSheet
        visible={showAddContribution}
        onClose={() => setShowAddContribution(false)}
      >
        <AddContributionSheet
          goal={goal}
          onSuccess={() => setShowAddContribution(false)}
        />
      </BottomSheet>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
  },
});

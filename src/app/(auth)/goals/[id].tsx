/**
 * Goal detail page with prediction and actions.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/feedback/Skeleton";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useAccounts } from "@/features/accounts/hooks";
import {
  GoalForm,
  GoalProgressCard,
  PredictionWidget,
} from "@/features/goals/components";
import {
  useDeleteGoal,
  useGoalPrediction,
  useGoals,
} from "@/features/goals/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import { QueryKeys } from "@/utils/constants";
import { formatDate } from "@/utils/date";
import { haptic } from "@/utils/haptics";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { spacing, colors, radius, shadows } = useThemeContext();
  const qc = useQueryClient();
  const toast = useToast();

  const [showEdit, setShowEdit] = useState(false);

  const goals = useGoals();
  const accounts = useAccounts();
  const deleteGoal = useDeleteGoal();

  const goal = useMemo(
    () => goals.data?.find((g) => g.uuid === id),
    [goals.data, id],
  );

  const currentSavings = useMemo(() => {
    if (!accounts.data) return 0;
    return accounts.data
      .filter((a) => a.type === "savings")
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts.data]);

  const prediction = useGoalPrediction(id);

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

  if (goals.isLoading || !goal) {
    return (
      <PageLayout>
        <Skeleton height={140} style={{ marginBottom: spacing.md }} />
        <Skeleton height={120} style={{ marginBottom: spacing.md }} />
        <Skeleton height={80} />
      </PageLayout>
    );
  }

  const errorMsg =
    prediction.error && typeof prediction.error === "object"
      ? (prediction.error as { message?: string }).message
      : undefined;

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
      <GoalProgressCard goal={goal} currentSavings={currentSavings} />

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
          Start: {formatDate(goal.start_date)}
        </Text>
        <Text variant="caption" color="textSecondary">
          End: {formatDate(goal.end_date)}
        </Text>
        <Text variant="caption" color="textSecondary">
          Type: {goal.type === "saving" ? "Saving" : "Spending"}
        </Text>
      </View>

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

      <BottomSheet visible={showEdit} onClose={() => setShowEdit(false)}>
        <GoalForm editGoal={goal} onSuccess={() => setShowEdit(false)} />
      </BottomSheet>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
  },
});

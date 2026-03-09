/**
 * Goal creation/edit form rendered in a BottomSheet.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import type { Goal } from "@/types/goals";
import { haptic } from "@/utils/haptics";

import { useAuthStore } from "@/features/auth/store";
import { useCreateGoal, useUpdateGoal } from "../hooks";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
  type: z.enum(["saving", "spending"]),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
});

type GoalFormValues = z.infer<typeof goalSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GoalFormProps {
  onSuccess: () => void;
  /** Pass an existing goal to switch to edit mode */
  editGoal?: Goal;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoalForm({ onSuccess, editGoal }: GoalFormProps) {
  const { colors, spacing, radius } = useThemeContext();
  const toast = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isEdit = !!editGoal;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<any>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: editGoal?.name ?? "",
      amount: editGoal?.amount ?? ("" as unknown as number),
      description: editGoal?.description ?? "",
      type: editGoal?.type ?? "saving",
      start_date: editGoal?.start_date ?? new Date().toISOString().slice(0, 10),
      end_date: editGoal?.end_date ?? "",
    },
  });

  const goalType = watch("type");
  const isPending = createGoal.isPending || updateGoal.isPending;

  const onSubmit = useCallback(
    async (data: GoalFormValues) => {
      try {
        if (isEdit) {
          await updateGoal.mutateAsync({
            uuid: editGoal!.uuid,
            user_id: userId!,
            ...data,
          });
        } else {
          await createGoal.mutateAsync({
            user_id: userId!,
            ...data,
            description: data.description ?? "",
          });
        }
        await haptic("medium");
        toast.success(isEdit ? "Goal updated!" : "Goal created!");
        onSuccess();
      } catch {
        toast.error("Failed to save goal. Try again.");
      }
    },
    [isEdit, editGoal, userId, createGoal, updateGoal, onSuccess],
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Type toggle */}
      <View style={{ marginBottom: spacing.md }}>
        <Text
          variant="caption"
          color="textSecondary"
          style={{ marginBottom: spacing.xs }}
        >
          Goal Type
        </Text>
        <View style={[styles.segment, { gap: spacing.xs }]}>
          {(["saving", "spending"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setValue("type", t)}
              style={[
                styles.segmentItem,
                {
                  backgroundColor:
                    goalType === t ? colors.accent : colors.surface,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color: goalType === t ? colors.white : colors.textSecondary,
                }}
              >
                {t === "saving" ? "Saving" : "Spending"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Name */}
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Fund"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message as string | undefined}
          />
        )}
      />
      <View style={{ height: spacing.md }} />

      {/* Amount */}
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Target Amount"
            placeholder="0.00"
            keyboardType="numeric"
            value={value ? String(value) : ""}
            onChangeText={onChange}
            error={errors.amount?.message as string | undefined}
            style={{ fontSize: 28, fontWeight: "700" }}
          />
        )}
      />
      <View style={{ height: spacing.md }} />

      {/* Description */}
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Description (optional)"
            placeholder="What's this goal for?"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <View style={{ height: spacing.md }} />

      {/* Start date */}
      <Controller
        control={control}
        name="start_date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Start Date"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
            error={errors.start_date?.message as string | undefined}
          />
        )}
      />
      <View style={{ height: spacing.md }} />

      {/* End date */}
      <Controller
        control={control}
        name="end_date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="End Date"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
            error={errors.end_date?.message as string | undefined}
          />
        )}
      />
      <View style={{ height: spacing.lg }} />

      {/* Submit */}
      <Button
        variant="primary"
        onPress={handleSubmit(onSubmit as any)}
        loading={isPending}
      >
        {isEdit ? "Update Goal" : "Create Goal"}
      </Button>
      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
});

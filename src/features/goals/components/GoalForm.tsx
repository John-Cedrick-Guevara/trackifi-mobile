/**
 * Goal creation/edit form rendered in a BottomSheet.
 *
 * Uses REST API payloads from docs/api/06-goals.md:
 * - `source_account_id` is required (account picker)
 * - `target_amount` (not `amount`)
 * - Server derives `user_id` from the auth token
 */

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useAccounts } from "@/features/accounts/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import type { GoalWithProgress } from "@/types/goals";
import { haptic } from "@/utils/haptics";

import { useCreateGoal, useUpdateGoal } from "../hooks";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const goalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  target_amount: z.coerce.number().positive("Target amount must be positive"),
  source_account_id: z.string().min(1, "Please select an account"),
  description: z.string().max(500).optional(),
  type: z.enum(["saving", "spending"]),
  end_date: z.string().optional(),
});

/** Explicit form values type avoids z.coerce inference issues with zodResolver */
interface GoalFormValues {
  name: string;
  target_amount: number;
  source_account_id: string;
  description?: string;
  type: "saving" | "spending";
  end_date?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GoalFormProps {
  onSuccess: () => void;
  /** Pass an existing goal to switch to edit mode */
  editGoal?: GoalWithProgress;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoalForm({ onSuccess, editGoal }: GoalFormProps) {
  const { colors, spacing, radius } = useThemeContext();
  const toast = useToast();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const accounts = useAccounts();
  const isEdit = !!editGoal;

  const accountOptions = useMemo(
    () => accounts.data ?? [],
    [accounts.data],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as any,
    defaultValues: {
      name: editGoal?.name ?? "",
      target_amount: editGoal?.target_amount ?? ("" as unknown as number),
      source_account_id: editGoal?.source_account_id ?? "",
      description: editGoal?.description ?? "",
      type: editGoal?.type ?? "saving",
      end_date: editGoal?.end_date ?? "",
    },
  });

  const goalType = watch("type");
  const selectedAccountId = watch("source_account_id");
  const isPending = createGoal.isPending || updateGoal.isPending;

  const onSubmit = useCallback(
    async (data: GoalFormValues) => {
      try {
        // Strip empty optional fields
        const cleanPayload = {
          ...data,
          description: data.description || undefined,
          end_date: data.end_date || undefined,
        };

        if (isEdit) {
          await updateGoal.mutateAsync({
            id: editGoal!.uuid,
            payload: cleanPayload,
          });
        } else {
          await createGoal.mutateAsync(cleanPayload);
        }
        await haptic("medium");
        toast.success(isEdit ? "Goal updated!" : "Goal created!");
        onSuccess();
      } catch {
        toast.error("Failed to save goal. Try again.");
      }
    },
    [isEdit, editGoal, createGoal, updateGoal, onSuccess, toast],
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

      {/* Target Amount */}
      <Controller
        control={control}
        name="target_amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Target Amount"
            placeholder="0.00"
            keyboardType="numeric"
            value={value ? String(value) : ""}
            onChangeText={onChange}
            error={errors.target_amount?.message as string | undefined}
            style={{ fontSize: 28, fontWeight: "700" }}
          />
        )}
      />
      <View style={{ height: spacing.md }} />

      {/* Source Account */}
      <View style={{ marginBottom: spacing.md }}>
        <Text
          variant="caption"
          color="textSecondary"
          style={{ marginBottom: spacing.xs }}
        >
          Source Account
        </Text>
        {accountOptions.length === 0 ? (
          <Text variant="small" color="textSecondary">
            No accounts found. Create an account first.
          </Text>
        ) : (
          <View style={[styles.segment, { gap: spacing.xs, flexWrap: "wrap" }]}>
            {accountOptions.map((acc) => (
              <Pressable
                key={acc.id}
                onPress={() => setValue("source_account_id", acc.id)}
                style={[
                  styles.accountChip,
                  {
                    backgroundColor:
                      selectedAccountId === acc.id
                        ? colors.accent
                        : colors.surface,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor:
                      selectedAccountId === acc.id
                        ? colors.accent
                        : colors.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color:
                      selectedAccountId === acc.id
                        ? colors.white
                        : colors.textSecondary,
                  }}
                >
                  {acc.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.source_account_id?.message ? (
          <Text variant="small" style={{ color: colors.expense, marginTop: 4 }}>
            {errors.source_account_id.message as string}
          </Text>
        ) : null}
      </View>

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

      {/* End date */}
      <Controller
        control={control}
        name="end_date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Target Date (optional)"
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
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});

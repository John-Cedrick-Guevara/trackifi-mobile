/**
 * Bottom sheet form for adding a contribution to a goal.
 *
 * Per docs/api/06-goals.md §6.8:
 * - Fetches transactions for the goal's `source_account_id`
 * - Excludes transaction IDs already in the contributions list
 * - Lets user pick a transaction and enter an amount
 * - Displays API error messages directly (especially over-allocation)
 */

import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useFlatTransactions } from "@/features/transactions/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import type { GoalWithProgress } from "@/types/goals";
import type { Transaction } from "@/types/transactions";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { getErrorMessage } from "@/types/api";
import { haptic } from "@/utils/haptics";

import { useContributions, useCreateContribution } from "../hooks";

interface AddContributionSheetProps {
  goal: GoalWithProgress;
  onSuccess: () => void;
}

export function AddContributionSheet({
  goal,
  onSuccess,
}: AddContributionSheetProps) {
  const { colors, spacing, radius, shadows } = useThemeContext();
  const toast = useToast();
  const createContribution = useCreateContribution();
  const contributions = useContributions(goal.uuid);

  // Fetch transactions for the goal's source account
  const transactions = useFlatTransactions({
    account_id: goal.source_account_id,
  });

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  // Filter out already-contributed transactions
  const availableTx = useMemo(() => {
    if (!transactions.data || !contributions.data) return [];
    const usedIds = new Set(contributions.data.map((c) => c.transaction_id));
    return transactions.data.filter((tx) => !usedIds.has(tx.id));
  }, [transactions.data, contributions.data]);

  const handleSubmit = useCallback(async () => {
    if (!selectedTx) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setApiError("Amount must be greater than 0");
      return;
    }

    setApiError(null);
    try {
      await createContribution.mutateAsync({
        goalId: goal.uuid,
        payload: {
          transaction_id: selectedTx.id,
          amount: numAmount,
        },
      });
      await haptic("medium");
      toast.success("Contribution added!");
      onSuccess();
    } catch (err: any) {
      // Display the server error message directly (important for over-allocation)
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? err.message
          : typeof err === "object" && "type" in err
            ? getErrorMessage(err)
            : "Failed to add contribution.";
      setApiError(msg);
    }
  }, [selectedTx, amount, goal.uuid, createContribution, onSuccess, toast]);

  return (
    <View style={{ flex: 1 }}>
      <Text variant="title" style={{ marginBottom: spacing.md }}>
        Add Contribution
      </Text>

      {/* Transaction picker */}
      <Text
        variant="caption"
        color="textSecondary"
        style={{ marginBottom: spacing.xs }}
      >
        Select Transaction
      </Text>

      {availableTx.length === 0 ? (
        <View
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text variant="small" color="textSecondary">
            {transactions.isLoading || contributions.isLoading
              ? "Loading transactions…"
              : "No eligible transactions available."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableTx}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 200, marginBottom: spacing.md }}
          renderItem={({ item }) => {
            const isSelected = selectedTx?.id === item.id;
            return (
              <Pressable
                onPress={() => setSelectedTx(item)}
                style={[
                  styles.txRow,
                  {
                    backgroundColor: isSelected
                      ? `${colors.accent}15`
                      : colors.surface,
                    borderRadius: radius.md,
                    padding: spacing.sm,
                    marginBottom: spacing.xs,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold">
                    {formatCurrency(item.amount)}
                  </Text>
                  <Text variant="small" color="textSecondary">
                    {item.description || item.category || item.transaction_type}{" "}
                    · {formatDate(item.date)}
                  </Text>
                </View>
                {isSelected && (
                  <Text variant="small" style={{ color: colors.accent }}>
                    ✓
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {/* Amount input */}
      {selectedTx && (
        <>
          <Input
            label={`Amount (max ${formatCurrency(selectedTx.amount)})`}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={(val) => {
              setAmount(val);
              setApiError(null);
            }}
            style={{ fontSize: 24, fontWeight: "700" }}
          />
          <View style={{ height: spacing.md }} />
        </>
      )}

      {/* API error message */}
      {apiError && (
        <View
          style={[
            {
              backgroundColor: `${colors.expense}15`,
              borderRadius: radius.sm,
              padding: spacing.sm,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text variant="small" style={{ color: colors.expense }}>
            {apiError}
          </Text>
        </View>
      )}

      {/* Submit */}
      <Button
        variant="primary"
        onPress={handleSubmit}
        loading={createContribution.isPending}
        disabled={!selectedTx || !amount}
      >
        Add Contribution
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  txRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

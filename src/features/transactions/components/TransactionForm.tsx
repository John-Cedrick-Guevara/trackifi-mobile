/**
 * Transaction creation form rendered inside a BottomSheet.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useAccounts } from "@/features/accounts/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import type { AccountWithBalance } from "@/types/accounts";
import type { TransactionType } from "@/types/transactions";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/utils/constants";
import { haptic } from "@/utils/haptics";

import { useCreateExpense, useCreateIncome, useCreateTransfer } from "../hooks";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const baseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
});

const incomeSchema = baseSchema.extend({
  to_account_id: z.string().min(1, "Account is required"),
});

const expenseSchema = baseSchema.extend({
  from_account_id: z.string().min(1, "Account is required"),
});

const transferSchema = baseSchema.extend({
  from_account_id: z.string().min(1, "Source account is required"),
  to_account_id: z.string().min(1, "Destination account is required"),
});

type IncomeForm = z.infer<typeof incomeSchema>;
type ExpenseForm = z.infer<typeof expenseSchema>;
type TransferForm = z.infer<typeof transferSchema>;

// ---------------------------------------------------------------------------
// Segment control
// ---------------------------------------------------------------------------

const TYPES: { label: string; value: TransactionType }[] = [
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
  { label: "Transfer", value: "transfer" },
];

interface TransactionFormProps {
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Form component
// ---------------------------------------------------------------------------

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { colors, spacing, radius } = useThemeContext();
  const toast = useToast();
  const [txnType, setTxnType] = useState<TransactionType>("expense");

  const accounts = useAccounts();
  const accountList = accounts.data ?? [];

  const createIncome = useCreateIncome();
  const createExpense = useCreateExpense();
  const createTransfer = useCreateTransfer();

  const schema =
    txnType === "income"
      ? incomeSchema
      : txnType === "expense"
        ? expenseSchema
        : transferSchema;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "" as unknown as number,
      description: "",
      category: "",
      date: "",
      to_account_id: "",
      from_account_id: "",
    },
  });

  const selectedCategory = watch("category");

  const categories =
    txnType === "income"
      ? DEFAULT_INCOME_CATEGORIES
      : DEFAULT_EXPENSE_CATEGORIES;

  const isSubmitting =
    createIncome.isPending ||
    createExpense.isPending ||
    createTransfer.isPending;

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        if (txnType === "income") {
          await createIncome.mutateAsync(data as IncomeForm);
        } else if (txnType === "expense") {
          await createExpense.mutateAsync(data as ExpenseForm);
        } else {
          const d = data as TransferForm;
          if (d.from_account_id === d.to_account_id) {
            Alert.alert("Invalid", "Source and destination must differ.");
            return;
          }
          await createTransfer.mutateAsync(d);
        }
        reset();
        await haptic("medium");
        toast.success("Transaction added!");
        onSuccess();
      } catch {
        toast.error("Failed to create transaction. Try again.");
      }
    },
    [
      txnType,
      createIncome,
      createExpense,
      createTransfer,
      reset,
      onSuccess,
      toast,
    ],
  );

  const submitLabel =
    txnType === "income"
      ? "Add Income"
      : txnType === "expense"
        ? "Add Expense"
        : "Transfer";

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Type segment */}
      <View style={[styles.segment, { marginBottom: spacing.md }]}>
        {TYPES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => setTxnType(t.value)}
            style={[
              styles.segmentItem,
              {
                backgroundColor:
                  txnType === t.value ? colors.accent : colors.surface,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              variant="caption"
              style={{
                color:
                  txnType === t.value ? colors.white : colors.textSecondary,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Amount */}
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Amount"
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

      {/* Account pickers */}
      {(txnType === "income" || txnType === "transfer") && (
        <AccountPicker
          label={txnType === "transfer" ? "To Account" : "Account"}
          accounts={accountList}
          controlName="to_account_id"
          control={control}
          error={errors.to_account_id?.message as string | undefined}
        />
      )}
      {(txnType === "expense" || txnType === "transfer") && (
        <AccountPicker
          label={txnType === "transfer" ? "From Account" : "Account"}
          accounts={accountList}
          controlName="from_account_id"
          control={control}
          error={errors.from_account_id?.message as string | undefined}
        />
      )}

      {/* Category chips (not for transfer) */}
      {txnType !== "transfer" && (
        <View style={{ marginBottom: spacing.md }}>
          <Text
            variant="caption"
            color="textSecondary"
            style={{ marginBottom: spacing.xs }}
          >
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() =>
                  setValue("category", selectedCategory === cat ? "" : cat)
                }
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === cat
                        ? `${colors.accent}20`
                        : colors.surface,
                    borderColor:
                      selectedCategory === cat ? colors.accent : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  variant="small"
                  style={{
                    color:
                      selectedCategory === cat
                        ? colors.accent
                        : colors.textSecondary,
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Description */}
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Description (optional)"
            placeholder="What was this for?"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <View style={{ height: spacing.lg }} />

      {/* Submit */}
      <Button
        variant="primary"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
      >
        {submitLabel}
      </Button>
      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Account picker helper
// ---------------------------------------------------------------------------

function AccountPicker({
  label,
  accounts,
  controlName,
  control,
  error,
}: {
  label: string;
  accounts: AccountWithBalance[];
  controlName: string;
  control: ReturnType<typeof useForm>["control"];
  error?: string;
}) {
  const { colors, spacing, radius } = useThemeContext();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        variant="caption"
        color="textSecondary"
        style={{ marginBottom: spacing.xs }}
      >
        {label}
      </Text>
      <Controller
        control={control}
        name={controlName}
        render={({ field: { onChange, value } }) => (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {accounts.map((acc) => (
                <Pressable
                  key={acc.id}
                  onPress={() => onChange(acc.id)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        value === acc.id
                          ? `${colors.accent}20`
                          : colors.surface,
                      borderColor:
                        value === acc.id ? colors.accent : colors.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    variant="small"
                    style={{
                      color:
                        value === acc.id ? colors.accent : colors.textSecondary,
                    }}
                  >
                    {acc.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {error && (
              <Text variant="small" color="loss" style={{ marginTop: 4 }}>
                {error}
              </Text>
            )}
          </>
        )}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
});

/**
 * BottomSheet form for cashing out from an investment.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";
import { formatCurrency } from "@/utils/currency";
import { haptic } from "@/utils/haptics";

import { useCashOut } from "../hooks";

interface CashOutSheetProps {
  investmentId: string;
  currentValue: number;
  onSuccess: () => void;
}

export function CashOutSheet({
  investmentId,
  currentValue,
  onSuccess,
}: CashOutSheetProps) {
  const { spacing } = useThemeContext();
  const toast = useToast();

  const schema = z.object({
    amount: z.coerce
      .number()
      .positive("Amount must be greater than 0")
      .max(
        currentValue,
        `Amount cannot exceed ${formatCurrency(currentValue)}`,
      ),
    date: z.string().min(1, "Date is required"),
    notes: z.string().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const cashOut = useCashOut(investmentId);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "" as unknown as number,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const amountVal = watch("amount");

  const onSubmit = useCallback(
    async (data: FormValues) => {
      try {
        await cashOut.mutateAsync({
          amount: data.amount,
          date: data.date,
          notes: data.notes || undefined,
        });
        await haptic("medium");
        toast.success("Cash out successful!");
        onSuccess();
      } catch {
        toast.error("Failed to cash out. Try again.");
      }
    },
    [cashOut, onSuccess],
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text variant="bodyBold" style={{ marginBottom: spacing.sm }}>
        Current Value: {formatCurrency(currentValue)}
      </Text>

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Amount to Withdraw"
            placeholder="0.00"
            keyboardType="numeric"
            value={value ? String(value) : ""}
            onChangeText={onChange}
            error={errors.amount?.message as string | undefined}
            style={{ fontSize: 28, fontWeight: "700" }}
          />
        )}
      />
      {amountVal > 0 && (
        <Text variant="small" color="income" style={{ marginTop: 4 }}>
          This will add {formatCurrency(amountVal)} to your allowance account
        </Text>
      )}
      <View style={{ height: spacing.md }} />

      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Date"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
            error={errors.date?.message as string | undefined}
          />
        )}
      />
      <View style={{ height: spacing.md }} />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Notes (optional)"
            placeholder="Any notes"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <View style={{ height: spacing.lg }} />

      <Button
        variant="primary"
        onPress={handleSubmit(onSubmit as any)}
        loading={cashOut.isPending}
      >
        Cash Out
      </Button>
      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
}

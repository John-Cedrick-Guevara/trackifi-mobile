/**
 * BottomSheet form for recording a new investment value.
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

import { useRecordValue } from "../hooks";

const schema = z.object({
  value: z.coerce.number().min(0, "Value must be 0 or greater"),
  recorded_at: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RecordValueSheetProps {
  investmentId: string;
  currentValue: number;
  onSuccess: () => void;
}

export function RecordValueSheet({
  investmentId,
  currentValue,
  onSuccess,
}: RecordValueSheetProps) {
  const { colors, spacing } = useThemeContext();
  const toast = useToast();
  const recordValue = useRecordValue(investmentId);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      value: "" as unknown as number,
      recorded_at: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      try {
        await recordValue.mutateAsync({
          value: data.value,
          recorded_at: data.recorded_at || undefined,
          notes: data.notes || undefined,
        });
        await haptic("medium");
        toast.success("Value recorded!");
        onSuccess();
      } catch {
        toast.error("Failed to record value. Try again.");
      }
    },
    [recordValue, onSuccess],
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text variant="bodyBold" style={{ marginBottom: spacing.sm }}>
        Current Value: {formatCurrency(currentValue)}
      </Text>

      <Controller
        control={control}
        name="value"
        render={({ field: { onChange, value } }) => (
          <Input
            label="New Value"
            placeholder="0.00"
            keyboardType="numeric"
            value={value ? String(value) : ""}
            onChangeText={onChange}
            error={errors.value?.message as string | undefined}
            style={{ fontSize: 28, fontWeight: "700" }}
          />
        )}
      />
      <View style={{ height: spacing.md }} />

      <Controller
        control={control}
        name="recorded_at"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Date"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
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
        loading={recordValue.isPending}
      >
        Update Value
      </Button>
      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
}

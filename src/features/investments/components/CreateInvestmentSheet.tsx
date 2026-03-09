/**
 * BottomSheet form for creating a new investment.
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
import type { InvestmentType } from "@/types/investments";
import { formatCurrency } from "@/utils/currency";
import { haptic } from "@/utils/haptics";

import { useCreateInvestment } from "../hooks";

const TYPES: { label: string; value: InvestmentType }[] = [
  { label: "Stock", value: "stock" },
  { label: "Crypto", value: "crypto" },
  { label: "Fund", value: "fund" },
  { label: "Savings", value: "savings" },
  { label: "Other", value: "other" },
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["stock", "crypto", "fund", "savings", "other"]),
  principal: z.coerce.number().positive("Principal must be greater than 0"),
  start_date: z.string().min(1, "Start date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateInvestmentSheetProps {
  onSuccess: () => void;
}

export function CreateInvestmentSheet({
  onSuccess,
}: CreateInvestmentSheetProps) {
  const { colors, spacing, radius } = useThemeContext();
  const toast = useToast();
  const createInvestment = useCreateInvestment();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "stock",
      principal: "" as unknown as number,
      start_date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const selectedType = watch("type");
  const principalVal = watch("principal");

  const onSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const metadata = data.notes ? { notes: data.notes } : undefined;
        await createInvestment.mutateAsync({
          name: data.name,
          type: data.type,
          principal: data.principal,
          start_date: data.start_date,
          metadata,
        });
        await haptic("medium");
        toast.success("Investment created!");
        onSuccess();
      } catch {
        toast.error("Failed to create investment. Try again.");
      }
    },
    [createInvestment, onSuccess],
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Name */}
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Investment Name"
            placeholder="e.g. AAPL Stock"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message as string | undefined}
          />
        )}
      />
      <View style={{ height: spacing.md }} />

      {/* Type picker */}
      <Text
        variant="caption"
        color="textSecondary"
        style={{ marginBottom: spacing.xs }}
      >
        Type
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
        style={{ marginBottom: spacing.md }}
      >
        {TYPES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => setValue("type", t.value)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selectedType === t.value
                    ? `${colors.accent}20`
                    : colors.surface,
                borderColor:
                  selectedType === t.value ? colors.accent : colors.border,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              variant="small"
              style={{
                color:
                  selectedType === t.value
                    ? colors.accent
                    : colors.textSecondary,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Principal */}
      <Controller
        control={control}
        name="principal"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Principal Amount"
            placeholder="0.00"
            keyboardType="numeric"
            value={value ? String(value) : ""}
            onChangeText={onChange}
            error={errors.principal?.message as string | undefined}
            style={{ fontSize: 28, fontWeight: "700" }}
          />
        )}
      />
      {principalVal > 0 && (
        <Text variant="small" color="warning" style={{ marginTop: spacing.xs }}>
          This will deduct {formatCurrency(principalVal)} from your allowance
          account
        </Text>
      )}
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

      {/* Notes */}
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Notes (optional)"
            placeholder="Any notes about this investment"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <View style={{ height: spacing.lg }} />

      <Button
        variant="primary"
        onPress={handleSubmit(onSubmit as any)}
        loading={createInvestment.isPending}
      >
        Create Investment
      </Button>
      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
});

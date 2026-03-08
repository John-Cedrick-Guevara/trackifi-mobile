import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/features/auth/hooks";
import { useThemeContext } from "@/providers/ThemeProvider";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RegisterForm() {
  const { signUp } = useAuth();
  const { colors, spacing, radius } = useThemeContext();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterValues) => {
    setError(null);
    try {
      await signUp(data.email, data.password);
      setSuccess(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Registration failed. Please try again.",
      );
    }
  };

  if (success) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            padding: spacing.lg,
            gap: spacing.md,
          },
        ]}
      >
        <Text variant="headline" align="center">
          Check Your Email
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          We sent a confirmation link to your email. Please verify your account
          to continue.
        </Text>
        <Link href="/(public)/login" asChild>
          <Pressable>
            <Text variant="body" color="accent" align="center">
              Back to Sign In
            </Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}
    >
      <Text variant="headline" align="center">
        Create Account
      </Text>
      <Text variant="body" color="textSecondary" align="center">
        Start tracking your finances
      </Text>

      {error && (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: `${colors.loss}15`,
              borderRadius: radius.sm,
              padding: spacing.sm,
            },
          ]}
        >
          <Text variant="caption" color="loss" align="center">
            {error}
          </Text>
        </View>
      )}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="new-password"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Confirm Password"
            placeholder="••••••••"
            secureTextEntry
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button
        variant="primary"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        style={{ marginTop: spacing.sm }}
      >
        Create Account
      </Button>

      <View style={styles.linkRow}>
        <Text variant="caption" color="textSecondary">
          Already have an account?{" "}
        </Text>
        <Link href="/(public)/login" asChild>
          <Pressable>
            <Text variant="caption" color="accent">
              Sign In
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 400,
  },
  errorBox: {},
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
});

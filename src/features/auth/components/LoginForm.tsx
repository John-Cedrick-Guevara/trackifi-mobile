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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginForm() {
  const { signIn } = useAuth();
  const { colors, spacing, radius } = useThemeContext();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginValues) => {
    setError(null);
    try {
      await signIn(data.email, data.password);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Sign in failed. Please try again.",
      );
    }
  };

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
        Welcome Back
      </Text>
      <Text variant="body" color="textSecondary" align="center">
        Sign in to your account
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
            autoComplete="password"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      <Button
        variant="primary"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        style={{ marginTop: spacing.sm }}
      >
        Sign In
      </Button>

      <View style={styles.linkRow}>
        <Text variant="caption" color="textSecondary">
          Don&apos;t have an account?{" "}
        </Text>
        <Link href="/(public)/register" asChild>
          <Pressable>
            <Text variant="caption" color="accent">
              Sign Up
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

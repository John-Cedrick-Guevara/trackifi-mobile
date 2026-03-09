/**
 * Inline error banner with retry action.
 */

import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

export interface QueryErrorProps {
  /** Error to display */
  error: Error | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Container overrides */
  style?: ViewStyle;
}

const FRIENDLY: Record<string, string> = {
  "Network request failed": "No internet connection. Please try again.",
  "Failed to fetch": "No internet connection. Please try again.",
  // Matches the message thrown by api-client.ts on fetch failure
  "Network error. Please check your connection and try again.":
    "No internet connection. Please try again.",
};

/**
 * Extract message from both proper Error instances and
 * the plain-object errors thrown by api-client.ts ({type, message}).
 */
function friendlyMessage(err: Error | null): string {
  if (!err) return "Something went wrong.";
  // Plain objects from api-client have a `message` property too
  const raw: string = (err as unknown as { message?: string }).message ?? "";
  return FRIENDLY[raw] ?? (raw || "Something went wrong. Please try again.");
}

export function QueryError({ error, onRetry, style }: QueryErrorProps) {
  const { colors, spacing, radius } = useThemeContext();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.md,
          borderLeftWidth: 3,
          borderLeftColor: colors.expense,
          padding: spacing.md,
        },
        style,
      ]}
      accessibilityRole="alert"
    >
      <Text variant="body" style={{ flex: 1 }}>
        {friendlyMessage(error)}
      </Text>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onPress={onRetry}
          style={{ marginTop: spacing.sm }}
        >
          Retry
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});

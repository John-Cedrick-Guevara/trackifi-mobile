/**
 * Empty state placeholder with optional CTA button.
 */

import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

export interface EmptyStateProps {
  /** Icon or illustration element rendered above the title */
  icon?: React.ReactNode;
  /** Headline text */
  title: string;
  /** Supporting description */
  message?: string;
  /** CTA button label */
  actionLabel?: string;
  /** CTA handler */
  onAction?: () => void;
  /** Container style */
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { spacing } = useThemeContext();

  return (
    <View style={[styles.container, { padding: spacing.xl }, style]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}

      <Text variant="title" align="center">
        {title}
      </Text>

      {message && (
        <Text
          variant="body"
          color="textSecondary"
          align="center"
          style={{ marginTop: spacing.sm }}
        >
          {message}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          variant="primary"
          onPress={onAction}
          style={{ marginTop: spacing.lg }}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconWrap: {
    marginBottom: 16,
  },
});

export default EmptyState;

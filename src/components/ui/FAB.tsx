/**
 * Floating Action Button — circular accent-colored "+" button.
 */

import React from "react";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

export interface FABProps {
  onPress: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function FAB({ onPress, style, accessibilityLabel }: FABProps) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: colors.accent,
          bottom: 24 + insets.bottom,
          opacity: pressed ? 0.85 : 1,
        },
        shadows.lg,
        style,
      ]}
      accessibilityLabel={accessibilityLabel ?? "Add new item"}
      accessibilityRole="button"
    >
      <Text variant="headline" style={{ color: colors.white }}>
        +
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});

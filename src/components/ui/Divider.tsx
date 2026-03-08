/**
 * Themed horizontal divider.
 */

import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { useThemeContext } from "@/providers/ThemeProvider";

export interface DividerProps {
  /** Vertical spacing above & below */
  spacing?: number;
  style?: ViewStyle;
}

export function Divider({ spacing, style }: DividerProps) {
  const { colors, spacing: sp } = useThemeContext();

  return (
    <View
      style={[
        styles.line,
        {
          backgroundColor: colors.border,
          marginVertical: spacing ?? sp.sm,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});

export default Divider;

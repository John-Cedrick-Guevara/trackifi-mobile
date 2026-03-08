/**
 * Circular avatar with initials fallback.
 */

import React, { useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/Text";
import { useThemeContext } from "@/providers/ThemeProvider";

export interface AvatarProps {
  /** Full name or email — first letters used as initials */
  name: string;
  /** Pixel size (width = height) */
  size?: number;
  /** Container style override */
  style?: ViewStyle;
}

export function Avatar({ name, size = 40, style }: AvatarProps) {
  const { colors, radius } = useThemeContext();

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: colors.accent,
        },
        style,
      ]}
    >
      <Text
        variant="bodyBold"
        style={{
          color: colors.white,
          fontSize: size * 0.38,
          lineHeight: size,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

export default Avatar;

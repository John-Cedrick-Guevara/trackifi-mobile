/**
 * Animated skeleton placeholder with shimmer pulse.
 */

import React, { useEffect } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useThemeContext } from "@/providers/ThemeProvider";

export interface SkeletonProps {
  /** Width — number or percentage string */
  width?: number | `${number}%`;
  /** Height in pixels */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Container style override */
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius,
  style,
}: SkeletonProps) {
  const { colors, radius } = useThemeContext();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: borderRadius ?? radius.md,
          backgroundColor: colors.border,
        },
        animStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});

export default Skeleton;

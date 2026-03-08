/**
 * Bottom sheet component using Reanimated + Gesture Handler.
 * Slides up from the bottom with backdrop dimming.
 */

import React, { useCallback, useEffect } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeContext } from "@/providers/ThemeProvider";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const TIMING_CONFIG = { duration: 300, easing: Easing.out(Easing.cubic) };

export interface BottomSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Close callback */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Max height as fraction of screen (0–1), default 0.85 */
  maxHeightRatio?: number;
  /** Container style override */
  style?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.85,
  style,
}: BottomSheetProps) {
  const { colors, radius, spacing } = useThemeContext();
  const insets = useSafeAreaInsets();
  const maxHeight = SCREEN_HEIGHT * maxHeightRatio;

  const translateY = useSharedValue(maxHeight);
  const backdropOpacity = useSharedValue(0);

  const open = useCallback(() => {
    translateY.value = withTiming(0, TIMING_CONFIG);
    backdropOpacity.value = withTiming(0.5, TIMING_CONFIG);
  }, [translateY, backdropOpacity]);

  const close = useCallback(() => {
    translateY.value = withTiming(maxHeight, TIMING_CONFIG);
    backdropOpacity.value = withTiming(0, TIMING_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [translateY, backdropOpacity, maxHeight, onClose]);

  useEffect(() => {
    if (visible) {
      open();
    }
  }, [visible, open]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > maxHeight * 0.3) {
        runOnJS(close)();
      } else {
        translateY.value = withTiming(0, TIMING_CONFIG);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={close}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight,
              backgroundColor: colors.surfaceElevated,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingBottom: insets.bottom + spacing.md,
            },
            sheetStyle,
            style,
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Content */}
          <View style={{ paddingHorizontal: spacing.md }}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

export default BottomSheet;

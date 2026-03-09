/**
 * Haptic feedback utility — guarded for web platform.
 */

import { Platform } from "react-native";

type HapticStyle = "light" | "medium" | "heavy";

/**
 * Trigger haptic feedback on native platforms.
 * No-op on web.
 */
export async function haptic(style: HapticStyle = "light"): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Haptics = await import("expo-haptics");
    const map: Record<HapticStyle, Haptics.ImpactFeedbackStyle> = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(map[style]);
  } catch {
    // Haptics not available — silently ignore
  }
}

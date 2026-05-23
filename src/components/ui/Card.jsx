import React, { useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { colors, radius, shadows } from "../../theme";

/**
 * Card — conteneur avec fond blanc, coins arrondis, ombre subtile
 *
 * Usage:
 *   <Card>…contenu…</Card>
 *   <Card onPress={fn} pressScale>…contenu cliquable…</Card>
 *   <Card variant="elevated" padding="lg">…</Card>
 *   <Card variant="outlined" borderColor={colors.primary}>…</Card>
 */
export default function Card({
  children,
  onPress,
  variant = "default",
  padding = "md",
  pressScale = false,
  borderColor: customBorder,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    if (!pressScale) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [pressScale, scale]);

  const onPressOut = useCallback(() => {
    if (!pressScale) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [pressScale, scale]);

  const v = CARD_VARIANTS[variant] || CARD_VARIANTS.default;
  const p = PADDING_MAP[padding] ?? PADDING_MAP.md;

  const cardStyle = [
    styles.base,
    v,
    { padding: p },
    customBorder ? { borderColor: customBorder } : null,
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={pressScale ? { transform: [{ scale }] } : undefined}>
        <TouchableOpacity
          style={cardStyle}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={pressScale ? 1 : 0.85}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// ── Variants ────────────────────────────────────────────
const CARD_VARIANTS = {
  default: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 0,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 0,
  },
};

// ── Padding map ─────────────────────────────────────────
const PADDING_MAP = {
  none: 0,
  sm: 10,
  md: 14,
  lg: 20,
};

const styles = StyleSheet.create({
  base: {},
});

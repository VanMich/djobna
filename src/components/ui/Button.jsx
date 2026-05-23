import React, { useRef, useCallback } from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
} from "react-native";
import { colors, radius, shadows } from "../../theme";

/**
 * Button universel — Uber/Yango style
 *
 * Variants: "primary" | "secondary" | "outline" | "ghost" | "danger"
 * Sizes:    "lg" | "md" | "sm"
 *
 * Usage:
 *   <Button title="Accepter" onPress={fn} />
 *   <Button title="Décliner" variant="outline" size="sm" />
 *   <Button title="Enregistrer" loading icon={<Ionicons … />} />
 *   <Button title="Supprimer" variant="danger" />
 */
export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  textStyle,
  fullWidth = true,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [scale]);

  const isDisabled = disabled || loading;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.lg;

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.base,
          v.container,
          s.container,
          isDisabled && styles.disabled,
          isDisabled && v.containerDisabled,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={v.loaderColor}
            style={{ marginRight: title ? 8 : 0 }}
          />
        ) : icon ? (
          <View style={{ marginRight: title ? 8 : 0 }}>{icon}</View>
        ) : null}

        {title ? (
          <Text
            style={[
              styles.text,
              v.text,
              s.text,
              isDisabled && v.textDisabled,
              textStyle,
            ]}
          >
            {loading ? title : title}
          </Text>
        ) : null}

        {iconRight && !loading ? (
          <View style={{ marginLeft: 8 }}>{iconRight}</View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Variants ────────────────────────────────────────────
const VARIANTS = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      ...shadows.sm,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
    },
    containerDisabled: { backgroundColor: colors.disabled, shadowOpacity: 0 },
    text: { color: "#FFFFFF" },
    textDisabled: { color: "rgba(255,255,255,0.7)" },
    loaderColor: "#FFFFFF",
  },
  secondary: {
    container: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.green200,
    },
    containerDisabled: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    text: { color: colors.primary },
    textDisabled: { color: colors.textMuted },
    loaderColor: colors.primary,
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    containerDisabled: { borderColor: colors.borderLight },
    text: { color: colors.textPrimary },
    textDisabled: { color: colors.textMuted },
    loaderColor: colors.textSecondary,
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
    },
    containerDisabled: {},
    text: { color: colors.primary },
    textDisabled: { color: colors.textMuted },
    loaderColor: colors.primary,
  },
  danger: {
    container: {
      backgroundColor: colors.error,
    },
    containerDisabled: { backgroundColor: colors.disabled },
    text: { color: "#FFFFFF" },
    textDisabled: { color: "rgba(255,255,255,0.7)" },
    loaderColor: "#FFFFFF",
  },
};

// ── Sizes ───────────────────────────────────────────────
const SIZES = {
  lg: {
    container: { paddingVertical: 16, paddingHorizontal: 24 },
    text: { fontSize: 16 },
  },
  md: {
    container: { paddingVertical: 12, paddingHorizontal: 20 },
    text: { fontSize: 14 },
  },
  sm: {
    container: { paddingVertical: 8, paddingHorizontal: 14 },
    text: { fontSize: 13 },
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  text: {
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.85,
  },
});

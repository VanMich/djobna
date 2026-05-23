import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Star } from "phosphor-react-native";
import { colors, radius } from "../../theme";

/**
 * Badge / StatusBadge — affiche un statut, une notification, ou un tag
 *
 * Usage:
 *   <Badge label="Pro" variant="premium" />
 *   <Badge label="Nouveau" variant="info" />
 *   <Badge count={3} />                      ← notification counter
 *   <Badge label="✓ Vérifié" variant="success" />
 *   <StatusDot status="online" />
 */

// ── Badge principal ───────────────────────────────────────
export default function Badge({
  label,
  count,
  variant = "default",
  size = "md",
  icon,
  style,
}) {
  // Notification counter mode
  if (count !== undefined) {
    if (count <= 0) return null;
    const displayCount = count > 99 ? "99+" : String(count);
    return (
      <View style={[styles.countBadge, size === "sm" && styles.countBadgeSm, style]}>
        <Text style={[styles.countText, size === "sm" && styles.countTextSm]}>
          {displayCount}
        </Text>
      </View>
    );
  }

  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;
  const s = BADGE_SIZES[size] || BADGE_SIZES.md;

  return (
    <View style={[styles.badge, v.container, s.container, style]}>
      {icon ? (
        <Ionicons name={icon} size={s.iconSize} color={v.iconColor} style={{ marginRight: 3 }} />
      ) : null}
      <Text style={[styles.badgeText, v.text, s.text]}>{label}</Text>
    </View>
  );
}

// ── StatusDot — petit indicateur en ligne/hors ligne ──────
export function StatusDot({ status = "online", size = 12, style }) {
  const dotColors = {
    online: colors.success,
    offline: colors.textMuted,
    busy: colors.warning,
    away: colors.warning,
  };

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColors[status] || dotColors.offline,
        },
        style,
      ]}
    />
  );
}

// ── VerifiedBadge — petit checkmark vert ──────────────────
export function VerifiedBadge({ size = 18, style }) {
  return (
    <View
      style={[
        styles.verifiedCircle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.verifiedText, { fontSize: size * 0.55 }]}>✓</Text>
    </View>
  );
}

// ── PremiumBadge — badge ⭐ Pro ──────────────────────────
export function PremiumBadge({ style }) {
  return (
    <View style={[styles.premiumBadge, style]}>
      <Star size={10} color="#B45309" weight="fill" />
      <Text style={styles.premiumText}>Pro</Text>
    </View>
  );
}

// ── Variants ────────────────────────────────────────────
const BADGE_VARIANTS = {
  default: {
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    text: { color: colors.textSecondary },
    iconColor: colors.textSecondary,
  },
  primary: {
    container: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.green200,
      borderWidth: 1,
    },
    text: { color: colors.primaryDark },
    iconColor: colors.primary,
  },
  success: {
    container: {
      backgroundColor: colors.successLight,
      borderColor: colors.successBorder,
      borderWidth: 1,
    },
    text: { color: "#065F46" },
    iconColor: colors.success,
  },
  warning: {
    container: {
      backgroundColor: colors.warningLight,
      borderColor: colors.warningBorder,
      borderWidth: 1,
    },
    text: { color: "#92400E" },
    iconColor: colors.warning,
  },
  error: {
    container: {
      backgroundColor: colors.errorLight,
      borderColor: colors.errorBorder,
      borderWidth: 1,
    },
    text: { color: "#991B1B" },
    iconColor: colors.error,
  },
  info: {
    container: {
      backgroundColor: colors.infoLight,
      borderColor: colors.infoBorder,
      borderWidth: 1,
    },
    text: { color: "#1E40AF" },
    iconColor: colors.info,
  },
  premium: {
    container: {
      backgroundColor: colors.premiumBg,
      borderColor: colors.premiumBorder,
      borderWidth: 1,
    },
    text: { color: "#B45309" },
    iconColor: colors.premium,
  },
};

// ── Sizes ───────────────────────────────────────────────
const BADGE_SIZES = {
  sm: {
    container: { paddingVertical: 2, paddingHorizontal: 6 },
    text: { fontSize: 9 },
    iconSize: 8,
  },
  md: {
    container: { paddingVertical: 3, paddingHorizontal: 8 },
    text: { fontSize: 11 },
    iconSize: 10,
  },
  lg: {
    container: { paddingVertical: 5, paddingHorizontal: 12 },
    text: { fontSize: 13 },
    iconSize: 12,
  },
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xs,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontWeight: "700",
  },
  // Count badge (notification)
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  countBadgeSm: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
  },
  countText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  countTextSm: {
    fontSize: 8,
  },
  // Verified
  verifiedCircle: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    fontWeight: "800",
    color: colors.primary,
  },
  // Premium
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.premiumBg,
    borderRadius: radius.xs,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.premiumBorder,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#B45309",
  },
  // Dot
  dot: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});

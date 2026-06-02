// src/components/clientProfile/MenuItem.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "../ui/Icon";
import { colors, fonts } from "../../theme";

export default function MenuItem({
  icon,
  iconBg,
  iconColor,
  label,
  sublabel,
  badge,
  badgeColor,
  badgeBg,
  onPress,
  isDestructive,
  showArrow = true,
  rightComponent,
}) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icône — Phosphor icon name (string) via Icon wrapper */}
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBg || "#F5F5F5" }]}>
          <Icon
            name={icon}
            size={18}
            color={iconColor || (isDestructive ? colors.error : colors.ink500)}
            weight="duotone"
          />
        </View>
      ) : null}

      {/* Texte */}
      <View style={styles.textBlock}>
        <Text style={[styles.label, isDestructive && styles.labelDestructive]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>

      {/* Droite : badge ou toggle ou flèche */}
      <View style={styles.right}>
        {badge && (
          <View
            style={[styles.badge, { backgroundColor: badgeBg || "#F0FAF6" }]}
          >
            <Text
              style={[styles.badgeText, { color: badgeColor || colors.primaryDark }]}
            >
              {badge}
            </Text>
          </View>
        )}
        {rightComponent}
        {showArrow && !rightComponent && (
          <Icon name="chevron-right" size={14} color={colors.ink300} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.ink50,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: { flex: 1, gap: 2 },
  label: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.ink900 },
  labelDestructive: { color: colors.error },
  sublabel: { fontSize: 11, color: colors.ink500, fontFamily: fonts.medium },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontFamily: fonts.bold },
});

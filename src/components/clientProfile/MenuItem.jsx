// src/components/clientProfile/MenuItem.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CaretRight } from "phosphor-react-native";
import Icon from "../ui/Icon";

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
            color={iconColor || (isDestructive ? "#E24B4A" : "#555")}
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
              style={[styles.badgeText, { color: badgeColor || "#0F6E56" }]}
            >
              {badge}
            </Text>
          </View>
        )}
        {rightComponent}
        {showArrow && !rightComponent && (
          <CaretRight size={14} color="#CCC" weight="bold" />
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
    borderBottomColor: "#F5F5F5",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  // icon style removed — now uses Phosphor Icon component
  textBlock: { flex: 1, gap: 2 },
  label: { fontSize: 13, fontWeight: "600", color: "#111" },
  labelDestructive: { color: "#E24B4A" },
  sublabel: { fontSize: 11, color: "#888" },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
});

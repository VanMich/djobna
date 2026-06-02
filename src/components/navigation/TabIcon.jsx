// src/components/navigation/TabIcon.jsx
// Composant partagé entre ClientTabNavigator et ProviderTabNavigator.
// Affiche l'icône d'un onglet avec indicateur actif et badge unread.

import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Icon from "../ui/Icon";
import { colors, fonts } from "../../theme";

export default function TabIcon({ name, focused, badge }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.indicator, focused && styles.indicatorActive]} />
      <View style={[styles.iconBubble, focused && styles.iconBubbleActive]}>
        <Icon
          name={name}
          size={24}
          color={focused ? colors.primary : colors.ink300}
          strokeWidth={focused ? 2.2 : 1.8}
        />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export const tabBarStyle = {
  backgroundColor: colors.surface,
  borderTopWidth: 0,
  shadowColor: colors.ink900,
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: -4 },
  elevation: 16,
  height: Platform.OS === "ios" ? 72 : 58,
  paddingTop: 0,
  paddingBottom: 0,
};

const styles = StyleSheet.create({
  iconWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 4 : 2,
    paddingBottom: Platform.OS === "ios" ? 0 : 2,
  },
  indicator: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    backgroundColor: "transparent",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  indicatorActive: { backgroundColor: colors.primary },
  iconBubble: {
    width: 48,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconBubbleActive: { backgroundColor: colors.primarySoft },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontFamily: fonts.extraBold, color: colors.textInverse },
});

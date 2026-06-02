// src/components/providerProfile/ProfileTabs.jsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts } from "../../theme";

const TABS = [
  { id: "profile", label: "Profil" },
  { id: "portfolio", label: "Réalisations" },
  { id: "reviews", label: "Avis" },
];

export default function ProfileTabs({ activeTab, reviewCount, onTabChange }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.container}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
              {tab.id === "reviews" && ` (${reviewCount || 0})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  container: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 12,
  },
  tabActive: { backgroundColor: colors.primarySoft },
  tabText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink300 },
  tabTextActive: { color: colors.primary },
});

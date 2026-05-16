// src/components/providerProfile/ProfileTabs.jsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../theme";

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
    backgroundColor: "#F4F6F5",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 12,
  },
  tabActive: { backgroundColor: "#F0FAF6" },
  tabText: { fontSize: 12, fontWeight: "700", color: "#AAB0B7" },
  tabTextActive: { color: colors.primary },
});

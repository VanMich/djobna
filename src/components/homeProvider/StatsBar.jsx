// src/components/homeProvider/StatsBar.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StatsBar({ stats, isAvailable }) {
  const items = [
    {
      value: stats.todayCount || "0",
      label: "Aujourd'hui",
    },
    {
      value: stats.rating > 0 ? `${stats.rating.toFixed(1)}⭐` : "–",
      label: "Note",
    },
    {
      // Formater les revenus en milliers si > 1000
      value:
        stats.monthRevenue >= 1000
          ? `${Math.round(stats.monthRevenue / 1000)}K`
          : stats.monthRevenue || "0",
      label: "Mois (FCFA)",
    },
  ];

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.card,
            !isAvailable && styles.cardOff,
            index < items.length - 1 && styles.cardBorder,
          ]}
        >
          <Text style={[styles.value, !isAvailable && styles.valueOff]}>
            {item.value}
          </Text>
          <Text style={[styles.label, !isAvailable && styles.labelOff]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: "rgba(29,158,117,.18)",
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(29,158,117,.2)",
    gap: 2,
  },
  cardOff: { opacity: 0.4 },
  cardBorder: {},
  value: { fontSize: 16, fontWeight: "800", color: "#5DCAA5" },
  valueOff: { color: "rgba(255,255,255,.4)" },
  label: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(29,158,117,.7)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelOff: { color: "rgba(255,255,255,.25)" },
});

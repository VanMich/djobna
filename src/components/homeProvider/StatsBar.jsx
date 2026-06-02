// src/components/homeProvider/StatsBar.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "../ui/Icon";
import { colors, fonts, shadows } from "../../theme";

function formatNumber(n) {
  if (!n) return "0";
  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
}

export default function StatsBar({ stats, isAvailable }) {
  const rating = typeof stats.rating === "object" ? stats.rating?.global : stats.rating;
  const ratingDisplay = rating > 0 ? Number(rating).toFixed(1) : "–";

  const items = [
    {
      icon: "zap",
      iconBg: colors.primarySoft,
      iconColor: colors.primary,
      value: stats.todayCount || "0",
      label: "Missions aujourd'hui",
      trend: stats.todayCount > 0 ? `+${stats.todayCount}` : null,
    },
    {
      icon: "star",
      iconBg: colors.mangoSoft,
      iconColor: colors.mango,
      value: ratingDisplay,
      label: "Note moyenne",
      trend: null,
    },
    {
      icon: "trending-up",
      iconBg: "#F5EEFE",
      iconColor: colors.purple,
      value: formatNumber(stats.monthRevenue),
      label: "Mois (FCFA)",
      trend: null,
    },
    {
      icon: "wallet",
      iconBg: "#E8F4FF",
      iconColor: colors.sky,
      value: formatNumber(stats.walletBalance),
      label: "Solde (FCFA)",
      trend: null,
    },
  ];

  return (
    <View style={[styles.grid, !isAvailable && styles.gridOff]}>
      {items.map((item) => (
        <View key={item.label} style={styles.card}>
          <View style={styles.iconRow}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <Icon name={item.icon} size={16} color={item.iconColor} />
            </View>
            {item.trend && (
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>{item.trend}</Text>
              </View>
            )}
          </View>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridOff: { opacity: 0.4 },
  card: {
    width: "47.5%",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.ink100,
    gap: 6,
    ...shadows.sm,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  trendText: { fontSize: 10, fontFamily: fonts.bold, color: colors.primary },
  value: {
    fontSize: 22,
    fontFamily: fonts.extraBold,
    color: colors.ink900,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.ink500,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});

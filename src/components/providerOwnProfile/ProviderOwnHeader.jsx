// src/components/providerOwnProfile/ProviderOwnHeader.jsx
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SERVICES } from "../../constants/services";
import { colors } from "../../theme";

export default function ProviderOwnHeader({ profile, provider, onSettings }) {
  const initials = (profile?.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const serviceLabels = (provider?.services || [])
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => `${s.icon} ${s.label}`)
    .join(" · ");

  const stats = [
    {
      value: provider?.rating > 0 ? `${provider.rating.toFixed(1)} ⭐` : "-",
      label: "Note",
    },
    { value: provider?.reviewCount || 0, label: "Avis" },
    { value: provider?.completedJobs || 0, label: "Missions" },
    { value: "2 ans", label: "Expér." },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Mon profil</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={onSettings}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color="#9FE1CB" />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {provider?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.name}>{profile?.displayName}</Text>
            {serviceLabels ? (
              <Text style={styles.services} numberOfLines={1}>
                {serviceLabels}
              </Text>
            ) : null}
            <Text style={styles.phone}>
              {profile?.phoneNumber || "+237 -- -- -- -- --"}
            </Text>
          </View>
        </View>

        <View style={styles.statsBar}>
          {stats.map((s, i, arr) => (
            <View
              key={s.label}
              style={[
                styles.statItem,
                i < arr.length - 1 && styles.statItemBorder,
              ]}
            >
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 6,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  verifiedBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBlock: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  services: { fontSize: 11, color: "#5DCAA5", fontWeight: "600" },
  phone: { fontSize: 11, color: "rgba(255,255,255,.4)" },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(29,158,117,.18)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(29,158,117,.2)",
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: "rgba(29,158,117,.2)",
  },
  statValue: { fontSize: 14, fontWeight: "800", color: "#5DCAA5" },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(29,158,117,.7)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});

// src/components/clientProfile/ClientProfileHeader.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "../ui/Icon";
import { colors } from "../../theme";

export default function ClientProfileHeader({
  profile,
  stats,
  onEditPhoto,
  onSettings,
}) {
  const initials = (profile?.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Ligne titre + settings */}
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

        {/* Avatar + infos */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {/* Bouton éditer photo */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={onEditPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={10} color="#555" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.name}>{profile?.displayName}</Text>
            <Text style={styles.phone}>
              {profile?.phoneNumber || "+237 — — — — — —"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="map-pin" size={12} color={colors.headerSubtext} weight="fill" />
              <Text style={styles.quartier}>{profile?.quartier || "Douala"}</Text>
            </View>
          </View>
        </View>

        {/* Stats rapides */}
        <View style={styles.statsRow}>
          {[
            { value: stats?.missionsCount ?? 0, label: "Missions" },
            { value: stats?.favoritesCount ?? 0, label: "Favoris" },
            { value: stats?.reviewsGiven ?? 0, label: "Avis donnés" },
          ].map((s, i, arr) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                i < arr.length - 1 && styles.statCardBorder,
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
  safeArea: { backgroundColor: colors.headerBg },
  header: {
    backgroundColor: colors.headerBg,
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

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
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
  editBtn: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  infoBlock: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  phone: { fontSize: 12, color: "#9FE1CB" },
  quartier: { fontSize: 11, color: "rgba(255,255,255,.4)" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(29,158,117,.18)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(29,158,117,.2)",
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  statCardBorder: {
    borderRightWidth: 1,
    borderRightColor: "rgba(29,158,117,.2)",
  },
  statValue: { fontSize: 16, fontWeight: "800", color: "#5DCAA5" },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(29,158,117,.7)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});

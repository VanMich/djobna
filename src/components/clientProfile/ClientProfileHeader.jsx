// src/components/clientProfile/ClientProfileHeader.jsx
// Partie "body" du header (avatar + infos + stats) — intégrée dans le ScrollView.
// La topRow (titre + settings) est maintenant gérée directement dans le screen.
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "../ui/Icon";
import { colors, fonts, shadows } from "../../theme";

export default function ClientProfileHeader({
  profile,
  stats,
  onEditPhoto,
}) {
  const initials = (profile?.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.header}>
      {/* Avatar + infos */}
      <View style={styles.avatarRow}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEditPhoto}
            activeOpacity={0.8}
          >
            <Icon name="camera" size={10} color={colors.ink500} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.name}>{profile?.displayName}</Text>
          <Text style={styles.phone}>
            {profile?.phoneNumber || "+237 — — — — — —"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="map-pin" size={12} color={colors.ink500} />
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
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    gap: 14,
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
  avatarText: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.textInverse },
  editBtn: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },

  infoBlock: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.ink900, letterSpacing: -0.3 },
  phone: { fontSize: 12, color: colors.ink500, fontFamily: fonts.medium },
  quartier: { fontSize: 11, color: colors.ink300, fontFamily: fonts.medium },

  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.green200,
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
    borderRightColor: colors.green200,
  },
  statValue: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.primaryDark },
  statLabel: {
    fontSize: 9,
    fontFamily: fonts.semiBold,
    color: colors.ink500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});

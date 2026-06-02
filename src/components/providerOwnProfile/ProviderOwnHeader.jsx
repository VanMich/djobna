// src/components/providerOwnProfile/ProviderOwnHeader.jsx
// Partie "body" du header (avatar + infos + stats) — intégrée dans le ScrollView.
// La topRow (titre + settings) est maintenant gérée directement dans le screen.
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { SERVICES } from "../../constants/services";
import Icon from "../ui/Icon";
import { colors, fonts, shadows } from "../../theme";

export default function ProviderOwnHeader({ profile, provider, onEditPhoto }) {
  const initials = (profile?.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const serviceLabels = (provider?.services || [])
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => s.label)
    .join(" · ");

  const yearsExp = provider?.yearsOfExperience ?? provider?.years_of_experience ?? 0;
  const expLabel = yearsExp > 0 ? `${yearsExp} an${yearsExp > 1 ? "s" : ""}` : "-";

  const stats = [
    {
      value: (provider?.rating?.global ?? 0) > 0 ? `${(provider.rating.global).toFixed(1)}` : "-", hasIcon: true,
      label: "Note",
    },
    { value: provider?.reviewCount || 0, label: "Avis" },
    { value: provider?.completedJobs || 0, label: "Missions" },
    { value: expLabel, label: "Expér." },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.avatarRow}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={onEditPhoto}
          activeOpacity={onEditPhoto ? 0.8 : 1}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {onEditPhoto && (
            <View style={styles.editBtn}>
              <Icon name="camera" size={10} color={colors.ink500} />
            </View>
          )}
          {provider?.isVerified && !onEditPhoto && (
            <View style={styles.verifiedBadge}>
              <Icon name="check" size={10} color={colors.textInverse} />
            </View>
          )}
        </TouchableOpacity>

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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Text style={styles.statValue}>{s.value}</Text>
              {s.hasIcon && <Icon name="star" size={12} color={colors.mango} />}
            </View>
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
  avatarText: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.textInverse },
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
  services: { fontSize: 11, color: colors.primary, fontFamily: fonts.semiBold },
  phone: { fontSize: 11, color: colors.ink300, fontFamily: fonts.medium },
  statsBar: {
    flexDirection: "row",
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.green200,
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
    borderRightColor: colors.green200,
  },
  statValue: { fontSize: 14, fontFamily: fonts.extraBold, color: colors.primaryDark },
  statLabel: {
    fontSize: 9,
    fontFamily: fonts.semiBold,
    color: colors.ink500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});

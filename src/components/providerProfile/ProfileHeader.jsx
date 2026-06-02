// src/components/providerProfile/ProfileHeader.jsx
// Partie "body" du header public (avatar + infos + CTA + stats).
// La topRow (back + favori + share + more) est gérée dans le screen directement.
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AVATAR_COLORS, SERVICES } from "../../constants/services";
import Icon from "../ui/Icon";
import { colors, fonts } from "../../theme";

function getRating(provider) {
  if (typeof provider?.rating === "object") return provider.rating?.global ?? 0;
  return provider?.rating ?? 0;
}

export default function ProfileHeader({
  provider,
  onContact,
  onSolliciter,
}) {
  const initials = (provider?.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarColor = AVATAR_COLORS[provider?.services?.[0]] || colors.primary;
  const isVerified = provider?.verificationStatus === "approved";
  const isPremium = provider?.subscription?.plan === "premium";

  const serviceLabels = (provider?.services || [])
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => s.label)
    .join(" · ");

  const rating = getRating(provider);

  const stats = [
    { value: rating > 0 ? `${rating.toFixed(1)}` : "-", label: "Note", hasIcon: true },
    { value: provider?.reviewCount || 0, label: "Avis" },
    { value: provider?.completedJobs || 0, label: "Missions" },
    {
      value: provider?.yearsOfExperience
        ? `${provider.yearsOfExperience} ${provider.yearsOfExperience > 1 ? "ans" : "an"}`
        : "-",
      label: "Expér.",
    },
  ];

  return (
    <View style={styles.header}>
      {/* ── Avatar + infos ── */}
      <View style={styles.avatarRow}>
        <View style={{ position: "relative", flexShrink: 0 }}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark" size={10} color={colors.textInverse} />
            </View>
          )}
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>★</Text>
            </View>
          )}
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{provider?.displayName}</Text>
            {isPremium && (
              <View style={styles.premiumTag}>
                <Text style={styles.premiumTagText}>Premium</Text>
              </View>
            )}
          </View>
          {serviceLabels ? (
            <Text style={styles.services} numberOfLines={1}>{serviceLabels}</Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="map-pin" size={12} color={colors.ink500} />
            <Text style={styles.location}>
              {provider?.quartier || "Douala"}
              {isVerified ? " · Vérifié" : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={styles.ctaBtnPrimary}
          onPress={onSolliciter}
          activeOpacity={0.85}
        >
          <Icon name="flash" size={15} color={colors.textInverse} />
          <Text style={styles.ctaBtnPrimaryText}>Solliciter les services</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsBar}>
        {stats.map((s, i, arr) => (
          <View
            key={s.label}
            style={[styles.statItem, i < arr.length - 1 && styles.statItemBorder]}
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
    paddingTop: 10,
    paddingBottom: 12,
    gap: 14,
  },

  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
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
  premiumBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.mango,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBadgeText: { fontSize: 9, color: colors.textInverse, fontFamily: fonts.extraBold },

  infoBlock: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.ink900, letterSpacing: -0.3, flex: 1 },
  premiumTag: {
    backgroundColor: colors.mango,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumTagText: { fontSize: 9, fontFamily: fonts.extraBold, color: colors.textInverse },
  services: { fontSize: 11, color: colors.primary, fontFamily: fonts.semiBold },
  location: { fontSize: 11, color: colors.ink300, fontFamily: fonts.medium },

  ctaRow: { flexDirection: "row" },
  ctaBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  ctaBtnPrimaryText: { color: colors.textInverse, fontSize: 13, fontFamily: fonts.extraBold },

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

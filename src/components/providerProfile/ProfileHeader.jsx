// src/components/providerProfile/ProfileHeader.jsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AVATAR_COLORS, SERVICES } from "../../constants/services";
import { colors } from "../../theme";

function getRating(provider) {
  if (typeof provider?.rating === "object") return provider.rating?.global ?? 0;
  return provider?.rating ?? 0;
}

export default function ProfileHeader({
  provider,
  isFav,
  onBack,
  onToggleFav,
  onShare,
  onMore,
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
    .map((s) => `${s.icon} ${s.label}`)
    .join(" · ");

  const rating = getRating(provider);

  const stats = [
    { value: rating > 0 ? `${rating.toFixed(1)} ⭐` : "-", label: "Note" },
    { value: provider?.reviewCount || 0, label: "Avis" },
    { value: provider?.completedJobs || 0, label: "Missions" },
    {
      value: provider?.yearsOfExperience ? `${provider.yearsOfExperience} ans` : "-",
      label: "Expér.",
    },
  ];

  return (
    <View style={styles.header}>
      {/* ── Ligne navigation ── */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#9FE1CB" />
        </TouchableOpacity>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.iconBtn, isFav && styles.iconBtnFavActive]}
            onPress={onToggleFav}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={18}
              color={isFav ? colors.star : "#9FE1CB"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={18} color="#9FE1CB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onMore} activeOpacity={0.8}>
            <Ionicons name="ellipsis-vertical" size={18} color="#9FE1CB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Avatar + infos ── */}
      <View style={styles.avatarRow}>
        <View style={{ position: "relative", flexShrink: 0 }}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
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
          <Text style={styles.location}>
            📍 {provider?.quartier || "Douala"}
            {isVerified ? " · ✓ Vérifié" : ""}
          </Text>
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={styles.ctaBtnPrimary}
          onPress={onSolliciter}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={15} color="#fff" />
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
    paddingTop: 6,
    paddingBottom: 12,
    gap: 14,
  },
  topRow: {
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  iconBtnFavActive: {
    backgroundColor: "rgba(245,166,35,.15)",
    borderColor: "rgba(245,166,35,.3)",
  },

  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
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
  premiumBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F59E0B",
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBadgeText: { fontSize: 9, color: "#fff", fontWeight: "800" },

  infoBlock: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.3, flex: 1 },
  premiumTag: {
    backgroundColor: "#F59E0B",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumTagText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  services: { fontSize: 11, color: "#5DCAA5", fontWeight: "600" },
  location: { fontSize: 11, color: "rgba(255,255,255,.4)" },

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
  ctaBtnPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  statsBar: {
    height: 46,
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

// src/components/providerProfile/ProfileHeader.jsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AVATAR_COLORS, SERVICES } from "../../constants/services";
import { colors } from "../../theme";

export default function ProfileHeader({
  provider,
  isFav,
  onBack,
  onToggleFav,
  onShare,
  onMore,
  onContact,
}) {
  const initials = (provider?.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarColor = AVATAR_COLORS[provider?.services?.[0]] || colors.primary;
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
    <View style={styles.header}>
      <View style={styles.topFrame}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
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
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={18} color="#9FE1CB" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onMore}
              activeOpacity={0.8}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#9FE1CB" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.avatarRow}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {provider?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.name}>{provider?.displayName}</Text>
          {serviceLabels ? (
            <Text style={styles.services} numberOfLines={1}>
              {serviceLabels}
            </Text>
          ) : null}
          <Text style={styles.phone}>
            📍 {provider?.quartier || "Douala"} · Disponible maintenant
          </Text>
        </View>
      </View>

      <View style={styles.contactFrame}>
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={onContact}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble" size={16} color="#fff" />
          <Text style={styles.contactText}>Solliciter un service</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsFrame}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    zIndex: 10,
  },
  topFrame: {
    marginBottom: 14,
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
  avatarWrap: { position: "relative", flexShrink: 0 },
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
  infoBlock: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  services: { fontSize: 11, color: "#5DCAA5", fontWeight: "600" },
  phone: { fontSize: 11, color: "rgba(255,255,255,.4)" },
  contactFrame: {
    marginTop: 14,
  },
  contactBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  contactText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  statsFrame: {
    marginTop: 14,
  },
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

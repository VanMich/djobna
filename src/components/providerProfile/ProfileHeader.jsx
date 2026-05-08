// src/components/providerProfile/ProfileHeader.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AVATAR_COLORS } from "../../constants/services";
import { colors } from "../../theme";

export default function ProfileHeader({
  provider,
  isFav,
  onBack,
  onToggleFav,
  onShare,
  onMore,
  onContact,
  topBarOpacity,
  topBarTranslateY,
  statsOpacity,
  statsMaxHeight,
  headerPaddingTop,
}) {
  const initials = (provider?.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarColor = AVATAR_COLORS[provider?.services?.[0]] || colors.primary;

  return (
    <Animated.View style={[styles.header, { paddingTop: headerPaddingTop }]}>
      {/* Ligne 1 : Retour + 3 points (animée) */}
      <Animated.View
        style={[
          styles.topBar,
          {
            opacity: topBarOpacity,
            transform: [{ translateY: topBarTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color="#5DCAA5" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onMore}
          activeOpacity={0.8}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#9FE1CB" />
        </TouchableOpacity>
      </Animated.View>

      {/* Ligne 2 : Avatar + Infos (toujours visible) */}
      <View style={styles.profileRow}>
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
        <View style={styles.profileInfos}>
          <Text style={styles.providerName}>{provider?.displayName}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Disponible maintenant</Text>
          </View>
          <Text style={styles.locationText}>
            📍 {provider?.quartier || "Douala"}
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnContact]}
              onPress={onContact}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={14} color="#5DCAA5" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, isFav && styles.actionBtnFavActive]}
              onPress={onToggleFav}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={14}
                color={isFav ? "#F5A623" : "#9FE1CB"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={14} color="#9FE1CB" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats bar (animée) */}
      <Animated.View
        style={[
          styles.statsBar,
          { opacity: statsOpacity, maxHeight: statsMaxHeight },
        ]}
      >
        {[
          { value: `${provider?.rating?.toFixed(1) || "–"}⭐`, label: "Note" },
          { value: provider?.reviewCount || 0, label: "Avis" },
          { value: provider?.completedJobs || 0, label: "Missions" },
          { value: "2 ans", label: "Expérience" },
        ].map((item, i, arr) => (
          <View
            key={item.label}
            style={[
              styles.statItem,
              i === arr.length - 1 && styles.statItemLast,
            ]}
          >
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.background, zIndex: 10 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  backText: { fontSize: 12, fontWeight: "600", color: "#5DCAA5" },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: "flex-start",
  },
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
  profileInfos: { flex: 1, gap: 4, paddingTop: 2 },
  providerName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  statusText: { fontSize: 11, color: "#9FE1CB" },
  locationText: { fontSize: 11, color: "rgba(255,255,255,.4)" },
  actionsRow: { flexDirection: "row", gap: 7, marginTop: 4 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnContact: {
    backgroundColor: "rgba(29,158,117,.3)",
    borderColor: "rgba(29,158,117,.4)",
  },
  actionBtnFavActive: {
    backgroundColor: "rgba(245,166,35,.15)",
    borderColor: "rgba(245,166,35,.3)",
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(29,158,117,.18)",
    borderTopWidth: 1,
    borderTopColor: "rgba(29,158,117,.15)",
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
    borderRightWidth: 1,
    borderRightColor: "rgba(29,158,117,.2)",
  },
  statItemLast: { borderRightWidth: 0 },
  statValue: { fontSize: 14, fontWeight: "800", color: "#5DCAA5" },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(29,158,117,.7)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});

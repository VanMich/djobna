// src/components/providerProfile/ProfileHeader.js
import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export default function ProfileHeader({
  provider,
  isFav,
  onBack,
  onToggleFav,
  onShare,
  onMore,
  onContact,
  // Valeurs animées passées depuis le screen parent
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

  const avatarColors = {
    mechanic: "#1D9E75",
    electrician: "#3C3489",
    plumber: "#185FA5",
    barber: "#BA7517",
    painter: "#993C1D",
  };
  const avatarColor = avatarColors[provider?.services?.[0]] || colors.primary;

  return (
    <Animated.View
      style={[
        styles.header,
        { paddingTop: headerPaddingTop },
        // paddingTop animé → le header rétrécit quand les éléments disparaissent
      ]}
    >
      {/* ── Ligne 1 : Retour + 3 points (animée) ── */}
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

      {/* ── Ligne 2 : Avatar + Infos (toujours visible) ── */}
      <View style={styles.profileRow}>
        {/* Avatar */}
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

        {/* Infos */}
        <View style={styles.profileInfos}>
          <Text style={styles.providerName}>{provider?.displayName}</Text>

          {/* Statut disponible */}
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Disponible maintenant</Text>
          </View>

          {/* Localisation */}
          <Text style={styles.locationText}>
            📍 {provider?.quartier || "Douala"}
          </Text>

          {/* ── Actions icônes (toujours visibles) ── */}
          <View style={styles.actionsRow}>
            {/* Contact */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnContact]}
              onPress={onContact}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={14} color="#5DCAA5" />
            </TouchableOpacity>

            {/* Favori */}
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

            {/* Partager */}
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

      {/* ── Stats bar (animée) ── */}
      <Animated.View
        style={[
          styles.statsBar,
          {
            opacity: statsOpacity,
            maxHeight: statsMaxHeight,
            // maxHeight animée → la stats bar se rétracte proprement
          },
        ]}
      >
        <StatItem
          value={`${provider?.rating?.toFixed(1) || "–"}⭐`}
          label="Note"
        />
        <StatItem value={provider?.reviewCount || 0} label="Avis" />
        <StatItem value={provider?.completedJobs || 0} label="Missions" />
        <StatItem value="2 ans" label="Expérience" />
      </Animated.View>
    </Animated.View>
  );
}

// ── Composant stat individuel ──────────────────
function StatItem({ value, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    // paddingTop animé depuis le parent
    paddingBottom: 0,
    zIndex: 10,
  },

  // Ligne retour + 3 points
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    // overflow: 'hidden' non nécessaire ici
    // l'animation opacity + translateY suffit
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  backText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5DCAA5",
  },
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

  // Ligne avatar + infos
  profileRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: "flex-start",
  },

  // Avatar
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

  // Infos
  profileInfos: { flex: 1, gap: 4, paddingTop: 2 },
  providerName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  statusText: { fontSize: 11, color: "#9FE1CB" },
  locationText: { fontSize: 11, color: "rgba(255,255,255,.4)" },

  // Actions icônes
  actionsRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 4,
  },
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

  // Stats bar
  statsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(29,158,117,.18)",
    borderTopWidth: 1,
    borderTopColor: "rgba(29,158,117,.15)",
    overflow: "hidden",
    // overflow: hidden → la stats bar se cache proprement
    // quand maxHeight passe à 0
  },
  statItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
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

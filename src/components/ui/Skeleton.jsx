import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { colors, radius } from "../../theme";

/**
 * Skeleton shimmer loader — Uber/Yango style
 * Usage: <Skeleton width={120} height={16} />
 *        <Skeleton circle size={48} />
 *        <Skeleton width="100%" height={200} radius={16} />
 */
export default function Skeleton({ width, height, circle, size, radius: r, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  const w = circle ? size || 48 : width || "100%";
  const h = circle ? size || 48 : height || 16;
  const br = circle ? (size || 48) / 2 : r !== undefined ? r : radius.sm;

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: br,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Pre-built skeleton layouts
 */
export function SkeletonCard({ style }) {
  return (
    <View style={[s.cardWrap, style]}>
      <View style={s.card}>
        {/* Avatar */}
        <Skeleton width={54} height={54} radius={18} />
        {/* Body */}
        <View style={s.cardBody}>
          <Skeleton width={130} height={14} radius={6} />
          <Skeleton width={170} height={11} radius={5} />
          <View style={s.cardFooterRow}>
            <Skeleton width={60} height={20} radius={6} />
            <Skeleton width={80} height={20} radius={6} />
          </View>
        </View>
        {/* Chevron */}
        <Skeleton width={16} height={16} radius={4} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3, style }) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonConversation({ style }) {
  return (
    <View style={[s.convRow, style]}>
      <Skeleton circle size={52} />
      <View style={s.convLines}>
        <Skeleton width={120} height={14} />
        <Skeleton width={180} height={11} />
      </View>
      <Skeleton width={36} height={10} />
    </View>
  );
}

export function SkeletonConversationList({ count = 5 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonConversation key={i} />
      ))}
    </View>
  );
}

/**
 * Skeleton pour des bulles de chat (loading state du ChatScreen)
 * Alterne bulles gauche/droite pour simuler une conversation
 */
export function SkeletonChatBubbles() {
  const bubbles = [
    { align: "flex-start", w1: 180, w2: 120 },
    { align: "flex-end", w1: 150, w2: 0 },
    { align: "flex-start", w1: 200, w2: 90 },
    { align: "flex-end", w1: 170, w2: 100 },
    { align: "flex-start", w1: 140, w2: 0 },
    { align: "flex-end", w1: 190, w2: 80 },
  ];

  return (
    <View style={s.chatSkeletonWrap}>
      {bubbles.map((b, i) => (
        <View key={i} style={[s.chatBubbleSkeleton, { alignSelf: b.align }]}>
          <Skeleton width={b.w1} height={12} radius={6} />
          {b.w2 > 0 && <Skeleton width={b.w2} height={12} radius={6} style={{ marginTop: 6 }} />}
          <Skeleton width={40} height={8} radius={4} style={{ marginTop: 6, alignSelf: "flex-end" }} />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton profil propre (client & prestataire)
 * Affiché sous la topBar fixe — ne contient que le body (avatar + stats + menu)
 */
export function SkeletonProfileOwn({ statCount = 3 }) {
  return (
    <View style={s.profileBodyFull}>
      {/* Header body (avatar + infos + stats) */}
      <View style={s.profileHeaderBody}>
        <View style={s.profileAvatarRow}>
          <Skeleton width={64} height={64} radius={20} />
          <View style={s.profileInfoLines}>
            <Skeleton width={140} height={16} radius={8} />
            <Skeleton width={110} height={11} radius={6} />
            <Skeleton width={80} height={11} radius={6} />
          </View>
        </View>
        <View style={s.profileStatsBar}>
          {Array.from({ length: statCount }).map((_, i) => (
            <View key={i} style={s.profileStatItem}>
              <Skeleton width={32} height={14} radius={6} />
              <Skeleton width={44} height={8} radius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Blocs menu */}
      <View style={s.profileBody}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={s.profileMenuBlock}>
            <Skeleton width={100} height={10} radius={4} style={{ marginBottom: 10, marginLeft: 4 }} />
            {[0, 1].map((j) => (
              <View key={j} style={s.profileMenuItem}>
                <Skeleton width={40} height={40} radius={12} />
                <View style={s.profileMenuLines}>
                  <Skeleton width={130 + j * 20} height={13} radius={6} />
                  <Skeleton width={90 + j * 30} height={10} radius={5} />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton profil public prestataire
 * Affiché sous la topBar fixe — ne contient que le body (avatar + CTA + stats + tabs + contenu)
 */
export function SkeletonProfilePublic() {
  return (
    <View style={s.profileBodyFull}>
      {/* Header body (avatar + infos + CTA + stats) */}
      <View style={s.profileHeaderBody}>
        <View style={s.profileAvatarRow}>
          <Skeleton width={64} height={64} radius={20} />
          <View style={s.profileInfoLines}>
            <Skeleton width={150} height={16} radius={8} />
            <Skeleton width={180} height={11} radius={6} />
            <Skeleton width={100} height={11} radius={6} />
          </View>
        </View>
        {/* CTA */}
        <Skeleton width="100%" height={44} radius={13} />
        {/* Stats */}
        <View style={s.profileStatsBar}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={s.profileStatItem}>
              <Skeleton width={32} height={14} radius={6} />
              <Skeleton width={44} height={8} radius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Tabs placeholder */}
      <View style={s.profileTabsRow}>
        <Skeleton width={70} height={12} radius={6} />
        <Skeleton width={70} height={12} radius={6} />
        <Skeleton width={70} height={12} radius={6} />
      </View>

      {/* Body content */}
      <View style={s.profileBody}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={s.profileMenuBlock}>
            <Skeleton width={100} height={10} radius={4} style={{ marginBottom: 10, marginLeft: 4 }} />
            <View style={s.profileMenuItem}>
              <Skeleton width={40} height={40} radius={12} />
              <View style={s.profileMenuLines}>
                <Skeleton width={160} height={13} radius={6} />
                <Skeleton width={120} height={10} radius={5} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton pour la page d'accueil prestataire (HomeProviderScreen)
 * Reproduit : toggle dispo + grille 2×2 stats + 2 request cards
 */
export function SkeletonProviderHome() {
  return (
    <View style={s.providerHome}>
      {/* Toggle disponibilité */}
      <View style={s.phToggle}>
        <View style={s.phToggleLines}>
          <Skeleton width={150} height={14} radius={6} />
          <Skeleton width={220} height={10} radius={5} />
        </View>
        <Skeleton width={48} height={28} radius={14} />
      </View>

      {/* Grille stats 2×2 */}
      <View style={s.phStatsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={s.phStatCard}>
            <Skeleton width={36} height={36} radius={10} />
            <Skeleton width={40} height={20} radius={6} style={{ marginTop: 6 }} />
            <Skeleton width={70} height={8} radius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Section titre */}
      <View style={s.phSectionHeader}>
        <Skeleton width={140} height={14} radius={6} />
        <Skeleton width={20} height={20} radius={10} />
      </View>

      {/* Request card skeleton 1 */}
      <View style={s.phRequestCard}>
        <View style={s.phRequestTop}>
          <Skeleton width={40} height={40} radius={12} />
          <View style={s.phRequestInfo}>
            <Skeleton width={110} height={13} radius={6} />
            <Skeleton width={150} height={10} radius={5} />
          </View>
          <Skeleton width={50} height={20} radius={10} />
        </View>
        <Skeleton width={100} height={22} radius={11} />
        <Skeleton width="100%" height={36} radius={8} />
        <View style={s.phRequestActions}>
          <Skeleton width="48%" height={40} radius={11} />
          <Skeleton width="48%" height={40} radius={11} />
        </View>
      </View>

      {/* Request card skeleton 2 */}
      <View style={s.phRequestCard}>
        <View style={s.phRequestTop}>
          <Skeleton width={40} height={40} radius={12} />
          <View style={s.phRequestInfo}>
            <Skeleton width={90} height={13} radius={6} />
            <Skeleton width={130} height={10} radius={5} />
          </View>
          <Skeleton width={50} height={20} radius={10} />
        </View>
        <Skeleton width={120} height={22} radius={11} />
        <Skeleton width="100%" height={36} radius={8} />
        <View style={s.phRequestActions}>
          <Skeleton width="48%" height={40} radius={11} />
          <Skeleton width="48%" height={40} radius={11} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  cardWrap: { paddingHorizontal: 20, marginBottom: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: colors.ink100,
  },
  cardBody: { flex: 1, gap: 6 },
  cardFooterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  convLines: { flex: 1, gap: 8 },
  chatSkeletonWrap: { flex: 1, paddingHorizontal: 14, paddingVertical: 16, gap: 14 },
  chatBubbleSkeleton: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 16,
    padding: 14,
    maxWidth: "75%",
  },
  // ── Profil skeletons ──
  profileBodyFull: { flex: 1, backgroundColor: colors.background },
  profileHeaderBody: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    gap: 14,
  },
  profileAvatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileInfoLines: { flex: 1, gap: 8 },
  profileStatsBar: {
    flexDirection: "row",
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.green200,
    overflow: "hidden",
    paddingVertical: 10,
  },
  profileStatItem: { flex: 1, alignItems: "center", gap: 4 },
  profileTabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  profileBody: { backgroundColor: colors.background, padding: 12, gap: 14, flex: 1 },
  profileMenuBlock: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  profileMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  profileMenuLines: { flex: 1, gap: 6 },
  // ── Provider Home skeleton ──
  providerHome: { padding: 16, gap: 16 },
  phToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.ink50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.ink100,
  },
  phToggleLines: { flex: 1, gap: 6 },
  phStatsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  phStatCard: {
    width: "47.5%",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.ink100,
  },
  phSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  phRequestCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.ink100,
  },
  phRequestTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  phRequestInfo: { flex: 1, gap: 5 },
  phRequestActions: { flexDirection: "row", justifyContent: "space-between" },
});

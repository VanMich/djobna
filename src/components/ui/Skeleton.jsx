import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, SafeAreaView } from "react-native";
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
    <View style={[s.card, style]}>
      <View style={s.cardRow}>
        <Skeleton circle size={48} />
        <View style={s.cardLines}>
          <Skeleton width={140} height={14} />
          <Skeleton width={90} height={11} />
        </View>
      </View>
      <Skeleton width="100%" height={12} style={{ marginTop: 14 }} />
      <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonList({ count = 3, style }) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={{ marginBottom: 12 }} />
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
 * Skeleton sur fond sombre (headers dark) — shimmer blanc translucide
 */
function DarkSkeleton({ width, height, circle, size, radius: r, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] });
  const w = circle ? size || 48 : width || "100%";
  const h = circle ? size || 48 : height || 16;
  const br = circle ? (size || 48) / 2 : r !== undefined ? r : radius.sm;
  return (
    <Animated.View style={[{ width: w, height: h, borderRadius: br, backgroundColor: "#fff", opacity }, style]} />
  );
}

/**
 * Skeleton profil propre (client & prestataire) — fond sombre
 * Reproduit : titre + avatar 64px + nom/infos + barre stats + blocs menu
 */
export function SkeletonProfileOwn({ statCount = 3 }) {
  return (
    <View style={s.profileRoot}>
      {/* Header sombre — SafeAreaView pour respecter le notch */}
      <SafeAreaView style={s.profileSafe}>
      <View style={s.profileHeader}>
        {/* Titre + settings */}
        <View style={s.profileTopRow}>
          <DarkSkeleton width={120} height={20} radius={8} />
          <DarkSkeleton width={40} height={40} radius={12} />
        </View>
        {/* Avatar + infos */}
        <View style={s.profileAvatarRow}>
          <DarkSkeleton width={64} height={64} radius={20} />
          <View style={s.profileInfoLines}>
            <DarkSkeleton width={140} height={16} radius={8} />
            <DarkSkeleton width={110} height={11} radius={6} />
            <DarkSkeleton width={80} height={11} radius={6} />
          </View>
        </View>
        {/* Stats */}
        <View style={s.profileStatsBar}>
          {Array.from({ length: statCount }).map((_, i) => (
            <View key={i} style={s.profileStatItem}>
              <DarkSkeleton width={32} height={14} radius={6} />
              <DarkSkeleton width={44} height={8} radius={4} />
            </View>
          ))}
        </View>
      </View>
      </SafeAreaView>
      {/* Body — blocs menu en clair */}
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
 * Skeleton profil public prestataire — fond sombre
 * Reproduit : back + actions + avatar + nom + CTA + stats + tabs + contenu
 */
export function SkeletonProfilePublic() {
  return (
    <View style={s.profileRoot}>
      {/* Header sombre — SafeAreaView pour respecter le notch */}
      <SafeAreaView style={s.profileSafe}>
      <View style={s.profileHeader}>
        {/* Back + actions */}
        <View style={s.profileTopRow}>
          <DarkSkeleton width={40} height={40} radius={12} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <DarkSkeleton width={40} height={40} radius={12} />
            <DarkSkeleton width={40} height={40} radius={12} />
            <DarkSkeleton width={40} height={40} radius={12} />
          </View>
        </View>
        {/* Avatar + infos */}
        <View style={s.profileAvatarRow}>
          <DarkSkeleton width={64} height={64} radius={20} />
          <View style={s.profileInfoLines}>
            <DarkSkeleton width={150} height={16} radius={8} />
            <DarkSkeleton width={180} height={11} radius={6} />
            <DarkSkeleton width={100} height={11} radius={6} />
          </View>
        </View>
        {/* CTA */}
        <DarkSkeleton width="100%" height={44} radius={13} />
        {/* Stats */}
        <View style={s.profileStatsBar}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={s.profileStatItem}>
              <DarkSkeleton width={32} height={14} radius={6} />
              <DarkSkeleton width={44} height={8} radius={4} />
            </View>
          ))}
        </View>
      </View>
      </SafeAreaView>
      {/* Tabs placeholder */}
      <View style={s.profileTabsRow}>
        <Skeleton width={70} height={12} radius={6} />
        <Skeleton width={70} height={12} radius={6} />
        <Skeleton width={70} height={12} radius={6} />
      </View>
      {/* Body */}
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

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardLines: { flex: 1, gap: 8 },
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
  profileRoot: { flex: 1 },
  profileSafe: { backgroundColor: colors.headerBg },
  profileHeader: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    gap: 14,
  },
  profileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileAvatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileInfoLines: { flex: 1, gap: 8 },
  profileStatsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(29,158,117,0.18)",
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 10,
  },
  profileStatItem: { flex: 1, alignItems: "center", gap: 4 },
  profileTabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    backgroundColor: "#F4F6F5",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  profileBody: { backgroundColor: "#F4F6F5", padding: 12, gap: 14, flex: 1 },
  profileMenuBlock: {
    backgroundColor: "#fff",
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
});

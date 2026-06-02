import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SERVICES } from "../constants/services";
import { useMyRequests } from "../hooks/useMyRequests";
import Icon from "../components/ui/Icon";
import ErrorState from "../components/ui/ErrorState";
import { MissionProgress } from "../components/tracking/MissionTimeline";
import { colors, radius, spacing, shadows, fonts } from "../theme";

const STATUS_CONFIG = {
  pending: { label: "En attente", bg: colors.mangoSoft, color: colors.mangoDark, border: colors.mango },
  in_progress: { label: "En cours", bg: colors.infoLight, color: colors.info, border: colors.infoBorder },
  completed: { label: "Terminée", bg: colors.successSoft, color: colors.primary, border: colors.successBorder },
  declined: { label: "Refusée", bg: colors.errorLight, color: colors.error, border: colors.errorBorder },
};

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyRequestsScreen({ navigation }) {
  const { requests, loading, error, refetch } = useMyRequests();

  const handlePress = (req) => {
    if (req.status === "in_progress" || req.status === "completed") {
      navigation.navigate("Chat", {
        providerId: req.providerId,
        providerName: req.providerName,
        requestId: req.id,
      });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={20} color={colors.ink700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes demandes</Text>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          requests.map((req, index) => (
            <RequestCard
              key={req.id}
              request={req}
              index={index}
              onPress={() => handlePress(req)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function RequestCard({ request, index, onPress }) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 60,
      useNativeDriver: true,
      tension: 80,
      friction: 11,
    }).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300 }).start();

  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const serviceInfo = SERVICES.find((s) => s.id === request.service);
  const initials = (request.providerName || "??")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isClickable = request.status === "in_progress";

  const opacity = anim;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <Animated.View style={[styles.cardWrap, { opacity, transform: [{ translateY }, { scale }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={isClickable ? onPressIn : undefined}
        onPressOut={isClickable ? onPressOut : undefined}
        activeOpacity={isClickable ? 1 : 0.9}
        disabled={!isClickable}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.providerName} numberOfLines={1}>
              {request.providerName || "Pro"}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {serviceInfo?.icon && <Icon name={serviceInfo.icon} size={14} color={colors.primary} weight="duotone" />}
            <Text style={styles.serviceLabel} numberOfLines={1}>
              {serviceInfo?.label || request.service}
              {request.title ? ` — ${request.title}` : ""}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.datePill}>
              <Icon name="calendar-outline" size={11} color={colors.textGray} />
              <Text style={styles.dateText}>{formatDate(request.createdAt)}</Text>
            </View>
            {isClickable && (
              <View style={styles.chatHint}>
                <Icon name="chatbubble-outline" size={11} color={colors.primary} />
                <Text style={styles.chatHintText}>Ouvrir le chat</Text>
              </View>
            )}
          </View>

          <MissionProgress
            status={request.status}
            devisAccepted={request.devisAccepted}
            style={styles.progress}
          />
        </View>

        {isClickable && (
          <Icon name="chevron-forward" size={16} color={colors.ink100} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%", marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: "40%", marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
}

function SkeletonList() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
    </View>
  );
}

function EmptyState() {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 700, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.empty}>
      <Animated.View style={[{ transform: [{ translateY: bounce }] }]}>
        <Icon name="tray-arrow-down" size={52} color={colors.ink300} weight="duotone" />
      </Animated.View>
      <Text style={styles.emptyTitle}>Aucune demande pour le moment</Text>
      <Text style={styles.emptySub}>
        Tes demandes de services apparaîtront ici une fois envoyées.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerSafe: { backgroundColor: colors.headerBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.ink50, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.headerText },

  body: { flex: 1, backgroundColor: colors.surface },
  bodyContent: { padding: spacing.md, paddingBottom: 40, gap: 10 },

  cardWrap: { marginBottom: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.textInverse },

  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  providerName: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary, flex: 1 },
  statusBadge: {
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontFamily: fonts.bold },

  serviceLabel: { fontSize: 12, color: colors.textSecondary },

  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: { fontSize: 11, color: colors.textGray },
  chatHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.green100,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  chatHintText: { fontSize: 10, fontFamily: fonts.semiBold, color: colors.primary },
  progress: { marginTop: 8 },

  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    gap: 13,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  skeletonAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.skeleton },
  skeletonBody: { flex: 1, justifyContent: "center" },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: colors.skeleton, width: "80%" },

  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.ink700 },
  emptySub: { fontSize: 13, color: colors.ink500, textAlign: "center", lineHeight: 20, paddingHorizontal: 30 },
});

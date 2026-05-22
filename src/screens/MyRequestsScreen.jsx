import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SERVICES } from "../constants/services";
import { useMyRequests } from "../hooks/useMyRequests";
import { colors, radius, spacing } from "../theme";

const STATUS_CONFIG = {
  pending: { label: "En attente", bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
  in_progress: { label: "En cours", bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD" },
  completed: { label: "Terminée", bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
  declined: { label: "Refusée", bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
};

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyRequestsScreen({ navigation }) {
  const { requests, loading } = useMyRequests();

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
      <StatusBar style="light" />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
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
              {request.providerName || "Prestataire"}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <Text style={styles.serviceLabel} numberOfLines={1}>
            {serviceInfo?.icon} {serviceInfo?.label || request.service}
            {request.title ? ` — ${request.title}` : ""}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.datePill}>
              <Ionicons name="calendar-outline" size={11} color={colors.textGray} />
              <Text style={styles.dateText}>{formatDate(request.createdAt)}</Text>
            </View>
            {isClickable && (
              <View style={styles.chatHint}>
                <Ionicons name="chatbubble-outline" size={11} color={colors.primary} />
                <Text style={styles.chatHintText}>Ouvrir le chat</Text>
              </View>
            )}
          </View>
        </View>

        {isClickable && (
          <Ionicons name="chevron-forward" size={16} color="#DDD" />
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
      <Animated.Text style={[styles.emptyIcon, { transform: [{ translateY: bounce }] }]}>
        {"📭"}
      </Animated.Text>
      <Text style={styles.emptyTitle}>Aucune demande pour le moment</Text>
      <Text style={styles.emptySub}>
        Vos demandes de services apparaîtront ici une fois envoyées.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

  body: { flex: 1, backgroundColor: "#F2F4F3" },
  bodyContent: { padding: spacing.md, paddingBottom: 40, gap: 10 },

  cardWrap: { marginBottom: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  providerName: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1 },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: "700" },

  serviceLabel: { fontSize: 12, color: "#888" },

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
  chatHintText: { fontSize: 10, fontWeight: "600", color: colors.primary },

  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    gap: 13,
    borderWidth: 1,
    borderColor: "#EEF0EF",
  },
  skeletonAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#E8E8E8" },
  skeletonBody: { flex: 1, justifyContent: "center" },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: "#E8E8E8", width: "80%" },

  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#333" },
  emptySub: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 20, paddingHorizontal: 30 },
});

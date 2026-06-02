// src/screens/HomeProviderScreen.jsx
import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useProviderDashboard } from "../hooks/useProviderDashboard";
import { supabase } from "../config/supabase";
import ProviderHeader from "../components/homeProvider/ProviderHeader";
import AvailabilityToggle from "../components/homeProvider/AvailabilityToggle";
import StatsBar from "../components/homeProvider/StatsBar";
import RequestCard from "../components/homeProvider/RequestCard";
import MissionCard from "../components/homeProvider/MissionCard";
import Icon from "../components/ui/Icon";
import { SkeletonProviderHome } from "../components/ui";
import { colors, fonts, shadows } from "../theme";

// ─── Bandeau Premium ─────────────────────────────────────────────────────────
function PremiumBanner({ subscription }) {
  if (!subscription || subscription.plan !== "premium") return null;

  const now = Date.now();
  const expiresAt = subscription.expiresAt
    ? new Date(subscription.expiresAt).getTime()
    : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
    : null;

  if (expiresAt && expiresAt < now) {
    return (
      <View style={[bannerStyles.banner, bannerStyles.expired]}>
        <Icon name="alert-triangle" size={16} color="#92600A" />
        <Text style={bannerStyles.expiredText}>
          Ton abonnement Premium a expiré. Renouvelle pour rester visible.
        </Text>
      </View>
    );
  }

  if (!subscription.trialUsed && daysLeft !== null) {
    return (
      <View style={[bannerStyles.banner, bannerStyles.trial]}>
        <Icon name="gift" size={16} color={colors.primaryDark} />
        <Text style={bannerStyles.trialText}>
          Essai Premium — encore{" "}
          <Text style={{ fontFamily: fonts.extraBold }}>{daysLeft} jour{daysLeft > 1 ? "s" : ""}</Text>{" "}
          offert{daysLeft > 1 ? "s" : ""}
        </Text>
      </View>
    );
  }

  if (daysLeft !== null && daysLeft > 0) {
    return (
      <View style={[bannerStyles.banner, bannerStyles.active]}>
        <Icon name="star" size={14} color={colors.primary} />
        <Text style={bannerStyles.activeText}>
          Premium actif · renouvellement dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}
        </Text>
      </View>
    );
  }

  return null;
}

// ─── Écran principal ─────────────────────────────────────────────────────────
export default function HomeProviderScreen({ navigation }) {
  const {
    provider,
    isAvailable,
    requests,
    missions,
    completedMissions,
    stats,
    loading,
    toggleAvailability,
    acceptRequest,
    declineRequest,
    completeRequest,
  } = useProviderDashboard();

  const handleAccept = useCallback(
    async (requestId, clientId, clientName) => {
      const result = await acceptRequest(requestId, clientId);
      if (result.success) {
        navigation.navigate("Chat", { clientId, clientName, requestId, chatId: result.chatId });
      } else {
        Alert.alert("Erreur", "Impossible d'accepter la demande. Réessaye.");
      }
    },
    [acceptRequest, navigation],
  );

  const handleProposeOtherTime = useCallback(
    async (requestId, clientId, clientName) => {
      try {
        const now = new Date().toISOString();
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const { data: chatRow, error } = await supabase
          .from("chats")
          .upsert({
            provider_id: user.id,
            client_id: clientId,
            request_id: requestId,
            last_message: "📅 Proposition d'un autre créneau",
            last_message_at: now,
          }, { onConflict: "request_id" })
          .select("id")
          .single();

        if (error) throw error;
        navigation.navigate("Chat", { clientId, clientName, requestId, chatId: chatRow.id });
      } catch (err) {
        console.error("Erreur ouverture chat:", err);
        Alert.alert("Erreur", "Impossible d'ouvrir le chat. Réessaye.");
      }
    },
    [navigation],
  );

  const handleDecline = useCallback(
    async (requestId, clientId) => {
      const result = await declineRequest(requestId, clientId);
      if (!result.success) {
        Alert.alert("Erreur", "Impossible de décliner. Réessaye.");
      }
    },
    [declineRequest],
  );

  const handleComplete = useCallback(
    async (requestId, clientId) => {
      const result = await completeRequest(requestId, clientId);
      if (!result.success) {
        Alert.alert("Erreur", "Impossible de déclarer la fin. Réessaye.");
      }
    },
    [completeRequest],
  );

  const handleViewDetail = useCallback(
    (request) => navigation.navigate("RequestDetail", { request }),
    [navigation],
  );

  const monthRevenue = stats?.monthRevenue || 0;
  const goal = 150000;
  const percent = Math.min(Math.round((monthRevenue / goal) * 100), 100);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Top bar fixe (salutation + cloche) ── */}
      <SafeAreaView style={styles.topBarSafe}>
        <ProviderHeader
          provider={provider}
          requestCount={requests.length}
          onNotif={() => navigation.navigate("Notifications")}
        />
      </SafeAreaView>

      {/* ── Body scrollable ── */}
      {loading ? (
        <SkeletonProviderHome />
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle disponibilité */}
        <AvailabilityToggle
          isAvailable={isAvailable}
          onToggle={toggleAvailability}
          requestCount={requests.length}
        />

        {/* Stats grid 2×2 */}
        <StatsBar stats={stats} isAvailable={isAvailable} />

        {/* Bandeau Premium */}
        <PremiumBanner subscription={provider?.subscription} />

        {/* ── Nouvelles demandes ── */}
        {requests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Nouvelles demandes</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{requests.length}</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.sectionLink}>Tout voir</Text>
              </TouchableOpacity>
            </View>
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onProposeOtherTime={handleProposeOtherTime}
                onViewDetail={() => handleViewDetail(request)}
              />
            ))}
          </View>
        )}

        {/* ── Missions en cours ── */}
        {missions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Missions en cours</Text>
                <View style={[styles.countBadge, styles.countBadgeGreen]}>
                  <Text style={styles.countBadgeText}>{missions.length}</Text>
                </View>
              </View>
            </View>
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onPress={() =>
                  navigation.navigate("Chat", {
                    clientId: mission.clientId,
                    clientName: mission.clientName,
                    requestId: mission.id,
                  })
                }
                onComplete={handleComplete}
              />
            ))}
          </View>
        )}

        {/* ── État vide ── */}
        {requests.length === 0 && missions.length === 0 && isAvailable && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="clock" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>En attente de demandes</Text>
            <Text style={styles.emptySub}>
              Tu es visible sur la carte. Les clients peuvent te contacter.
            </Text>
          </View>
        )}

        {/* ── État hors ligne ── */}
        {!isAvailable && requests.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.ink50 }]}>
              <Icon name="wifi-off" size={32} color={colors.ink300} />
            </View>
            <Text style={styles.emptyTitle}>Tu es hors ligne</Text>
            <Text style={styles.emptySub}>
              Active ta disponibilité pour recevoir des demandes de clients.
            </Text>
          </View>
        )}

        {/* ── Missions terminées aujourd'hui ── */}
        {completedMissions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Terminées aujourd'hui</Text>
                <View style={[styles.countBadge, styles.countBadgeGreen]}>
                  <Text style={styles.countBadgeText}>{completedMissions.length}</Text>
                </View>
              </View>
            </View>
            {completedMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onPress={() =>
                  navigation.navigate("Chat", {
                    clientId: mission.clientId,
                    clientName: mission.clientName,
                    requestId: mission.id,
                  })
                }
              />
            ))}
          </View>
        )}

        {/* ── Revenus du mois ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Revenus du mois</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Earnings")}
            >
              <Text style={styles.sectionLink}>Détails</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.revenueCard}>
            <View style={styles.revenueTop}>
              <View>
                <Text style={styles.revenueAmount}>
                  {monthRevenue.toLocaleString("fr-FR")} FCFA
                </Text>
                <Text style={styles.revenueGoal}>
                  Objectif : {goal.toLocaleString("fr-FR")} FCFA
                </Text>
              </View>
              <View style={styles.revenuePercentBadge}>
                <Text style={styles.revenuePercent}>{percent}%</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
          </View>
        </View>

      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBarSafe: { backgroundColor: colors.background, zIndex: 10 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30, gap: 16 },

  // Sections
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.extraBold,
    color: colors.ink900,
    letterSpacing: -0.2,
  },
  sectionLink: { fontSize: 12, fontFamily: fonts.bold, color: colors.primary },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  countBadgeGreen: { backgroundColor: colors.primary },
  countBadgeText: { fontSize: 9, fontFamily: fonts.extraBold, color: colors.textInverse },

  // État vide
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ink100,
    padding: 24,
    ...shadows.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink700 },
  emptySub: { fontSize: 12, color: colors.ink500, textAlign: "center", lineHeight: 18 },

  // Revenue card
  revenueCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.ink100,
    gap: 12,
    ...shadows.sm,
  },
  revenueTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  revenueAmount: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.ink900, letterSpacing: -0.5 },
  revenueGoal: { fontSize: 11, color: colors.ink500, marginTop: 2, fontFamily: fonts.medium },
  revenuePercentBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  revenuePercent: { fontSize: 14, fontFamily: fonts.extraBold, color: colors.primary },
  progressBg: { height: 6, backgroundColor: colors.ink50, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
});

const bannerStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  trial: { backgroundColor: colors.primarySoft, borderColor: colors.green200 },
  trialText: { fontSize: 12, color: colors.primaryDark, flex: 1, lineHeight: 18 },
  expired: { backgroundColor: "#FFF8E8", borderColor: "#F0D49A" },
  expiredText: { fontSize: 12, color: "#92600A", flex: 1, lineHeight: 18 },
  active: { backgroundColor: "rgba(29,158,117,.08)", borderColor: "rgba(29,158,117,.2)" },
  activeText: { fontSize: 11, color: colors.primary, flex: 1 },
});

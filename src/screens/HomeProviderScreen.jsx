// src/screens/HomeProviderScreen.jsx
//
// Dashboard principal du prestataire (§13).
// Sections (de haut en bas) :
//   1. ProviderHeader  — salutation + toggle disponibilité + stats (§13.1)
//   2. Bandeau Premium — compte à rebours essai / alerte expiration / badge actif (§13.2)
//   3. Nouvelles demandes   — requêtes pending à accepter/refuser
//   4. Missions en cours    — requêtes in_progress + bouton "Marquer comme terminée"
//   5. Missions terminées   — récap des missions completed aujourd'hui (§13.1)
//   6. Revenus du mois      — barre de progression vers l'objectif mensuel

import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useProviderDashboard } from "../hooks/useProviderDashboard";
import { supabase } from "../config/supabase";
import ProviderHeader from "../components/homeProvider/ProviderHeader";
import RequestCard from "../components/homeProvider/RequestCard";
import MissionCard from "../components/homeProvider/MissionCard";
import Icon from "../components/ui/Icon";
import { colors } from "../theme";

// ─── Bandeau abonnement Premium (§13.2) ───────────────────────────────────────
// Affiché uniquement si le prestataire a une donnée subscription.
// 3 états : essai en cours / expiré / actif.
function PremiumBanner({ subscription }) {
  // Pas de donnée subscription → on n'affiche rien
  if (!subscription || subscription.plan !== "premium") return null;

  const now = Date.now();
  const expiresAt = subscription.expiresAt
    ? new Date(subscription.expiresAt).getTime()
    : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
    : null;

  // Abonnement expiré
  if (expiresAt && expiresAt < now) {
    return (
      <View style={[bannerStyles.banner, bannerStyles.expired]}>
        <Ionicons name="warning-outline" size={16} color="#92600A" />
        <Text style={bannerStyles.expiredText}>
          Votre abonnement Premium a expiré. Renouvelez pour rester visible.
        </Text>
      </View>
    );
  }

  // Période d'essai (trialUsed = false = essai encore actif)
  if (!subscription.trialUsed && daysLeft !== null) {
    return (
      <View style={[bannerStyles.banner, bannerStyles.trial]}>
        <Ionicons name="gift-outline" size={16} color="#0F6E56" />
        <Text style={bannerStyles.trialText}>
          Essai Premium — encore{" "}
          <Text style={{ fontWeight: "800" }}>{daysLeft} jour{daysLeft > 1 ? "s" : ""}</Text>{" "}
          offert{daysLeft > 1 ? "s" : ""}
        </Text>
      </View>
    );
  }

  // Premium actif — badge discret avec date de renouvellement
  if (daysLeft !== null && daysLeft > 0) {
    return (
      <View style={[bannerStyles.banner, bannerStyles.active]}>
        <Ionicons name="star" size={14} color="#5DCAA5" />
        <Text style={bannerStyles.activeText}>
          Premium actif · renouvellement dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}
        </Text>
      </View>
    );
  }

  return null;
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function HomeProviderScreen({ navigation }) {
  const {
    provider,
    isAvailable,
    requests,
    missions,
    completedMissions,   // missions terminées aujourd'hui (§13.1)
    stats,
    loading,
    toggleAvailability,
    acceptRequest,
    declineRequest,
    completeRequest,     // marquer une mission comme terminée (§13.1)
  } = useProviderDashboard();

  // ── Accepter une demande → naviguer vers le chat ───────────────────────────
  const handleAccept = useCallback(
    async (requestId, clientId, clientName) => {
      const result = await acceptRequest(requestId, clientId);
      if (result.success) {
        navigation.navigate("Chat", { clientId, clientName, requestId, chatId: result.chatId });
      } else {
        Alert.alert("Erreur", "Impossible d'accepter la demande. Réessayez.");
      }
    },
    [acceptRequest, navigation],
  );

  // ── Proposer un autre créneau → ouvrir le chat ────────────────────────────
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
        Alert.alert("Erreur", "Impossible d'ouvrir le chat. Réessayez.");
      }
    },
    [navigation],
  );

  // ── Décliner une demande ──────────────────────────────────────────────────
  const handleDecline = useCallback(
    async (requestId, clientId) => {
      const result = await declineRequest(requestId, clientId);
      if (!result.success) {
        Alert.alert("Erreur", "Impossible de décliner. Réessayez.");
      }
    },
    [declineRequest],
  );

  // ── Marquer une mission comme terminée (§13.1) ────────────────────────────
  const handleComplete = useCallback(
    async (requestId) => {
      const result = await completeRequest(requestId);
      if (!result.success) {
        Alert.alert("Erreur", "Impossible de marquer comme terminée. Réessayez.");
      }
    },
    [completeRequest],
  );

  // ── Ouvrir le détail d'une demande ───────────────────────────────────────
  const handleViewDetail = useCallback(
    (request) => {
      navigation.navigate("RequestDetail", { request });
    },
    [navigation],
  );

  // ── Chargement initial ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Prestataire hors ligne → header + demandes en attente déjà reçues ────
  if (!isAvailable) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <ProviderHeader
          provider={provider}
          isAvailable={false}
          stats={stats}
          requestCount={requests.length}
          onToggle={toggleAvailability}
          onNotif={() => Alert.alert("Notifications", "Fonctionnalité à venir.")}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Demandes reçues avant la mise hors ligne */}
          {requests.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Demandes en attente</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{requests.length}</Text>
                </View>
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
          ) : (
            <View style={styles.offlineBody}>
              <View style={styles.offlineIcon}>
                <Icon name="clock" size={36} color="#AAB0B7" weight="duotone" />
              </View>
              <Text style={styles.offlineTitle}>Vous êtes hors ligne</Text>
              <Text style={styles.offlineSub}>
                Activez votre disponibilité pour recevoir des demandes de clients.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Prestataire disponible → dashboard complet ────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* 1. Header : salutation + toggle + stats */}
      <ProviderHeader
        provider={provider}
        isAvailable={isAvailable}
        stats={stats}
        requestCount={requests.length}
        onToggle={toggleAvailability}
        onNotif={() => Alert.alert("Notifications", "Fonctionnalité à venir.")}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Bandeau abonnement Premium (§13.2) */}
        <PremiumBanner subscription={provider?.subscription} />

        {/* 3. Section : Nouvelles demandes (statut "pending") */}
        {requests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nouvelles demandes</Text>
              {/* Badge compteur de demandes en attente */}
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{requests.length}</Text>
              </View>
            </View>
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onProposeOtherTime={handleProposeOtherTime}
              />
            ))}
          </View>
        )}

        {/* 4. Section : Missions en cours (statut "in_progress") */}
        {missions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Missions en cours</Text>
            </View>
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                // Clic sur la carte → chat avec le client (via requestId)
                onPress={() =>
                  navigation.navigate("Chat", {
                    clientId: mission.clientId,
                    clientName: mission.clientName,
                    requestId: mission.id,
                  })
                }
                // Bouton "Marquer comme terminée" (§13.1)
                onComplete={handleComplete}
              />
            ))}
          </View>
        )}

        {/* ── État vide : en ligne mais aucune activité ── */}
        {requests.length === 0 && missions.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={36} color="#1D9E75" />
            </View>
            <Text style={styles.emptyTitle}>En attente de demandes</Text>
            <Text style={styles.emptySub}>
              Vous êtes visible sur la carte. Les clients peuvent vous contacter.
            </Text>
          </View>
        )}

        {/* 5. Section : Missions terminées aujourd'hui (§13.1 Bloc terminées) */}
        {completedMissions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Terminées aujourd'hui</Text>
              <View style={[styles.countBadge, styles.countBadgeDone]}>
                <Text style={styles.countBadgeText}>{completedMissions.length}</Text>
              </View>
            </View>
            {completedMissions.map((mission) => (
              // MissionCard sans onComplete → le bouton "Marquer comme terminée" est masqué
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
                // Pas de onComplete ici : la mission est déjà terminée
              />
            ))}
          </View>
        )}

        {/* 6. Section : Revenus du mois avec barre de progression */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Revenus du mois</Text>
          </View>
          <View style={styles.revenueCard}>
            <View style={styles.revenueTop}>
              <View>
                <Text style={styles.revenueAmount}>
                  {(stats.monthRevenue || 0).toLocaleString("fr-FR")} FCFA
                </Text>
                {/* Objectif mensuel indicatif — pourra être rendu configurable */}
                <Text style={styles.revenueGoal}>Objectif : 150 000 FCFA</Text>
              </View>
              <Text style={styles.revenuePercent}>
                {Math.min(Math.round((stats.monthRevenue / 150000) * 100), 100)}%
              </Text>
            </View>
            {/* Barre de progression vers l'objectif */}
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      Math.round((stats.monthRevenue / 150000) * 100),
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.headerBg,
  },
  scroll: { flex: 1, backgroundColor: "#F4F6F5" },
  scrollContent: { padding: 12, paddingBottom: 30, gap: 4 },

  // Sections
  section: { gap: 8, marginBottom: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#333" },

  // Badge compteur (rouge = en attente, vert = terminées)
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E24B4A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countBadgeDone: { backgroundColor: "#1D9E75" },
  countBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },

  // État hors ligne
  offlineBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F5",
    padding: 40,
    gap: 14,
  },
  offlineIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  offlineEmoji: { fontSize: 32 },
  offlineTitle: { fontSize: 17, fontWeight: "700", color: "#333", textAlign: "center" },
  offlineSub: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 20 },

  // État vide (en ligne, pas de demande)
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    padding: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F0FAF6",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#333" },
  emptySub: { fontSize: 12, color: "#888", textAlign: "center", lineHeight: 18 },

  // Carte revenus du mois
  revenueCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    gap: 8,
  },
  revenueTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueAmount: { fontSize: 22, fontWeight: "800", color: "#111" },
  revenueGoal: { fontSize: 11, color: "#888", marginTop: 2 },
  revenuePercent: { fontSize: 13, fontWeight: "700", color: colors.primary },
  progressBg: { height: 5, backgroundColor: "#F0F0F0", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, backgroundColor: colors.primary, borderRadius: 3 },
});

// ─── Styles du bandeau Premium ────────────────────────────────────────────────
const bannerStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderWidth: 1,
  },

  // Essai gratuit — fond vert clair
  trial: { backgroundColor: "#F0FAF6", borderColor: "#C8EDDF" },
  trialText: { fontSize: 12, color: "#0F6E56", flex: 1, lineHeight: 18 },

  // Abonnement expiré — fond orange clair
  expired: { backgroundColor: "#FFF8E8", borderColor: "#F0D49A" },
  expiredText: { fontSize: 12, color: "#92600A", flex: 1, lineHeight: 18 },

  // Premium actif — fond sombre discret
  active: { backgroundColor: "rgba(29,158,117,.1)", borderColor: "rgba(29,158,117,.2)" },
  activeText: { fontSize: 11, color: "#5DCAA5", flex: 1 },
});

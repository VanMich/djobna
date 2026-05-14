// src/screens/HomeProviderScreen.js
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
import ProviderHeader from "../components/homeProvider/ProviderHeader";
import RequestCard from "../components/homeProvider/RequestCard";
import MissionCard from "../components/homeProvider/MissionCard";
import { colors } from "../theme";

export default function HomeProviderScreen({ navigation }) {
  const {
    provider,
    isAvailable,
    requests,
    missions,
    stats,
    loading,
    toggleAvailability,
    acceptRequest,
    declineRequest,
  } = useProviderDashboard();

  // ── Accepter une demande ───────────────────
  const handleAccept = useCallback(
    async (requestId, clientId, clientName) => {
      const result = await acceptRequest(requestId, clientId);
      if (result.success) {
        // Naviguer vers le chat avec ce client
        navigation.navigate("Chat", {
          // On navigue côté prestataire donc on passe l'ID du client
          clientId,
          clientName,
        });
      } else {
        Alert.alert("Erreur", "Impossible d'accepter la demande. Réessayez.");
      }
    },
    [acceptRequest, navigation],
  );

  // ── Décliner une demande ───────────────────
  const handleDecline = useCallback(
    async (requestId) => {
      const result = await declineRequest(requestId);
      if (!result.success) {
        Alert.alert("Erreur", "Impossible de décliner. Réessayez.");
      }
    },
    [declineRequest],
  );

  // ── Loader initial ─────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── État hors ligne : écran simplifié ──────
  if (!isAvailable) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <ProviderHeader
          provider={provider}
          isAvailable={false}
          stats={stats}
          requestCount={0}
          onToggle={toggleAvailability}
          onNotif={() => navigation.navigate("Notifications")}
        />
        <View style={styles.offlineBody}>
          <View style={styles.offlineIcon}>
            <Text style={styles.offlineEmoji}>😴</Text>
          </View>
          <Text style={styles.offlineTitle}>Vous êtes hors ligne</Text>
          <Text style={styles.offlineSub}>
            Activez votre disponibilité pour recevoir des demandes de clients.
          </Text>
        </View>
      </View>
    );
  }

  // ── État disponible : dashboard complet ────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header avec toggle + stats */}
      <ProviderHeader
        provider={provider}
        isAvailable={isAvailable}
        stats={stats}
        requestCount={requests.length}
        onToggle={toggleAvailability}
        onNotif={() => navigation.navigate("Notifications")}
      />

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section : Nouvelles demandes ── */}
        {requests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nouvelles demandes</Text>
              {/* Badge compteur */}
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
              />
            ))}
          </View>
        )}

        {/* ── Section : Missions en cours ── */}
        {missions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Missions en cours</Text>
            </View>
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onPress={() =>
                  navigation.navigate("Chat", {
                    clientId: mission.clientId,
                    clientName: mission.clientName,
                  })
                }
              />
            ))}
          </View>
        )}

        {/* ── État vide : disponible mais pas de demande ── */}
        {requests.length === 0 && missions.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={36} color="#1D9E75" />
            </View>
            <Text style={styles.emptyTitle}>En attente de demandes</Text>
            <Text style={styles.emptySub}>
              Vous êtes visible sur la carte. Les clients peuvent vous
              contacter.
            </Text>
          </View>
        )}

        {/* ── Section : Revenus du mois ── */}
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
                <Text style={styles.revenueGoal}>Objectif : 150 000 FCFA</Text>
              </View>
              <Text style={styles.revenuePercent}>
                {Math.min(Math.round((stats.monthRevenue / 150000) * 100), 100)}
                %
              </Text>
            </View>
            {/* Barre de progression */}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  scroll: { flex: 1, backgroundColor: "#F4F6F5" },
  scrollContent: { padding: 12, paddingBottom: 30, gap: 4 },

  section: { gap: 8, marginBottom: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#333" },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E24B4A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },

  // Hors ligne
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
  offlineTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  offlineSub: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },

  // État vide
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
  emptySub: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },

  // Revenus
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
  progressBg: {
    height: 5,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});

// src/screens/RequestDetailScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SERVICES } from "../constants/services";
import { colors } from "../theme";
import { useProviderDashboard } from "../hooks/useProviderDashboard";
import { supabase } from "../config/supabase";

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - (typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function InfoRow({ icon, text }) {
  if (!text) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={15} color={colors.primary} />
      </View>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function RequestDetailScreen({ navigation, route }) {
  const { request } = route.params || {};
  const { acceptRequest, declineRequest } = useProviderDashboard();

  const svc = SERVICES.find((s) => s.id === request?.service);
  const initials = (request?.clientName || "?")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const hasPhotos = request?.photos?.length > 0;
  const hasBudget = request?.budget && Number(request.budget) > 0;

  const handleAccept = useCallback(async () => {
    const result = await acceptRequest(request.id, request.clientId);
    if (result.success) {
      navigation.goBack();
      navigation.navigate("Chat", { clientId: request.clientId, clientName: request.clientName, requestId: request.id, chatId: result.chatId });
    } else {
      Alert.alert("Erreur", "Impossible d'accepter la demande. Réessayez.");
    }
  }, [navigation, acceptRequest, request]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      "Décliner la demande ?",
      "Le client sera informé que vous n'êtes pas disponible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Décliner",
          style: "destructive",
          onPress: async () => {
            const result = await declineRequest(request.id, request.clientId);
            if (result.success) {
              navigation.goBack();
            } else {
              Alert.alert("Erreur", "Impossible de décliner. Réessayez.");
            }
          },
        },
      ],
    );
  }, [navigation, declineRequest, request]);

  const handleProposeOtherTime = useCallback(() => {
    Alert.alert(
      "Proposer un autre créneau",
      "Ouvrir la conversation pour proposer une autre date ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Ouvrir le chat",
          onPress: async () => {
            try {
              const now = new Date().toISOString();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { data: chatRow, error: chatErr } = await supabase
                .from("chats")
                .upsert({
                  provider_id: user.id,
                  client_id: request.clientId,
                  request_id: request.id,
                  last_message: "📅 Proposition d'un autre créneau",
                  last_message_at: now,
                }, { onConflict: "request_id" })
                .select("id")
                .single();

              if (chatErr) throw chatErr;

              navigation.goBack();
              navigation.navigate("Chat", {
                clientId: request.clientId,
                clientName: request.clientName,
                requestId: request.id,
                chatId: chatRow.id,
              });
            } catch (err) {
              console.error("Erreur ouverture chat:", err);
              Alert.alert("Erreur", "Impossible d'ouvrir le chat. Réessayez.");
            }
          },
        },
      ],
    );
  }, [navigation, request]);

  if (!request) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorText}>Demande introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détail de la demande</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Nouveau</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Corps ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Client ── */}
        <View style={styles.clientCard}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>{initials}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{request.clientName || "Client"}</Text>
            <View style={styles.clientMeta}>
              {request.quartier ? (
                <>
                  <Ionicons name="location" size={12} color="#AAB0B7" />
                  <Text style={styles.clientMetaText}>{request.quartier}</Text>
                  <Text style={styles.dot}>·</Text>
                </>
              ) : null}
              <Text style={styles.clientMetaText}>{timeAgo(request.createdAt)}</Text>
            </View>
          </View>
          {svc && (
            <View style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{svc.icon} {svc.label}</Text>
            </View>
          )}
        </View>

        {/* ── Titre ── */}
        {request.title ? (
          <Text style={styles.requestTitle}>{request.title}</Text>
        ) : null}

        {/* ── Description ── */}
        {request.description ? (
          <Section title="Description">
            <View style={styles.descCard}>
              <Text style={styles.descText}>{request.description}</Text>
            </View>
          </Section>
        ) : null}

        {/* ── Infos pratiques ── */}
        {(request.location || request.scheduledDate || hasBudget) ? (
          <Section title="Informations">
            <View style={styles.infoCard}>
              <InfoRow icon="location-outline" text={request.location} />
              <InfoRow icon="calendar-outline" text={formatDate(request.scheduledDate)} />
              {hasBudget ? (
                <InfoRow
                  icon="cash-outline"
                  text={`${Number(request.budget).toLocaleString("fr-FR")} FCFA`}
                />
              ) : null}
            </View>
          </Section>
        ) : null}

        {/* ── Photos ── */}
        {hasPhotos ? (
          <Section title={`Photos jointes (${request.photos.length})`}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosRow}
            >
              {request.photos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
          </Section>
        ) : null}

        {/* Espacement pour le bottom bar */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Actions ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnDecline} onPress={handleDecline} activeOpacity={0.85}>
          <Ionicons name="close" size={16} color="#888" />
          <Text style={styles.btnDeclineText}>Décliner</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPropose} onPress={handleProposeOtherTime} activeOpacity={0.85}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.btnProposeText}>Créneau</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnAccept} onPress={handleAccept} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.btnAcceptText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },

  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#888", fontSize: 14 },

  // Header
  headerSafe: { backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#fff" },
  statusBadge: {
    backgroundColor: "#E8F5F0",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#0F6E56" },

  // Corps
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14 },

  // Client card
  clientCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#185FA5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  clientAvatarText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  clientInfo: { flex: 1, gap: 4 },
  clientName: { fontSize: 15, fontWeight: "700", color: "#111" },
  clientMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  clientMetaText: { fontSize: 12, color: "#AAB0B7" },
  dot: { fontSize: 12, color: "#AAB0B7" },
  serviceChip: {
    backgroundColor: "#F0FAF6",
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#C8EDDF",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  serviceChipText: { fontSize: 11, fontWeight: "700", color: colors.primary },

  // Titre
  requestTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    lineHeight: 28,
    letterSpacing: -0.3,
    paddingHorizontal: 2,
  },

  // Sections
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAB0B7",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 2,
  },

  // Description
  descCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0EF",
  },
  descText: { fontSize: 14, color: "#444", lineHeight: 22 },

  // Infos
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    gap: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F0FAF6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoText: { fontSize: 13, color: "#333", flex: 1, lineHeight: 18 },

  // Photos
  photosRow: { gap: 10, paddingRight: 4 },
  photo: {
    width: 130,
    height: 130,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEF0EF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  btnDecline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  btnDeclineText: { fontSize: 13, fontWeight: "700", color: "#888" },

  btnPropose: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#F0FAF6",
    borderWidth: 1,
    borderColor: "#C8EDDF",
  },
  btnProposeText: { fontSize: 13, fontWeight: "700", color: colors.primary },

  btnAccept: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnAcceptText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});

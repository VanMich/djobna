// src/screens/RequestDetailScreen.jsx
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
import { Avatar, Badge } from "../components/ui";
import Icon from "../components/ui/Icon";
import { colors, radius, shadows, fonts } from "../theme";
import { useProviderDashboard } from "../hooks/useProviderDashboard";
import { supabase } from "../config/supabase";

const STATUS_CONFIG = {
  pending:     { label: "Nouveau",    color: colors.mango, bg: "#FFF8E8" },
  in_progress: { label: "En cours",   color: "#3B82F6", bg: "#EFF6FF" },
  completed:   { label: "Terminée",   color: "#10B981", bg: "#ECFDF5" },
  declined:    { label: "Déclinée",   color: "#9CA3AF", bg: "#F3F4F6" },
  cancelled:   { label: "Annulée",    color: "#EF4444", bg: "#FEF2F2" },
};

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
        <Icon name={icon} size={15} color={colors.primary} />
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

  const hasPhotos = request?.photos?.length > 0;
  const hasBudget = request?.budget && Number(request.budget) > 0;

  const handleAccept = useCallback(async () => {
    const result = await acceptRequest(request.id, request.clientId);
    if (result.success) {
      navigation.goBack();
      navigation.navigate("Chat", { clientId: request.clientId, clientName: request.clientName, requestId: request.id, chatId: result.chatId });
    } else {
      Alert.alert("Erreur", "Impossible d'accepter la demande. Réessaye.");
    }
  }, [navigation, acceptRequest, request]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      "Décliner la demande ?",
      "Le client sera informé que tu n'es pas disponible.",
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
              Alert.alert("Erreur", "Impossible de décliner. Réessaye.");
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
              const { data: { session } } = await supabase.auth.getSession();
              const user = session?.user;
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
              Alert.alert("Erreur", "Impossible d'ouvrir le chat. Réessaye.");
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
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="chevron-back" size={20} color={colors.ink700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détail de la demande</Text>
          {(() => {
            const s = STATUS_CONFIG[request?.status] || STATUS_CONFIG.pending;
            return (
              <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                <Text style={[styles.statusBadgeText, { color: s.color }]}>{s.label}</Text>
              </View>
            );
          })()}
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
          <Avatar
            name={request?.clientName}
            photoURL={request?.clientPhotoURL}
            size={48}
            service={request?.service}
          />
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{request.clientName || "Client"}</Text>
            <View style={styles.clientMeta}>
              {request.quartier ? (
                <>
                  <Icon name="location" size={12} color={colors.ink300} />
                  <Text style={styles.clientMetaText}>{request.quartier}</Text>
                  <Text style={styles.dot}>·</Text>
                </>
              ) : null}
              <Text style={styles.clientMetaText}>{timeAgo(request.createdAt)}</Text>
            </View>
          </View>
          {svc && (
            <View style={styles.serviceChip}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name={svc.icon} size={13} color={colors.primary} weight="duotone" />
                <Text style={styles.serviceChipText}>{svc.label}</Text>
              </View>
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
          <Icon name="close" size={16} color={colors.ink500} />
          <Text style={styles.btnDeclineText}>Décliner</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPropose} onPress={handleProposeOtherTime} activeOpacity={0.85}>
          <Icon name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.btnProposeText}>Créneau</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnAccept} onPress={handleAccept} activeOpacity={0.85}>
          <Icon name="checkmark" size={16} color={colors.textInverse} />
          <Text style={styles.btnAcceptText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },

  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: colors.textSecondary, fontSize: 14 },

  // Header
  headerSafe: { backgroundColor: colors.headerBg },
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
    borderRadius: radius.sm,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: fonts.bold, color: colors.headerText },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: colors.primaryDark },

  // Corps
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14 },

  // Client card
  clientCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  clientInfo: { flex: 1, gap: 4 },
  clientName: { fontSize: 15, fontFamily: fonts.bold, color: colors.textPrimary },
  clientMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  clientMetaText: { fontSize: 12, color: colors.textMuted },
  dot: { fontSize: 12, color: colors.textMuted },
  serviceChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.green200,
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  serviceChipText: { fontSize: 11, fontFamily: fonts.bold, color: colors.primary },

  // Titre
  requestTitle: {
    fontSize: 20,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
    lineHeight: 28,
    letterSpacing: -0.3,
    paddingHorizontal: 2,
  },

  // Sections
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 2,
  },

  // Description
  descCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  descText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

  // Infos
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoText: { fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 18 },

  // Photos
  photosRow: { gap: 10, paddingRight: 4 },
  photo: {
    width: 130,
    height: 130,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.lg,
  },
  btnDecline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDeclineText: { fontSize: 13, fontFamily: fonts.bold, color: colors.textSecondary },

  btnPropose: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.green200,
  },
  btnProposeText: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary },

  btnAccept: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnAcceptText: { fontSize: 13, fontFamily: fonts.bold, color: colors.textInverse },
});

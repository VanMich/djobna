// src/components/homeProvider/RequestCard.jsx
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SERVICES } from "../../constants/services";
import Icon from "../ui/Icon";
import { colors } from "../../theme";

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

function formatDate(isoString) {
  if (!isoString) return "Non précisée";
  const d = new Date(isoString);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function RequestCard({ request, onAccept, onDecline, onProposeOtherTime, onViewDetail }) {
  const initials = (request.clientName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const svc = SERVICES.find((s) => s.id === request.service);

  const handleDecline = () => {
    Alert.alert(
      "Décliner la demande ?",
      "Le client sera informé que vous n'êtes pas disponible.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Décliner", style: "destructive", onPress: () => onDecline(request.id, request.clientId) },
      ],
    );
  };

  const handleProposeOtherTime = () => {
    Alert.alert(
      "Proposer un autre créneau",
      "Ouvrir la conversation pour proposer une autre date ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Ouvrir le chat",
          onPress: () => onProposeOtherTime?.(request.id, request.clientId, request.clientName),
        },
      ],
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onViewDetail} activeOpacity={0.97}>
      {/* ── En-tête : client + badge ── */}
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.clientName}>{request.clientName || "Client"}</Text>
          <View style={styles.metaRow}>
            {request.quartier ? (
              <>
                <Ionicons name="location" size={10} color="#AAB0B7" />
                <Text style={styles.metaText}>{request.quartier}</Text>
                <Text style={styles.metaDot}>·</Text>
              </>
            ) : null}
            <Text style={styles.metaText}>{timeAgo(request.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Nouveau</Text>
        </View>
      </View>

      {/* ── Service demandé ── */}
      {svc && (
        <View style={styles.serviceTag}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name={svc.icon} size={12} color={colors.primary} weight="duotone" />
            <Text style={styles.serviceTagText}>{svc.label}</Text>
          </View>
        </View>
      )}

      {/* ── Intitulé de la tâche ── */}
      {request.title ? (
        <Text style={styles.title}>{request.title}</Text>
      ) : null}

      {/* ── Description ── */}
      {request.description ? (
        <View style={styles.descBox}>
          <Text style={styles.descText} numberOfLines={3}>{request.description}</Text>
        </View>
      ) : null}

      {/* ── Photos jointes ── */}
      {request.photos?.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoStrip}
          contentContainerStyle={styles.photoStripContent}
        >
          {request.photos.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.photoThumb} />
          ))}
        </ScrollView>
      )}

      {/* ── Infos pratiques ── */}
      <View style={styles.detailsRow}>
        {request.location ? (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={12} color="#888" />
            <Text style={styles.detailText} numberOfLines={1}>{request.location}</Text>
          </View>
        ) : null}
        {request.scheduledDate ? (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={12} color="#888" />
            <Text style={styles.detailText}>{formatDate(request.scheduledDate)}</Text>
          </View>
        ) : null}
        {request.budget ? (
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={12} color="#888" />
            <Text style={styles.detailText}>
              {Number(request.budget).toLocaleString("fr-FR")} FCFA
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Actions principales ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnAccept]}
          onPress={() => onAccept(request.id, request.clientId, request.clientName)}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={14} color="#fff" />
          <Text style={styles.btnAcceptText}>Accepter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnDecline]}
          onPress={handleDecline}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={14} color="#888" />
          <Text style={styles.btnDeclineText}>Décliner</Text>
        </TouchableOpacity>
      </View>

      {/* ── Proposer un autre créneau ── */}
      <TouchableOpacity style={styles.proposeBtn} onPress={handleProposeOtherTime} activeOpacity={0.8}>
        <Ionicons name="calendar-outline" size={13} color={colors.primary} />
        <Text style={styles.proposeBtnText}>Proposer un autre créneau</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FAFFFE",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#185FA5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  info: { flex: 1, gap: 3 },
  clientName: { fontSize: 13, fontWeight: "700", color: "#111" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 10, color: "#AAB0B7" },
  metaDot: { fontSize: 10, color: "#AAB0B7" },
  badge: {
    backgroundColor: "#E8F5F0",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#0F6E56" },

  serviceTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F0FAF6",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#C8EDDF",
  },
  serviceTagText: { fontSize: 11, fontWeight: "700", color: colors.primary },

  title: { fontSize: 14, fontWeight: "700", color: "#111", lineHeight: 20 },

  descBox: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 10,
  },
  descText: { fontSize: 12, color: "#555", lineHeight: 18 },

  detailsRow: { gap: 5 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 11, color: "#777", flex: 1 },

  actions: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 11,
  },
  btnAccept: { backgroundColor: colors.primary },
  btnDecline: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  btnAcceptText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  btnDeclineText: { fontSize: 13, fontWeight: "700", color: "#888" },

  photoStrip: { marginHorizontal: -2 },
  photoStripContent: { gap: 6, paddingHorizontal: 2 },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },

  proposeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#C8EDDF",
    backgroundColor: "#F0FAF6",
  },
  proposeBtnText: { fontSize: 12, fontWeight: "700", color: colors.primary },
});

export default React.memo(RequestCard);

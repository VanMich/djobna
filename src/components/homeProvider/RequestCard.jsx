// src/components/homeProvider/RequestCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AVATAR_COLORS } from "../../constants/services";
import { colors } from "../../theme";

export default function RequestCard({ request, onAccept, onDecline }) {
  // Initiales du client
  const initials = (request.clientName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarColor = "#185FA5"; // bleu pour les clients

  // Temps écoulé depuis la demande
  const timeAgo = (timestamp) => {
    if (!timestamp) return "";
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    return `Il y a ${Math.floor(hrs / 24)}j`;
  };

  const handleDecline = () => {
    // Confirmation avant de décliner
    Alert.alert(
      "Décliner la demande ?",
      "Le client sera informé que vous n'êtes pas disponible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Décliner",
          style: "destructive",
          onPress: () => onDecline(request.id),
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* En-tête : avatar + infos + badge */}
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.clientName}>
            {request.clientName || "Client"}
          </Text>
          <View style={styles.metaRow}>
            {request.quartier && (
              <>
                <Ionicons name="location" size={10} color="#AAB0B7" />
                <Text style={styles.metaText}>{request.quartier}</Text>
                <Text style={styles.metaDot}>·</Text>
              </>
            )}
            <Text style={styles.metaText}>{timeAgo(request.createdAt)}</Text>
          </View>
        </View>

        {/* Badge Nouveau */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Nouveau</Text>
        </View>
      </View>

      {/* Message du client */}
      {request.message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText} numberOfLines={3}>
            {request.message}
          </Text>
        </View>
      )}

      {/* Boutons action */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnAccept]}
          onPress={() =>
            onAccept(request.id, request.clientId, request.clientName)
          }
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 13,
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#FAFFFE",
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
  messageBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
  },
  messageText: { fontSize: 12, color: "#444", lineHeight: 18 },
  actions: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnAccept: { backgroundColor: colors.primary },
  btnDecline: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  btnAcceptText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  btnDeclineText: { fontSize: 12, fontWeight: "700", color: "#888" },
});

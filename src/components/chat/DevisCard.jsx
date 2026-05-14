// src/components/chat/DevisCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export default function DevisCard({ message, isMe, onRespond, userRole }) {
  const { devis } = message;
  const isPending = devis?.status === "pending";
  const isAccepted = devis?.status === "accepted";
  const isRefused = devis?.status === "refused";

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <View style={[styles.wrap, isMe ? styles.wrapMe : styles.wrapThem]}>
      <View style={styles.card}>
        {/* En-tête du devis */}
        <View style={styles.cardHeader}>
          <View style={styles.labelWrap}>
            <Ionicons name="document-text" size={12} color={colors.primary} />
            <Text style={styles.label}>DEVIS DJOBNA</Text>
          </View>
          {/* Badge statut */}
          {isAccepted && (
            <View style={[styles.statusBadge, styles.statusAccepted]}>
              <Text style={styles.statusText}>✓ Accepté</Text>
            </View>
          )}
          {isRefused && (
            <View style={[styles.statusBadge, styles.statusRefused]}>
              <Text style={styles.statusText}>✗ Refusé</Text>
            </View>
          )}
        </View>

        {/* Détails */}
        <Text style={styles.title}>{devis?.title}</Text>
        <Text style={styles.price}>{devis?.price} FCFA</Text>
        {devis?.description && (
          <Text style={styles.description}>{devis.description}</Text>
        )}

        {/* Boutons — visibles uniquement si en attente ET pas l'expéditeur */}
        {isPending && !isMe && userRole === "client" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => onRespond(message.id, "accepted")}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={styles.acceptText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.refuseBtn]}
              onPress={() => onRespond(message.id, "refused")}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={14} color="#888" />
              <Text style={styles.refuseText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Message si en attente et expéditeur */}
        {isPending && isMe && userRole === "provider" && (
          <Text style={styles.waitingText}>⏳ En attente de réponse…</Text>
        )}
      </View>

      {/* Heure + coche */}
      <View style={[styles.meta, isMe && styles.metaMe]}>
        <Text style={styles.time}>{time}</Text>
        {isMe && (
          <Ionicons
            name="checkmark-done"
            size={12}
            color={message.read ? colors.primary : "#AAB0B7"}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: "80%", gap: 4 },
  wrapMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  wrapThem: { alignSelf: "flex-start", alignItems: "flex-start" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },

  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  statusAccepted: { backgroundColor: "#E8F5F0" },
  statusRefused: { backgroundColor: "#FCEAEA" },
  statusText: { fontSize: 10, fontWeight: "700", color: "#111" },

  title: { fontSize: 13, fontWeight: "700", color: "#111" },
  price: { fontSize: 22, fontWeight: "800", color: colors.primary },
  description: { fontSize: 11, color: "#888", lineHeight: 16 },

  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptBtn: { backgroundColor: colors.primary },
  refuseBtn: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  acceptText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  refuseText: { fontSize: 12, fontWeight: "700", color: "#888" },
  waitingText: { fontSize: 11, color: "#AAB0B7", fontStyle: "italic" },

  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaMe: { flexDirection: "row-reverse" },
  time: { fontSize: 10, color: "#AAB0B7" },
});

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export default function DevisCard({ message, isMe, onRespond, onCancel, userRole }) {
  const { devis } = message;
  const isPending = devis?.status === "pending";
  const isAccepted = devis?.status === "accepted";
  const isRefused = devis?.status === "refused";
  const isCancelled = devis?.status === "cancelled";

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "";

  const handleCancel = () => {
    Alert.alert("Annuler le devis ?", "Le client ne pourra plus accepter ce devis.", [
      { text: "Non", style: "cancel" },
      { text: "Annuler le devis", style: "destructive", onPress: () => onCancel?.(message.id) },
    ]);
  };

  return (
    <View style={[s.wrap, isMe ? s.wrapMe : s.wrapThem]}>
      <View style={[s.card, isCancelled && s.cardCancelled]}>
        <View style={s.cardHeader}>
          <View style={s.labelWrap}>
            <Ionicons name="document-text" size={12} color={isCancelled ? "#AAB0B7" : colors.primary} />
            <Text style={[s.label, isCancelled && s.labelCancelled]}>DEVIS DJOBNA</Text>
          </View>
          {isAccepted && (
            <View style={[s.statusBadge, s.statusAccepted]}>
              <Text style={s.statusAcceptedText}>Accepté</Text>
            </View>
          )}
          {isRefused && (
            <View style={[s.statusBadge, s.statusRefused]}>
              <Text style={s.statusRefusedText}>Refusé</Text>
            </View>
          )}
          {isCancelled && (
            <View style={[s.statusBadge, s.statusCancelledBadge]}>
              <Text style={s.statusCancelledText}>Annulé</Text>
            </View>
          )}
        </View>

        <Text style={[s.title, isCancelled && s.titleCancelled]}>{devis?.title}</Text>

        {devis?.lines?.length > 0 ? (
          <View style={s.linesTable}>
            {devis.lines.map((line, i) => (
              <View key={i} style={s.lineRow}>
                <Text style={[s.lineLabel, isCancelled && s.lineCancelled]} numberOfLines={1}>{line.label}</Text>
                <Text style={[s.lineAmount, isCancelled && s.lineCancelled]}>{line.amount.toLocaleString("fr-FR")} F</Text>
              </View>
            ))}
            <View style={s.lineSeparator} />
            <View style={s.lineRow}>
              <Text style={s.totalLabel}>TOTAL</Text>
              <Text style={[s.totalAmount, isCancelled && s.totalCancelled]}>
                {(devis.total || 0).toLocaleString("fr-FR")} FCFA
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[s.price, isCancelled && s.totalCancelled]}>
            {devis?.price?.toLocaleString("fr-FR") ?? devis?.total?.toLocaleString("fr-FR")} FCFA
          </Text>
        )}

        {devis?.validUntil && !isCancelled && (
          <View style={s.validityRow}>
            <Ionicons name="calendar-outline" size={11} color="#AAB0B7" />
            <Text style={s.validityText}>Valable jusqu'au {devis.validUntil}</Text>
          </View>
        )}

        {isPending && !isMe && userRole === "client" && (
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, s.acceptBtn]}
              onPress={() => onRespond(message.id, "accepted")}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={s.acceptText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.refuseBtn]}
              onPress={() => onRespond(message.id, "refused")}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={14} color="#888" />
              <Text style={s.refuseText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPending && isMe && userRole === "provider" && (
          <View style={s.providerPending}>
            <Text style={s.waitingText}>En attente de réponse du client</Text>
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={14} color={colors.error} />
              <Text style={s.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[s.meta, isMe && s.metaMe]}>
        <Text style={s.time}>{time}</Text>
        {isMe && <DevisStatusIcon message={message} />}
      </View>
    </View>
  );
}

function DevisStatusIcon({ message }) {
  if (message.status === "sending") return <Ionicons name="time-outline" size={13} color="#AAB0B7" />;
  if (message.status === "error") return <Ionicons name="alert-circle" size={13} color="#E05555" />;
  if (message.status === "read" || message.read) return <Ionicons name="checkmark-done" size={13} color="#5DCAA5" />;
  if (message.status === "delivered" || message.delivered) return <Ionicons name="checkmark-done" size={13} color="#AAB0B7" />;
  return <Ionicons name="checkmark" size={13} color="#AAB0B7" />;
}

const s = StyleSheet.create({
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
  cardCancelled: { borderColor: "#DDD", opacity: 0.75 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labelWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  label: { fontSize: 9, fontWeight: "700", color: colors.primary, letterSpacing: 0.5 },
  labelCancelled: { color: "#AAB0B7" },

  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  statusAccepted: { backgroundColor: "#E8F5F0" },
  statusRefused: { backgroundColor: "#FCEAEA" },
  statusCancelledBadge: { backgroundColor: "#F5F5F5" },
  statusAcceptedText: { fontSize: 10, fontWeight: "700", color: "#0F6E56" },
  statusRefusedText: { fontSize: 10, fontWeight: "700", color: colors.error },
  statusCancelledText: { fontSize: 10, fontWeight: "700", color: "#888" },

  title: { fontSize: 13, fontWeight: "700", color: "#111" },
  titleCancelled: { color: "#888", textDecorationLine: "line-through" },
  price: { fontSize: 22, fontWeight: "800", color: colors.primary },

  linesTable: { gap: 6, marginTop: 2 },
  lineRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lineLabel: { fontSize: 12, color: "#555", flex: 1, marginRight: 8 },
  lineAmount: { fontSize: 12, fontWeight: "600", color: "#333" },
  lineCancelled: { color: "#AAB0B7" },
  lineSeparator: { height: 1, backgroundColor: "#ECECEC", marginVertical: 4 },
  totalLabel: { fontSize: 11, fontWeight: "800", color: "#0F6E56", letterSpacing: 0.5 },
  totalAmount: { fontSize: 16, fontWeight: "800", color: colors.primary },
  totalCancelled: { color: "#AAB0B7" },

  validityRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  validityText: { fontSize: 10, color: "#AAB0B7", fontStyle: "italic" },

  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 8, borderRadius: 10,
  },
  acceptBtn: { backgroundColor: colors.primary },
  refuseBtn: { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#E8E8E8" },
  acceptText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  refuseText: { fontSize: 12, fontWeight: "700", color: "#888" },

  providerPending: { gap: 8, marginTop: 4 },
  waitingText: { fontSize: 11, color: "#AAB0B7", fontStyle: "italic" },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, backgroundColor: "#FFF0F0",
  },
  cancelText: { fontSize: 11, fontWeight: "700", color: colors.error },

  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaMe: { flexDirection: "row-reverse" },
  time: { fontSize: 10, color: "#AAB0B7" },
});

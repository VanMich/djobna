import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Icon from "../../components/ui/Icon";
import { colors, fonts } from "../../theme";

function DevisCard({ message, isMe, onRespond, onCancel, onPay, userRole }) {
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
            <Icon name="document-text" size={12} color={isCancelled ? colors.ink300 : colors.primary} />
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
                <Text style={[s.lineAmount, isCancelled && s.lineCancelled]}>{Number(line.amount || 0).toLocaleString("fr-FR")} F</Text>
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
            {Number(devis?.price ?? devis?.total ?? 0).toLocaleString("fr-FR")} FCFA
          </Text>
        )}

        {devis?.validUntil && !isCancelled && (
          <View style={s.validityRow}>
            <Icon name="calendar-outline" size={11} color={colors.ink300} />
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
              <Icon name="checkmark" size={14} color={colors.textInverse} />
              <Text style={s.acceptText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.refuseBtn]}
              onPress={() => onRespond(message.id, "refused")}
              activeOpacity={0.85}
            >
              <Icon name="close" size={14} color={colors.ink500} />
              <Text style={s.refuseText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && !isMe && userRole === "client" && devis?.status !== "paid" && (
          <TouchableOpacity
            style={[s.actionBtn, s.payBtn]}
            onPress={() => onPay?.(devis)}
            activeOpacity={0.85}
          >
            <Icon name="credit-card" size={14} color={colors.textInverse} />
            <Text style={s.payText}>Payer {(devis.total || devis.price || 0).toLocaleString("fr-FR")} FCFA</Text>
          </TouchableOpacity>
        )}

        {isPending && isMe && userRole === "provider" && (
          <View style={s.providerPending}>
            <Text style={s.waitingText}>En attente de réponse du client</Text>
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
              <Icon name="close-circle-outline" size={14} color={colors.error} />
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
  if (message.status === "sending") return <Icon name="time-outline" size={13} color={colors.ink300} />;
  if (message.status === "error") return <Icon name="alert-circle" size={13} color={colors.error} />;
  if (message.status === "read" || message.read) return <Icon name="checkmark-done" size={13} color={colors.primary} />;
  if (message.status === "delivered" || message.delivered) return <Icon name="checkmark-done" size={13} color={colors.ink300} />;
  return <Icon name="checkmark" size={13} color={colors.ink300} />;
}

const s = StyleSheet.create({
  wrap: { maxWidth: "80%", gap: 4 },
  wrapMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  wrapThem: { alignSelf: "flex-start", alignItems: "flex-start" },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: 14,
    gap: 8,
  },
  cardCancelled: { borderColor: colors.ink100, opacity: 0.75 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labelWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  label: { fontSize: 9, fontFamily: fonts.bold, color: colors.primary, letterSpacing: 0.5 },
  labelCancelled: { color: colors.ink300 },

  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  statusAccepted: { backgroundColor: colors.primarySoft },
  statusRefused: { backgroundColor: "#FCEAEA" },
  statusCancelledBadge: { backgroundColor: colors.ink50 },
  statusAcceptedText: { fontSize: 10, fontFamily: fonts.bold, color: colors.primaryDark },
  statusRefusedText: { fontSize: 10, fontFamily: fonts.bold, color: colors.error },
  statusCancelledText: { fontSize: 10, fontFamily: fonts.bold, color: colors.ink500 },

  title: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink900 },
  titleCancelled: { color: colors.ink500, textDecorationLine: "line-through" },
  price: { fontSize: 22, fontFamily: fonts.extraBold, color: colors.primary },

  linesTable: { gap: 6, marginTop: 2 },
  lineRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lineLabel: { fontSize: 12, fontFamily: fonts.regular, color: colors.ink500, flex: 1, marginRight: 8 },
  lineAmount: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.ink700 },
  lineCancelled: { color: colors.ink300 },
  lineSeparator: { height: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  totalLabel: { fontSize: 11, fontFamily: fonts.extraBold, color: colors.primaryDark, letterSpacing: 0.5 },
  totalAmount: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.primary },
  totalCancelled: { color: colors.ink300 },

  validityRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  validityText: { fontSize: 10, fontFamily: fonts.medium, color: colors.ink300, fontStyle: "italic" },

  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 8, borderRadius: 10,
  },
  acceptBtn: { backgroundColor: colors.primary },
  refuseBtn: { backgroundColor: colors.ink50, borderWidth: 1, borderColor: colors.borderLight },
  payBtn: { backgroundColor: colors.primary, marginTop: 4 },
  acceptText: { fontSize: 12, fontFamily: fonts.bold, color: colors.textInverse },
  refuseText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink500 },
  payText: { fontSize: 12, fontFamily: fonts.bold, color: colors.textInverse },

  providerPending: { gap: 8, marginTop: 4 },
  waitingText: { fontSize: 11, fontFamily: fonts.medium, color: colors.ink300, fontStyle: "italic" },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, backgroundColor: "#FFF0F0",
  },
  cancelText: { fontSize: 11, fontFamily: fonts.bold, color: colors.error },

  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaMe: { flexDirection: "row-reverse" },
  time: { fontSize: 10, fontFamily: fonts.medium, color: colors.ink300 },
});

export default React.memo(DevisCard);

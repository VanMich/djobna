// src/components/homeProvider/MissionCard.jsx
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SERVICES } from "../../constants/services";
import Icon from "../ui/Icon";
import { colors, fonts, shadows } from "../../theme";

function MissionCard({ mission, onPress, onComplete }) {
  const svc = SERVICES.find((s) => s.id === mission.service);

  const initials = (mission.clientName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatSchedule = (value) => {
    if (!value) return null;
    const d = new Date(value);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return isToday ? `Aujourd'hui, ${time}` : `Demain, ${time}`;
  };

  const handleComplete = () => {
    Alert.alert(
      "J'ai terminé cette mission ?",
      "Le client recevra une demande de confirmation pour clôturer la mission.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "J'ai terminé", onPress: () => onComplete?.(mission.id, mission.clientId) },
      ],
    );
  };

  const scheduledLabel = formatSchedule(mission.scheduledDate || mission.scheduledAt);
  const awaitingClient = !!mission.providerCompletedAt;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{mission.clientName || "Client"}</Text>
          <Text style={styles.service} numberOfLines={1}>
            {svc?.label || "Mission"}{mission.quartier ? ` · ${mission.quartier}` : ""}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>En cours</Text>
        </View>
      </View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: awaitingClient ? "100%" : "60%" }]} />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Icon name="clock" size={12} color={colors.ink300} />
          <Text style={styles.footerText}>{scheduledLabel || "Non planifié"}</Text>
        </View>
        {onComplete && awaitingClient ? (
          <View style={styles.waitingPill}>
            <Icon name="hourglass" size={11} color={colors.mangoDark} />
            <Text style={styles.waitingText}>En attente du client</Text>
          </View>
        ) : onComplete ? (
          <TouchableOpacity style={styles.ctaBtn} onPress={handleComplete} activeOpacity={0.8}>
            <Icon name="check-circle" size={12} color={colors.primary} />
            <Text style={styles.ctaText}>Terminer</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Chat</Text>
            <Icon name="chevron-right" size={12} color={colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.ink100,
    gap: 10,
    ...shadows.sm,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontFamily: fonts.extraBold, color: colors.textInverse },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink900 },
  service: { fontSize: 11, fontFamily: fonts.medium, color: colors.ink500 },
  statusBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  progressBg: {
    height: 4,
    backgroundColor: colors.ink50,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 11, fontFamily: fonts.medium, color: colors.ink500 },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  ctaText: { fontSize: 11, fontFamily: fonts.bold, color: colors.primary },
  waitingPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.mangoSoft, borderRadius: 8,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  waitingText: { fontSize: 10, fontFamily: fonts.bold, color: colors.mangoDark },
});

export default React.memo(MissionCard);

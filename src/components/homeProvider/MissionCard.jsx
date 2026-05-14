// src/components/homeProvider/MissionCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SERVICES } from "../../constants/services";
import { colors } from "../../theme";

const STATUS_CONFIG = {
  accepted: {
    label: "En attente",
    bg: "#FFF8E8",
    color: "#92600A",
  },
  in_progress: {
    label: "En cours",
    bg: "#E8F5F0",
    color: "#0F6E56",
  },
};

export default function MissionCard({ mission, onPress }) {
  const status = STATUS_CONFIG[mission.status] || STATUS_CONFIG.accepted;
  const svc = SERVICES.find((s) => s.id === mission.serviceType);

  // Formater l'heure prévue
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Icône service */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{svc?.icon || "🔧"}</Text>
      </View>

      {/* Infos mission */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {svc?.label || "Mission"}
          {mission.clientName ? ` · ${mission.clientName}` : ""}
        </Text>
        <View style={styles.metaRow}>
          {mission.scheduledAt && (
            <>
              <Ionicons name="time-outline" size={10} color="#AAB0B7" />
              <Text style={styles.metaText}>
                Prévu à {formatTime(mission.scheduledAt)}
              </Text>
            </>
          )}
          {mission.quartier && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{mission.quartier}</Text>
            </>
          )}
        </View>
      </View>

      {/* Badge statut */}
      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FAF6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: { fontSize: 20 },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 13, fontWeight: "700", color: "#111" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 10, color: "#AAB0B7" },
  metaDot: { fontSize: 10, color: "#AAB0B7" },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
});

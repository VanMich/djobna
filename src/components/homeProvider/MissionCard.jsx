// src/components/homeProvider/MissionCard.jsx
//
// Carte affichée dans le bloc "Missions en cours" du dashboard prestataire (§13.1).
// Props :
//   mission   — objet mapRequest (voir useProviderDashboard)
//   onPress   — ouvre le chat avec le client
//   onComplete — marque la mission comme terminée (appelle completeRequest)

import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SERVICES } from "../../constants/services";
import { colors } from "../../theme";

export default function MissionCard({ mission, onPress, onComplete }) {
  // Correction bug : le champ exposé par mapRequest s'appelle "service", pas "serviceType"
  const svc = SERVICES.find((s) => s.id === mission.service);

  // Formate l'heure prévue depuis une ISO string ou un timestamp numérique
  const formatTime = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Confirmation avant de marquer comme terminée (action irréversible)
  const handleComplete = () => {
    Alert.alert(
      "Marquer comme terminée ?",
      "La mission passera en statut \"Terminée\" et sera déplacée dans le récapitulatif du jour.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () => onComplete?.(mission.id),
        },
      ],
    );
  };

  const scheduledTime = formatTime(mission.scheduledDate || mission.scheduledAt);

  return (
    <View style={styles.card}>
      {/* ── Ligne principale : icône + infos + messagerie ── */}
      <TouchableOpacity
        style={styles.mainRow}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Icône du service */}
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{svc?.icon || "🔧"}</Text>
        </View>

        {/* Titre et méta */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {/* Nom du service + nom du client si disponible */}
            {svc?.label || "Mission"}
            {mission.clientName ? ` · ${mission.clientName}` : ""}
          </Text>
          <View style={styles.metaRow}>
            {/* Heure prévue */}
            {scheduledTime && (
              <>
                <Ionicons name="time-outline" size={10} color="#AAB0B7" />
                <Text style={styles.metaText}>Prévu à {scheduledTime}</Text>
              </>
            )}
            {/* Quartier du client */}
            {mission.quartier && (
              <>
                {scheduledTime && <Text style={styles.metaDot}>·</Text>}
                <Text style={styles.metaText}>{mission.quartier}</Text>
              </>
            )}
          </View>
        </View>

        {/* Bouton chat rapide */}
        <View style={styles.chatBtn}>
          <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {/* ── Bouton "Marquer comme terminée" (§13.1) ── */}
      {/* Affiché uniquement si le callback est fourni (missions in_progress) */}
      {onComplete && (
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={14} color="#0F6E56" />
          <Text style={styles.completeBtnText}>Marquer comme terminée</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Ligne cliquable (navigation vers le chat)
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
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

  // Icône chat sur la droite
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0FAF6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Bouton "Marquer comme terminée" en bas de la carte
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#EEF0EF",
    backgroundColor: "#F8FFFC",
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F6E56",
  },
});

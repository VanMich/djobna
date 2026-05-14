// src/components/chat/ChatHeader.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AVATAR_COLORS } from "../../constants/services";
import { colors } from "../../theme";

export default function ChatHeader({
  providerName,
  providerService,
  providerServices,
  isOnline,
  onBack,
  onCall,
  onMore,
}) {
  const initials = (providerName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarColor = AVATAR_COLORS[providerServices?.[0]] || colors.primary;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Bouton retour */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#5DCAA5" />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
          {/* Point de statut en ligne */}
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Infos prestataire */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {providerName}
          </Text>
          <Text style={styles.status}>
            {isOnline ? "🟢 En ligne" : "⚫ Hors ligne"}
            {providerService ? `  ·  ${providerService}` : ""}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={18} color="#9FE1CB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onMore}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#9FE1CB" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: colors.background,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", color: "#fff" },
  status: { fontSize: 10, color: "#5DCAA5", marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AVATAR_COLORS } from "../../constants/services";
import { colors } from "../../theme";

export default function ChatHeader({ providerName, providerServices, isTyping, onBack, onCall, onMore }) {
  const initials = (providerName || "XX")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarColor = AVATAR_COLORS[providerServices?.[0]] || colors.primary;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={[s.avatar, { backgroundColor: avatarColor }]}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>

        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{providerName}</Text>
          {isTyping ? (
            <Text style={s.typing}>écrit...</Text>
          ) : (
            <Text style={s.subtitle}>Djobna</Text>
          )}
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={onCall} activeOpacity={0.7}>
            <Ionicons name="call-outline" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={onMore} activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 10, gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: "#fff" },
  typing: { fontSize: 12, color: "#5DCAA5", fontStyle: "italic", marginTop: 1 },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 },
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
});

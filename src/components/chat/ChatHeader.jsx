import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import Icon from "../../components/ui/Icon";
import { AVATAR_COLORS } from "../../constants/services";
import { colors, fonts } from "../../theme";

export default function ChatHeader({ providerName, providerServices, isTyping, isOnline, onBack, onMore }) {
  const initials = (providerName || "XX")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarColor = AVATAR_COLORS[providerServices?.[0]] || colors.primary;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="arrow-back" size={20} color={colors.ink700} />
        </TouchableOpacity>

        <View>
          <View style={[s.avatar, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          {isOnline && <View style={s.onlineDot} />}
        </View>

        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{providerName}</Text>
          {isTyping ? (
            <Text style={s.typing}>écrit...</Text>
          ) : isOnline ? (
            <Text style={s.online}>En ligne</Text>
          ) : (
            <Text style={s.subtitle}>Djobna</Text>
          )}
        </View>

        {onMore && (
          <View style={s.actions}>
            <TouchableOpacity style={s.actionBtn} onPress={onMore} activeOpacity={0.7}>
              <Icon name="ellipsis-vertical" size={18} color={colors.ink700} />
            </TouchableOpacity>
          </View>
        )}
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
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.ink50,
    alignItems: "center", justifyContent: "center",
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.textInverse },
  onlineDot: {
    position: "absolute", right: -1, bottom: -1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.background,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink900 },
  typing: { fontSize: 12, color: colors.primary, fontStyle: "italic", fontFamily: fonts.medium, marginTop: 1 },
  online: { fontSize: 11, color: colors.primary, fontFamily: fonts.semiBold, marginTop: 1 },
  subtitle: { fontSize: 11, color: colors.ink300, fontFamily: fonts.medium, marginTop: 1 },
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.ink50,
    alignItems: "center", justifyContent: "center",
  },
});

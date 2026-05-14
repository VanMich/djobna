// src/components/chatList/ConversationItem.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AVATAR_COLORS } from "../../constants/services";
import { colors } from "../../theme";

export default function ConversationItem({ conversation, onPress }) {
  const { otherUser, lastMessage, lastMessageAt, unreadCount } = conversation;

  const initials = (otherUser?.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarColor = AVATAR_COLORS[otherUser?.services?.[0]] || colors.primary;
  const hasUnread = unreadCount > 0;

  // Formater l'heure / date
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const oneDay = 86400000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diff < oneDay * 2) return "Hier";
    const days = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
    return days[date.getDay()];
  };

  return (
    <TouchableOpacity
      style={[styles.container, hasUnread && styles.containerUnread]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {/* Point vert si en ligne */}
        <View style={styles.onlineDot} />
      </View>

      {/* Infos conversation */}
      <View style={styles.info}>
        <Text style={[styles.name, hasUnread && styles.nameUnread]}>
          {otherUser?.displayName}
        </Text>
        <Text
          style={[styles.lastMsg, hasUnread && styles.lastMsgUnread]}
          numberOfLines={1}
        >
          {lastMessage}
        </Text>
      </View>

      {/* Heure + badge */}
      <View style={styles.right}>
        <Text style={styles.time}>{formatTime(lastMessageAt)}</Text>
        {hasUnread && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  containerUnread: {
    borderColor: "#D1F5E8",
    backgroundColor: "#FAFFFE",
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: "600", color: "#111" },
  nameUnread: { fontWeight: "800" },
  lastMsg: { fontSize: 12, color: "#AAB0B7" },
  lastMsgUnread: { color: "#555", fontWeight: "500" },
  right: { alignItems: "flex-end", gap: 5 },
  time: { fontSize: 10, color: "#AAB0B7" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
});

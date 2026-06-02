import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Icon from "../../components/ui/Icon";
import { AVATAR_COLORS } from "../../constants/services";
import { colors, fonts } from "../../theme";

function ConversationItem({ conversation, onPress }) {
  const { otherUser, lastMessage, lastMessageAt, lastSenderIsMe, unreadCount } = conversation;
  const hasUnread = unreadCount > 0;

  const initials = (otherUser?.displayName || "XX")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarColor = AVATAR_COLORS[otherUser?.services?.[0]] || colors.primary;

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      {otherUser?.photoURL ? (
        <Image source={{ uri: otherUser.photoURL }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, { backgroundColor: avatarColor }]}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={s.center}>
        <Text style={[s.name, hasUnread && s.nameBold]} numberOfLines={1}>
          {otherUser?.displayName}
        </Text>
        <View style={s.msgRow}>
          {lastSenderIsMe && (
            <Icon name="checkmark-done" size={14} color={hasUnread ? colors.primary : colors.ink300} style={s.checkIcon} />
          )}
          <Text style={[s.msg, hasUnread && s.msgUnread]} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
      </View>

      <View style={s.right}>
        <Text style={[s.time, hasUnread && s.timeUnread]}>
          {formatTime(lastMessageAt)}
        </Text>
        {hasUnread && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);

  if (d >= today) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (d >= yesterday) return "Hier";
  if (d >= weekAgo) return ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."][d.getDay()];
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.textInverse },
  center: { flex: 1, marginLeft: 14, gap: 3 },
  name: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.ink900 },
  nameBold: { fontFamily: fonts.extraBold },
  msgRow: { flexDirection: "row", alignItems: "center" },
  checkIcon: { marginRight: 3 },
  msg: { fontSize: 13, fontFamily: fonts.regular, color: colors.ink300, flex: 1 },
  msgUnread: { color: colors.ink700, fontFamily: fonts.semiBold },
  right: { alignItems: "flex-end", marginLeft: 10, gap: 6 },
  time: { fontSize: 11, fontFamily: fonts.medium, color: colors.ink300 },
  timeUnread: { color: colors.primary, fontFamily: fonts.bold },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontFamily: fonts.extraBold, color: colors.textInverse },
});

export default React.memo(ConversationItem);

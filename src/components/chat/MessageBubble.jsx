import React, { useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

const SWIPE_THRESHOLD = 60;

function MessageBubble({ message, isMe, onRetry, onReply }) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) && g.dx > 0,
      onPanResponderMove: (_, g) => {
        if (g.dx > 0 && g.dx <= 80) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx >= SWIPE_THRESHOLD && onReply) onReply(message);
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 200, friction: 20 }).start();
      },
    })
  ).current;

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "";

  const isSending = message.status === "sending";
  const isError = message.status === "error";

  if (message.type === "system") {
    return (
      <View style={s.systemWrap}>
        <View style={s.systemPill}>
          <Text style={s.systemText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  if (message.type === "image") {
    return (
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <View style={[s.row, isMe ? s.rowMe : s.rowThem]}>
          <Animated.View style={[s.replyIcon, { opacity: translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1] }) }]}>
            <Ionicons name="arrow-undo" size={18} color={colors.primary} />
          </Animated.View>
          <View style={[s.wrap, isMe ? s.wrapMe : s.wrapThem]}>
            {message.replyTo && <ReplyQuote reply={message.replyTo} isMe={isMe} />}
            <TouchableOpacity activeOpacity={0.9}>
              <Image source={{ uri: message.imageUrl }} style={[s.imageMsg, isSending && s.sending]} />
            </TouchableOpacity>
            <View style={s.imgMeta}>
              <Text style={s.imgTime}>{time}</Text>
              {isMe && <StatusIcon message={message} light />}
            </View>
            {isError && onRetry && <RetryButton onPress={() => onRetry(message.id)} />}
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
      <View style={[s.row, isMe ? s.rowMe : s.rowThem]}>
        <Animated.View style={[s.replyIcon, { opacity: translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1] }) }]}>
          <Ionicons name="arrow-undo" size={18} color={colors.primary} />
        </Animated.View>
        <View style={[s.wrap, isMe ? s.wrapMe : s.wrapThem]}>
          {message.replyTo && <ReplyQuote reply={message.replyTo} isMe={isMe} />}
          <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem, isSending && s.sending, isError && s.errorBubble]}>
            <Text style={[s.text, isMe ? s.textMe : s.textThem]}>{message.text}</Text>
            <View style={s.inlineMeta}>
              <Text style={[s.time, isMe && s.timeMe]}>{time}</Text>
              {isMe && <StatusIcon message={message} light={isMe} />}
            </View>
          </View>
          {isError && onRetry && <RetryButton onPress={() => onRetry(message.id)} />}
        </View>
      </View>
    </Animated.View>
  );
}

function ReplyQuote({ reply, isMe }) {
  const previewText = reply.type === "image" ? "Photo"
    : reply.type === "devis" ? "Devis"
    : (reply.text || "").slice(0, 80);

  return (
    <View style={[s.replyQuote, isMe ? s.replyQuoteMe : s.replyQuoteThem]}>
      <View style={[s.replyBar, isMe ? s.replyBarMe : s.replyBarThem]} />
      <Text style={[s.replyText, isMe && s.replyTextMe]} numberOfLines={2}>{previewText}</Text>
    </View>
  );
}

function StatusIcon({ message, light }) {
  if (message.status === "sending") return <Ionicons name="time-outline" size={13} color={light ? "rgba(255,255,255,0.6)" : "#AAB0B7"} />;
  if (message.status === "error") return <Ionicons name="alert-circle" size={13} color="#E05555" />;
  if (message.status === "read" || message.read) return <Ionicons name="checkmark-done" size={13} color="#5DCAA5" />;
  if (message.status === "delivered" || message.delivered) return <Ionicons name="checkmark-done" size={13} color={light ? "rgba(255,255,255,0.5)" : "#AAB0B7"} />;
  return <Ionicons name="checkmark" size={13} color={light ? "rgba(255,255,255,0.5)" : "#AAB0B7"} />;
}

function RetryButton({ onPress }) {
  return (
    <TouchableOpacity style={s.retryBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="refresh" size={12} color="#E05555" />
      <Text style={s.retryText}>Renvoyer</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end" },
  rowMe: { justifyContent: "flex-end" },
  rowThem: { justifyContent: "flex-start" },
  replyIcon: {
    position: "absolute", left: -30, bottom: 12,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.green100, alignItems: "center", justifyContent: "center",
  },

  wrap: { maxWidth: "78%", gap: 2 },
  wrapMe: { alignItems: "flex-end" },
  wrapThem: { alignItems: "flex-start" },

  bubble: { paddingTop: 7, paddingBottom: 5, paddingHorizontal: 11, borderRadius: 18 },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#fff", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#EAEAEA" },
  sending: { opacity: 0.6 },
  errorBubble: { opacity: 0.5 },

  text: { fontSize: 14, lineHeight: 20 },
  textMe: { color: "#fff" },
  textThem: { color: "#111" },

  inlineMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 1 },
  time: { fontSize: 10, color: "#AAB0B7" },
  timeMe: { color: "rgba(255,255,255,0.55)" },

  imageMsg: { width: 220, height: 160, borderRadius: 14, backgroundColor: "#E8E8E8" },
  imgMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 2, paddingRight: 4 },
  imgTime: { fontSize: 10, color: "#AAB0B7" },

  replyQuote: { flexDirection: "row", borderRadius: 10, overflow: "hidden", marginBottom: 3 },
  replyQuoteMe: { backgroundColor: "rgba(255,255,255,0.15)" },
  replyQuoteThem: { backgroundColor: "#F5F5F5" },
  replyBar: { width: 3, borderRadius: 2 },
  replyBarMe: { backgroundColor: "#5DCAA5" },
  replyBarThem: { backgroundColor: colors.primary },
  replyText: { fontSize: 12, color: "#666", paddingVertical: 5, paddingHorizontal: 8, flex: 1 },
  replyTextMe: { color: "rgba(255,255,255,0.8)" },

  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8,
    backgroundColor: "#FFF0F0", marginTop: 3, alignSelf: "flex-end",
  },
  retryText: { fontSize: 10, color: "#E05555", fontWeight: "600" },

  systemWrap: { alignItems: "center", marginVertical: 8 },
  systemPill: {
    backgroundColor: "#F0FAF6", borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14,
    borderWidth: 1, borderColor: "#C8EDDF",
  },
  systemText: { fontSize: 12, color: "#0F6E56", fontWeight: "600", textAlign: "center" },
});

export default React.memo(MessageBubble);

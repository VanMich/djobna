// src/components/chat/MessageBubble.js
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export default function MessageBubble({ message, isMe }) {
  // Formater l'heure
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Message texte simple
  if (message.type === "text") {
    return (
      <View style={[styles.wrap, isMe ? styles.wrapMe : styles.wrapThem]}>
        <View
          style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
        >
          <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>
            {message.text}
          </Text>
        </View>
        <View style={[styles.meta, isMe && styles.metaMe]}>
          <Text style={styles.time}>{time}</Text>
          {/* Double coche si message lu */}
          {isMe && (
            <Ionicons
              name="checkmark-done"
              size={12}
              color={message.read ? colors.primary : "#AAB0B7"}
            />
          )}
        </View>
      </View>
    );
  }

  // Message image
  if (message.type === "image") {
    return (
      <View style={[styles.wrap, isMe ? styles.wrapMe : styles.wrapThem]}>
        <TouchableOpacity activeOpacity={0.9}>
          <Image source={{ uri: message.imageUrl }} style={styles.imageMsg} />
        </TouchableOpacity>
        <View style={[styles.meta, isMe && styles.metaMe]}>
          <Text style={styles.time}>{time}</Text>
          {isMe && (
            <Ionicons
              name="checkmark-done"
              size={12}
              color={message.read ? colors.primary : "#AAB0B7"}
            />
          )}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "column",
    gap: 2,
    maxWidth: "75%",
  },
  wrapMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  wrapThem: { alignSelf: "flex-start", alignItems: "flex-start" },

  bubble: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EEF0EF",
  },

  text: { fontSize: 13, lineHeight: 19 },
  textMe: { color: "#fff" },
  textThem: { color: "#111" },

  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaMe: { flexDirection: "row-reverse" },
  time: { fontSize: 10, color: "#AAB0B7" },

  imageMsg: {
    width: 200,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
});

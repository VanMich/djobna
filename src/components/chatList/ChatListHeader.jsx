// src/components/chatList/ChatListHeader.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export default function ChatListHeader({ onNewChat }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.textBlock}>
          <Text style={styles.greeting}>Vos échanges</Text>
          <Text style={styles.title}>Messages</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={onNewChat}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color="#9FE1CB" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textBlock: { gap: 2 },
  greeting: { fontSize: 13, color: "#5DCAA5", fontWeight: "500" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  newBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
});

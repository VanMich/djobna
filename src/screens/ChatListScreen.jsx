// src/screens/ChatListScreen.js
import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useChatList } from "../hooks/useChatList";
import ChatListHeader from "../components/chatList/ChatListHeader";
import ConversationItem from "../components/chatList/ConversationItem";
import { colors } from "../theme";

export default function ChatListScreen({ navigation }) {
  const { conversations, loading } = useChatList();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <ChatListHeader onNewChat={() => {}} />

      {/* Liste */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={56} color="#DDD" />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptySub}>
            Contactez un prestataire depuis son profil pour démarrer une
            conversation.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.chatId}
              conversation={conv}
              onPress={() => {
                const isProvider =
                  conv.otherUser?.role === "provider" ||
                  conv.otherUser?.role === "both";
                navigation.navigate("Chat", {
                  providerId: isProvider ? conv.otherId : undefined,
                  clientId: isProvider ? undefined : conv.otherId,
                  providerName: isProvider
                    ? conv.otherUser?.displayName
                    : undefined,
                  clientName: isProvider
                    ? undefined
                    : conv.otherUser?.displayName,
                  providerServices: conv.otherUser?.services,
                });
              }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: "#F4F6F5" },
  scrollContent: { padding: 12, paddingBottom: 30 },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F5",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F5",
    padding: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  emptySub: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});

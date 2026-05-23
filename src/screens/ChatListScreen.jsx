import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useChatList } from "../hooks/useChatList";
import ChatListHeader from "../components/chatList/ChatListHeader";
import ConversationItem from "../components/chatList/ConversationItem";
import { colors } from "../theme";

export default function ChatListScreen({ navigation }) {
  const { conversations, loading } = useChatList();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.otherUser?.displayName?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const handlePress = useCallback((conv) => {
    const isProvider = conv.otherUser?.role === "provider" || conv.otherUser?.role === "both";
    navigation.navigate("Chat", {
      chatId: conv.chatId,
      requestId: conv.requestId,
      providerId: isProvider ? conv.otherId : undefined,
      clientId: isProvider ? undefined : conv.otherId,
      providerName: isProvider ? conv.otherUser?.displayName : undefined,
      clientName: isProvider ? undefined : conv.otherUser?.displayName,
      providerServices: conv.otherUser?.services,
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <ConversationItem conversation={item} onPress={() => handlePress(item)} />
  ), [handlePress]);

  return (
    <View style={st.root}>
      <StatusBar style="light" />
      <ChatListHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.chatId}
          renderItem={renderItem}
          style={st.list}
          contentContainerStyle={filtered.length === 0 ? st.emptyContainer : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={st.empty}>
              {searchQuery ? (
                <>
                  <Ionicons name="search-outline" size={44} color="#CCC" />
                  <Text style={st.emptyTitle}>Aucun résultat</Text>
                  <Text style={st.emptySub}>Aucune conversation ne correspond à "{searchQuery}"</Text>
                </>
              ) : (
                <>
                  <View style={st.emptyIcon}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#CCC" />
                  </View>
                  <Text style={st.emptyTitle}>Aucune conversation</Text>
                  <Text style={st.emptySub}>
                    Contactez un prestataire depuis son profil pour commencer.
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#333" },
  emptySub: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 20 },
});

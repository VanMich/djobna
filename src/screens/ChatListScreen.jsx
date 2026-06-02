import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "../components/ui/Icon";
import { useChatList } from "../hooks/useChatList";
import ErrorState from "../components/ui/ErrorState";
import ChatListHeader from "../components/chatList/ChatListHeader";
import ConversationItem from "../components/chatList/ConversationItem";
import { normalizeText } from "../utils/text";
import { colors, fonts } from "../theme";

export default function ChatListScreen({ navigation }) {
  const { conversations, loading, error, refetch } = useChatList();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeText(searchQuery);
    if (!q) return conversations;
    return conversations.filter((c) =>
      normalizeText(c.otherUser?.displayName).includes(q) ||
      normalizeText(c.lastMessage).includes(q)
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
      <StatusBar style="dark" />
      <ChatListHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} message="Impossible de charger tes conversations. Vérifie ta connexion et réessaie." />
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
                  <Icon name="search-outline" size={44} color={colors.ink300} />
                  <Text style={st.emptyTitle}>Aucun résultat</Text>
                  <Text style={st.emptySub}>Aucune conversation ne correspond à "{searchQuery}"</Text>
                </>
              ) : (
                <>
                  <View style={st.emptyIcon}>
                    <Icon name="chatbubbles-outline" size={48} color={colors.ink300} />
                  </View>
                  <Text style={st.emptyTitle}>Aucune conversation</Text>
                  <Text style={st.emptySub}>
                    Contacte un pro depuis son profil pour commencer.
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
  list: { flex: 1, backgroundColor: colors.card },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.ink50, alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.ink700 },
  emptySub: { fontSize: 13, color: colors.ink500, textAlign: "center", lineHeight: 20 },
});

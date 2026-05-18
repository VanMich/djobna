// src/screens/ChatScreen.js
import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useChat } from "../hooks/useChat";
import ChatHeader from "../components/chat/ChatHeader";
import MessageBubble from "../components/chat/MessageBubble";
import DevisCard from "../components/chat/DevisCard";
import ChatInput from "../components/chat/ChatInput";
import { supabase } from "../config/supabase";
import { colors } from "../theme";

export default function ChatScreen({ navigation, route }) {
  const {
    providerId,
    clientId,
    providerName,
    clientName,
    providerServices,
  } = route.params || {};
  const otherUserId = clientId || providerId;
  const [userRole, setUserRole] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const flatListRef = useRef(null);

  // Détermine le rôle de l'utilisateur courant et charge le profil de l'interlocuteur
  // Remplace auth.currentUser + 2× getDoc(doc(db,'users',id))
  useEffect(() => {
    const fetchChatContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)   // user.id = user.uid Firebase
          .single();
        if (myData) setUserRole(myData.role);
      }

      if (!otherUserId) return;
      const { data: otherData } = await supabase
        .from("users")
        .select("display_name, photo_url, services, role")
        .eq("id", otherUserId)
        .single();
      if (otherData) {
        setOtherUser({
          displayName: otherData.display_name, // display_name → displayName
          photoURL: otherData.photo_url,
          services: otherData.services,
          role: otherData.role,
        });
      }
    };
    fetchChatContext();
  }, [otherUserId]);

  const {
    messages,
    loading,
    sendMessage,
    sendDevis,
    respondToDevis,
    currentUserId,
  } = useChat(otherUserId);

  const chatName =
    otherUser?.displayName || clientName || providerName || "Utilisateur";
  const chatServices = providerServices || otherUser?.services;
  const canOpenProviderProfile = Boolean(providerId && !clientId);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Envoyer une image (TODO: upload Firebase Storage)
  const handleSendImage = useCallback(async (uri) => {
    Alert.alert(
      "Bientôt disponible",
      "L'envoi de photos sera disponible dans la prochaine mise à jour.",
    );
  }, []);

  // Rendu d'un message
  const renderMessage = useCallback(
    ({ item, index }) => {
      const isMe = item.senderId === currentUserId;
      const prevMsg = messages[index - 1];
      // Afficher la date si c'est le premier message ou si le jour change
      const showDate =
        !prevMsg ||
        new Date(item.createdAt).toDateString() !==
          new Date(prevMsg.createdAt).toDateString();

      return (
        <View>
          {showDate && (
            <View style={styles.dateWrap}>
              <View style={styles.dateLine} />
              <View style={styles.dateBadge}>
                <React.Fragment>
                  {/* Afficher "Aujourd'hui", "Hier" ou la date */}
                </React.Fragment>
              </View>
            </View>
          )}
          <View style={styles.messageWrap}>
            {item.type === "devis" ? (
              <DevisCard
                message={item}
                isMe={isMe}
                onRespond={respondToDevis}
                userRole={userRole}
              />
            ) : (
              <MessageBubble message={item} isMe={isMe} />
            )}
          </View>
        </View>
      );
    },
    [messages, currentUserId, respondToDevis, userRole],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <ChatHeader
        providerName={chatName}
        providerServices={chatServices}
        isOnline={true}
        onBack={() => navigation.goBack()}
        onCall={() => Alert.alert("Appel", "Fonctionnalité à venir")}
        onMore={() =>
          Alert.alert(
            "Options",
            "",
            [
              canOpenProviderProfile && {
                text: "Voir le profil",
                onPress: () =>
                  navigation.navigate("ProviderProfile", { providerId }),
              },
              { text: "Signaler", style: "destructive" },
              { text: "Annuler", style: "cancel" },
            ].filter(Boolean),
          )
        }
      />

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyChat}>
                <View style={styles.emptyChatBubble}>
                  <React.Fragment>💬</React.Fragment>
                </View>
              </View>
            )
          }
        />

        {/* Input */}
        <ChatInput
          onSendMessage={sendMessage}
          onSendImage={handleSendImage}
          onSendDevis={sendDevis}
          userRole={userRole}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, backgroundColor: "#F4F6F5" },
  messagesList: {
    padding: 12,
    paddingBottom: 8,
    gap: 6,
    flexGrow: 1,
  },
  messageWrap: { marginBottom: 4 },
  dateWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },
  dateLine: { flex: 1, height: 0.5, backgroundColor: "#DDD" },
  dateBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyChatBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FAF6",
    alignItems: "center",
    justifyContent: "center",
  },
});

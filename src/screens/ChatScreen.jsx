import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useChat } from "../hooks/useChat";
import { useReviews } from "../hooks/useReviews";
import ChatHeader from "../components/chat/ChatHeader";
import MessageBubble from "../components/chat/MessageBubble";
import TypingBubble from "../components/chat/TypingBubble";
import DevisCard from "../components/chat/DevisCard";
import ChatInput from "../components/chat/ChatInput";
import RatingModal from "../components/reviews/RatingModal";
import { SkeletonChatBubbles } from "../components/ui";
import Icon from "../components/ui/Icon";
import { supabase } from "../config/supabase";
import { colors, fonts } from "../theme";

export default function ChatScreen({ navigation, route }) {
  const {
    providerId, clientId, providerName, clientName,
    providerServices, requestId: routeRequestId, chatId: routeChatId,
  } = route.params || {};
  const otherUserId = clientId || providerId;
  const [userRole, setUserRole] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const flatListRef = useRef(null);

  const { submitReview } = useReviews(providerId);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user && active) {
        const { data: myData } = await supabase.from("users")
          .select("active_role").eq("id", user.id).single();
        if (active && myData) setUserRole(myData.active_role);
        const { data: provSub } = await supabase.from("providers")
          .select("subscription_plan").eq("id", user.id).maybeSingle();
        if (active && provSub) setIsPremium(provSub.subscription_plan === "premium");
      }
      if (!otherUserId || !active) return;
      const { data: otherData } = await supabase.from("public_users")
        .select("display_name, photo_url, role").eq("id", otherUserId).single();
      const { data: providerData } = await supabase.from("public_providers")
        .select("services").eq("id", otherUserId).maybeSingle();
      if (active && otherData) {
        setOtherUser({
          displayName: otherData.display_name, photoURL: otherData.photo_url,
          services: providerData?.services || null, role: otherData.role,
        });
      }
    })();
    return () => { active = false; };
  }, [otherUserId]);

  const {
    messages, loading, sendMessage, sendImage, sendDevis,
    respondToDevis, cancelDevis, markProviderDone, confirmComplete, retryMessage,
    currentUserId, requestId, requestStatus, providerCompletedAt,
    isOtherTyping, isOtherOnline, replyTo, setReplyTo, broadcastTyping,
  } = useChat(otherUserId, { chatIdParam: routeChatId, requestIdParam: routeRequestId });

  const chatName = otherUser?.displayName || clientName || providerName || "Utilisateur";
  const chatServices = providerServices || otherUser?.services;
  const canOpenProviderProfile = Boolean(providerId && !clientId);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages.length]);

  const handleMarkDone = useCallback(() => {
    Alert.alert(
      "J'ai terminé cette mission ?",
      "Le client recevra une demande de confirmation pour clôturer la mission.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "J'ai terminé", onPress: async () => {
          try { await markProviderDone(); }
          catch (err) {
            console.error("Erreur déclaration fin de mission:", err);
            Alert.alert("Erreur", "Impossible de déclarer la fin. Réessaye.");
          }
        } },
      ],
    );
  }, [markProviderDone]);

  const handleConfirmAndRate = useCallback(async () => {
    try {
      await confirmComplete();
      if (providerId) setRatingModalVisible(true);
    } catch (err) {
      console.error("Erreur confirmation mission:", err);
      Alert.alert("Erreur", "Impossible de confirmer la fin de la mission. Réessaye.");
    }
  }, [confirmComplete, providerId]);

  const handleSubmitRating = useCallback(async (ratingData) => {
    if (!currentUserId || !requestId) {
      Alert.alert("Erreur", "Données manquantes pour soumettre l'avis. Réessaye plus tard.");
      return;
    }
    setRatingLoading(true);
    try {
      const { data: userData } = await supabase.from("users")
        .select("display_name").eq("id", currentUserId).single();
      const result = await submitReview({
        ...ratingData, requestId, clientId: currentUserId,
        authorName: userData?.display_name || "Client",
      });
      setRatingLoading(false);
      if (result.success) { setRatingModalVisible(false); Alert.alert("Merci !", "Ton avis a été publié."); }
      else Alert.alert("Erreur", "Impossible de publier l'avis. Réessaye.");
    } catch (err) {
      console.error("Erreur soumission avis:", err);
      setRatingLoading(false);
      Alert.alert("Erreur", "Impossible de publier l'avis. Réessayez.");
    }
  }, [submitReview, requestId, currentUserId]);

  const scrollToBottom = () => flatListRef.current?.scrollToEnd({ animated: true });

  const handleScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setShowScrollBtn(distanceFromBottom > 150);
  }, []);

  const renderMessage = useCallback(({ item, index }) => {
    const isMe = item.senderId === currentUserId;
    const prevMsg = messages[index - 1];
    const showDate = !prevMsg ||
      new Date(item.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

    return (
      <View>
        {showDate && (
          <View style={st.dateWrap}>
            <View style={st.dateLine} />
            <View style={st.dateBadge}>
              <Text style={st.dateBadgeText}>
                {formatDateLabel(item.createdAt)}
              </Text>
            </View>
            <View style={st.dateLine} />
          </View>
        )}
        <View style={st.msgWrap}>
          {item.type === "devis" ? (
            <DevisCard message={item} isMe={isMe} onRespond={respondToDevis} onCancel={cancelDevis} onPay={(devis) => navigation.navigate("Payment", { amount: devis.total || devis.price, requestId, providerName: chatName, devisId: item.id })} userRole={userRole} />
          ) : (
            <MessageBubble message={item} isMe={isMe} onRetry={retryMessage} onReply={setReplyTo} />
          )}
        </View>
      </View>
    );
  }, [messages, currentUserId, respondToDevis, cancelDevis, retryMessage, setReplyTo, userRole]);

  return (
    <View style={st.root}>
      <StatusBar style="dark" />

      <ChatHeader
        providerName={chatName}
        providerServices={chatServices}
        isTyping={isOtherTyping}
        isOnline={isOtherOnline}
        onBack={() => navigation.goBack()}
        onMore={canOpenProviderProfile ? () =>
          Alert.alert("Options", "", [
            { text: "Voir le profil", onPress: () => navigation.navigate("ProviderProfile", { providerId }) },
            { text: "Annuler", style: "cancel" },
          ]) : undefined
        }
      />

      {userRole === "client" && requestStatus === "in_progress" && (
        <View style={st.confirmBanner}>
          <View style={st.confirmBannerInfo}>
            <Icon name="construct-outline" size={16} color={colors.primaryDark} />
            <View style={{ flex: 1 }}>
              <Text style={st.confirmBannerTitle}>
                {providerCompletedAt ? "Le prestataire a terminé" : "Mission en cours"}
              </Text>
              <Text style={st.confirmBannerSub}>
                {providerCompletedAt ? "Confirme pour clôturer et noter." : "La prestation est-elle terminée ?"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={st.trackBtn} activeOpacity={0.85}
              onPress={() => navigation.navigate("Tracking", { requestId, providerName: chatName })}
            >
              <Text style={st.trackBtnText}>Suivre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.confirmBtn} activeOpacity={0.85}
              onPress={() => Alert.alert("Confirmer la fin ?", "Cette action est irréversible.", [
                { text: "Annuler", style: "cancel" },
                { text: "Confirmer", onPress: handleConfirmAndRate },
              ])}
            >
              <Text style={st.confirmBtnText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {userRole === "provider" && requestStatus === "in_progress" && (
        providerCompletedAt ? (
          <View style={st.waitBanner}>
            <Icon name="hourglass" size={16} color={colors.mangoDark} />
            <View style={{ flex: 1 }}>
              <Text style={st.waitTitle}>En attente du client</Text>
              <Text style={st.waitSub}>Tu as marqué la mission terminée. Le client doit confirmer.</Text>
            </View>
          </View>
        ) : (
          <View style={st.confirmBanner}>
            <View style={st.confirmBannerInfo}>
              <Icon name="construct-outline" size={16} color={colors.primaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={st.confirmBannerTitle}>Mission en cours</Text>
                <Text style={st.confirmBannerSub}>As-tu terminé la prestation ?</Text>
              </View>
            </View>
            <TouchableOpacity style={st.confirmBtn} activeOpacity={0.85} onPress={handleMarkDone}>
              <Text style={st.confirmBtnText}>J'ai terminé</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      <KeyboardAvoidingView style={st.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}
      >
        <View style={st.flex}>
          {loading ? (
            <SkeletonChatBubbles />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={st.list}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={200}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListFooterComponent={isOtherTyping ? <TypingBubble /> : null}
              ListEmptyComponent={
                <View style={st.emptyChat}>
                  <View style={st.emptyChatBubble}>
                    <Icon name="chat-teardrop-dots" size={36} color={colors.ink300} weight="duotone" />
                  </View>
                  <Text style={st.emptyText}>Envoyez un message pour commencer</Text>
                </View>
              }
            />
          )}

          {showScrollBtn && !loading && (
            <TouchableOpacity style={st.scrollBtn} onPress={scrollToBottom} activeOpacity={0.8}>
              <Icon name="chevron-down" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          )}
        </View>

        <ChatInput
          onSendMessage={sendMessage}
          onSendImage={sendImage}
          onSendDevis={sendDevis}
          userRole={userRole}
          isPremium={isPremium}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTyping={broadcastTyping}
        />
      </KeyboardAvoidingView>

      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleSubmitRating}
        providerName={chatName}
        loading={ratingLoading}
      />
    </View>
  );
}

function formatDateLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, backgroundColor: colors.ink50 },
  list: { paddingHorizontal: 10, paddingVertical: 8, flexGrow: 1 },
  msgWrap: { marginBottom: 3 },

  dateWrap: { flexDirection: "row", alignItems: "center", marginVertical: 12, gap: 10, paddingHorizontal: 10 },
  dateLine: { flex: 1, height: 0.5, backgroundColor: colors.ink100 },
  dateBadge: { backgroundColor: colors.card, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12, shadowColor: colors.brandDeep, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  dateBadgeText: { fontSize: 11, color: colors.ink500, fontFamily: fonts.semiBold },

  confirmBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.primarySoft, borderBottomWidth: 1, borderBottomColor: colors.green200,
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  confirmBannerInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  confirmBannerTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.primaryDark },
  confirmBannerSub: { fontSize: 11, color: colors.primary },
  trackBtn: { backgroundColor: colors.primarySoft, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  trackBtnText: { fontSize: 12, fontFamily: fonts.bold, color: colors.primary },

  waitBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.mangoSoft, borderBottomWidth: 1, borderBottomColor: colors.mango,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  waitTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.mangoDark },
  waitSub: { fontSize: 11, color: colors.mangoDark, marginTop: 1 },
  confirmBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  confirmBtnText: { fontSize: 12, fontFamily: fonts.bold, color: colors.textInverse },

  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyChatBubble: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
  },
  emptyText: { fontSize: 13, color: colors.ink500 },

  scrollBtn: {
    position: "absolute", right: 16, bottom: 8,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    shadowColor: colors.brandDeep, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
});

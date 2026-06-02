import Icon from "../ui/Icon";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../../config/supabase";
import { colors, fonts } from "../../theme";
import DevisFormModal from "./DevisFormModal";

export default function ChatInput({
  onSendMessage, onSendImage, onSendDevis,
  userRole, isPremium,
  replyTo, onCancelReply, onTyping,
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showDevisModal, setShowDevisModal] = useState(false);
  const typingTimerRef = useRef(null);

  // Petit "pop" du bouton d'envoi quand le message devient envoyable
  const hasText = text.trim().length > 0;
  const sendScale = useRef(new Animated.Value(1)).current;
  const prevHasTextRef = useRef(false);

  useEffect(() => {
    if (hasText && !prevHasTextRef.current) {
      sendScale.setValue(0.6);
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, tension: 220, friction: 7 }).start();
    }
    prevHasTextRef.current = hasText;
  }, [hasText, sendScale]);

  const handleTextChange = (val) => {
    setText(val);
    if (onTyping) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onTyping();
      typingTimerRef.current = setTimeout(() => {}, 2000);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  const handleAttach = () => {
    const options = [{ text: "Photo", onPress: handlePickImage }];
    if (userRole === "provider") {
      options.push({
        text: "Envoyer un devis",
        onPress: () => {
          if (!isPremium) {
            Alert.alert("Fonctionnalité Premium", "L'envoi de devis est réservé aux abonnés Premium.");
            return;
          }
          setShowDevisModal(true);
        },
      });
    }
    options.push({ text: "Annuler", style: "cancel" });
    Alert.alert("Envoyer", "", options);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled || !onSendImage) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { Alert.alert("Erreur", "Tu dois être connecté."); return; }
      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append("file", { uri, name: `chat-${Date.now()}.${ext}`, type: `image/${ext}` });
      const { error } = await supabase.storage.from("chat-images").upload(path, formData, { contentType: `image/${ext}` });
      if (error) throw error;
      onSendImage(supabase.storage.from("chat-images").getPublicUrl(path).data.publicUrl);
    } catch (err) {
      console.error("Erreur upload image:", err);
      Alert.alert("Erreur", "Impossible d'envoyer l'image. Réessaye.");
    } finally {
      setUploading(false);
    }
  };

  const replyPreview = replyTo
    ? (replyTo.type === "image" ? "Photo" : replyTo.type === "devis" ? "Devis" : (replyTo.text || "").slice(0, 60))
    : null;

  return (
    <View style={s.root}>
      <DevisFormModal
        visible={showDevisModal}
        onClose={() => setShowDevisModal(false)}
        onSend={(d) => { onSendDevis?.(d); setShowDevisModal(false); }}
      />

      {replyTo && (
        <View style={s.replyBar}>
          <View style={s.replyBarAccent} />
          <View style={s.replyBarContent}>
            <Text style={s.replyBarLabel}>Réponse</Text>
            <Text style={s.replyBarText} numberOfLines={1}>{replyPreview}</Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={s.replyBarClose} activeOpacity={0.7}>
            <Icon name="close" size={18} color={colors.ink500} />
          </TouchableOpacity>
        </View>
      )}

      <View style={s.inputRow}>
        <TouchableOpacity
          style={[s.iconBtn, uploading && { opacity: 0.4 }]}
          onPress={handleAttach} disabled={uploading} activeOpacity={0.7}
        >
          <Icon name={uploading ? "cloud-upload-outline" : "add"} size={22} color={colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={s.input}
          placeholder="Message..."
          placeholderTextColor={colors.ink300}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            style={[s.sendBtn, !hasText && s.sendBtnOff]}
            onPress={handleSend} disabled={!hasText} activeOpacity={0.8}
          >
            <Icon name="send" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingBottom: Platform.OS === "ios" ? 20 : 12 },

  replyBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  replyBarAccent: { width: 3, height: "100%", borderRadius: 2, backgroundColor: colors.primary, marginRight: 8 },
  replyBarContent: { flex: 1 },
  replyBarLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.primary },
  replyBarText: { fontSize: 12, fontFamily: fonts.regular, color: colors.ink500, marginTop: 1 },
  replyBarClose: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },

  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 8, paddingVertical: 8, gap: 6,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.green100, alignItems: "center", justifyContent: "center",
  },
  input: {
    flex: 1, backgroundColor: colors.ink50, borderRadius: 22,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    paddingHorizontal: 16, fontSize: 15, fontFamily: fonts.regular, color: colors.ink900,
    maxHeight: 120, borderWidth: 1, borderColor: colors.borderLight,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: colors.ink100 },
});

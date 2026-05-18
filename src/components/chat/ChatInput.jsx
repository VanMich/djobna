// src/components/chat/ChatInput.js
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../config/supabase";
import { colors } from "../../theme";

export default function ChatInput({
  onSendMessage,
  onSendImage,
  onSendDevis,
  userRole,
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  // Menu pièce jointe
  const handleAttach = () => {
    // Options selon le Role
    const options = [
      {
        text: "📷 Photo",
        onPress: handlePickImage,
      },
    ];
    // Seul le prestataire peut envoyer un devis
    if (userRole === "provider") {
      options.push({
        text: "📋 Envoyer un devis",
        onPress: handleSendDevis,
      });
    }

    options.push({ text: "Annuler", style: "cancel" });

    Alert.alert("Envoyer", "", options);
  };

  // Choisir une image, l'uploader dans Supabase Storage puis appeler onSendImage avec l'URL publique
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled || !onSendImage) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const { data: { user } } = await supabase.auth.getUser();
      const blob = await fetch(uri).then((r) => r.blob());
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("chat-images").upload(path, blob);
      if (error) throw error;
      const publicUrl = supabase.storage.from("chat-images").getPublicUrl(path).data.publicUrl;
      onSendImage(publicUrl);
    } catch (err) {
      console.error("Erreur upload image chat:", err);
      Alert.alert("Erreur", "Impossible d'envoyer l'image. Réessayez.");
    } finally {
      setUploading(false);
    }
  };

  // Envoyer un devis (formulaire simplifié)
  const handleSendDevis = () => {
    // Ici on ouvre un Alert avec des champs
    // En production ce serait un BottomSheet avec un formulaire
    Alert.prompt(
      "Titre du devis",
      "Ex : Vidange Toyota Corolla",
      [
        {
          text: "Suivant →",
          onPress: (title) => {
            Alert.prompt(
              "Montant (FCFA)",
              "Ex : 7500",
              [
                {
                  text: "Envoyer",
                  onPress: (price) => {
                    if (title && price && onSendDevis) {
                      onSendDevis({
                        title,
                        price: parseInt(price),
                        description: "Pièces et déplacement inclus",
                      });
                    }
                  },
                },
                { text: "Annuler", style: "cancel" },
              ],
              "plain-text",
            );
          },
        },
        { text: "Annuler", style: "cancel" },
      ],
      "plain-text",
    );
  };

  return (
    <View style={styles.container}>
      {/* Bouton pièce jointe — désactivé pendant l'upload */}
      <TouchableOpacity
        style={[styles.attachBtn, uploading && { opacity: 0.5 }]}
        onPress={handleAttach}
        activeOpacity={0.8}
        disabled={uploading}
      >
        <Ionicons name={uploading ? "cloud-upload-outline" : "attach"} size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Champ de texte */}
      <TextInput
        style={styles.input}
        placeholder="Écrire un message…"
        placeholderTextColor="#AAB0B7"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />

      {/* Bouton envoyer */}
      <TouchableOpacity
        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={!text.trim()}
        activeOpacity={0.85}
      >
        <Ionicons name="send" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEF0EF",
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0FAF6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.5, elevation: 0 },
});

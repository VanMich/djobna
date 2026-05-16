// src/components/providerOwnProfile/EditProfileSheet.jsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { QUARTIERS_DOUALA } from "../../constants/services";
import { colors, radius } from "../../theme";

export default function EditProfileSheet({
  visible,
  onClose,
  profile,
  provider,
  onSave,
}) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [quartier, setQuartier] = useState("");
  const [showQPicker, setShowQPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDisplayName(profile?.displayName || "");
    setBio(provider?.bio || "");
    setQuartier(profile?.quartier || "");
    setShowQPicker(false);
  }, [profile, provider, visible]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Erreur", "Entrez votre nom complet");
      return;
    }

    setSaving(true);
    const result = await onSave({
      displayName: displayName.trim(),
      bio: bio.trim(),
      quartier,
    });
    setSaving(false);

    if (result.success) {
      onClose();
    } else {
      Alert.alert("Erreur", "Impossible d'enregistrer. Réessayez.");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtn}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Modifier le profil</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Text style={styles.label}>NOM COMPLET</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ex : Paul Nguema"
              placeholderTextColor="#AAB0B7"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>BIO / DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="Décrivez votre expérience, vos spécialités..."
              placeholderTextColor="#AAB0B7"
              multiline
              numberOfLines={4}
              maxLength={300}
            />
            <Text style={styles.charCount}>{bio.length}/300</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>QUARTIER PRINCIPAL</Text>
            <TouchableOpacity
              style={[styles.picker, quartier && styles.pickerSelected]}
              onPress={() => setShowQPicker(!showQPicker)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pickerText,
                  !quartier && styles.pickerPlaceholder,
                ]}
              >
                {quartier || "Choisissez votre quartier"}
              </Text>
              <Ionicons
                name={showQPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color="#AAB0B7"
              />
            </TouchableOpacity>

            {showQPicker && (
              <View style={styles.pickerList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {QUARTIERS_DOUALA.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[
                        styles.pickerItem,
                        quartier === q && styles.pickerItemActive,
                      ]}
                      onPress={() => {
                        setQuartier(q);
                        setShowQPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          quartier === q && styles.pickerItemTextActive,
                        ]}
                      >
                        {q}
                      </Text>
                      {quartier === q && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0EF",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111" },
  cancelBtn: { fontSize: 14, color: "#888", fontWeight: "500" },
  saveBtn: { fontSize: 14, color: colors.primary, fontWeight: "700" },
  saveBtnDisabled: { opacity: 0.5 },
  content: { padding: 20, gap: 20 },
  field: { gap: 6 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#AAB0B7",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14,
    color: "#111",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
  },
  inputMultiline: {
    height: 120,
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, color: "#AAB0B7", textAlign: "right" },
  picker: {
    backgroundColor: "#F5F5F5",
    borderRadius: radius.md,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
  },
  pickerSelected: { borderColor: colors.primary, backgroundColor: "#F0FAF6" },
  pickerText: { fontSize: 14, color: "#111", fontWeight: "500" },
  pickerPlaceholder: { color: "#AAB0B7", fontWeight: "400" },
  pickerList: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    elevation: 4,
  },
  pickerItem: {
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  pickerItemActive: { backgroundColor: "#F0FAF6" },
  pickerItemText: { fontSize: 14, color: "#111" },
  pickerItemTextActive: { color: colors.primary, fontWeight: "600" },
});

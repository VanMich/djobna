// src/screens/ProfileSetupScreen.jsx
// Formulaire de création du profil — affiché une seule fois après la première connexion.
//
// Remplace Firebase :
//   auth.currentUser?.phoneNumber → supabase.auth.getUser() (async, user.phone)
//   Le reste est délégué à useProfile.js

import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../config/supabase";
import { QUARTIERS_DOUALA } from "../constants/services";
import { useProfile } from "../hooks/useProfile";
import { colors, radius, spacing } from "../theme";

export default function ProfileSetupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState("");
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [pays, setPays] = useState("Cameroun");
  const [photoUri, setPhotoUri] = useState(null);
  const [showQuartierPicker, setShowQuartierPicker] = useState(false);
  const [phone, setPhone] = useState("");

  const { createProfile, loading } = useProfile();

  // Récupérer le numéro de téléphone de l'utilisateur connecté
  // Remplace auth.currentUser?.phoneNumber (synchrone Firebase)
  // Supabase : user.phone (= numéro E.164 utilisé lors du signInWithOtp)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setPhone(data?.user?.phone || "");
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Nous avons besoin d'accéder à vos photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      Alert.alert("Erreur", "Entrez votre nom complet");
      return;
    }
    if (!ville.trim()) {
      Alert.alert("Erreur", "Entrez votre ville");
      return;
    }
    if (!quartier) {
      Alert.alert("Erreur", "Choisissez votre quartier");
      return;
    }
    if (!pays.trim()) {
      Alert.alert("Erreur", "Entrez votre pays");
      return;
    }

    const result = await createProfile({
      displayName: displayName.trim(),
      ville: ville.trim(),
      quartier,
      pays: pays.trim(),
      photoUri,
    });

    if (result.success) {
      navigation.replace("MainApp");
    } else {
      Alert.alert("Erreur", "Impossible de créer le profil. Réessayez.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Création du profil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.brand}>Djobna</Text>
        <Text style={styles.title}>Créez votre profil</Text>
        <Text style={styles.subtitle}>Ces informations seront visibles sur votre compte</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Téléphone pré-rempli — non modifiable */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NUMÉRO DE TÉLÉPHONE</Text>
          <View style={styles.inputReadOnly}>
            <Text style={styles.inputReadOnlyText}>{phone}</Text>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        </View>

        {/* Nom complet */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NOM COMPLET *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Jean-Baptiste Mbarga"
            placeholderTextColor={colors.textGray}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>

        {/* Photo de profil */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PHOTO DE PROFIL (OPTIONNEL)</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoPreview} onPress={pickImage} activeOpacity={0.8}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              ) : (
                <Text style={styles.photoPlaceholder}>👤</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.8}>
              <Text style={styles.photoBtnText}>
                {photoUri ? "Changer la photo" : "Choisir une photo"}
              </Text>
              <Text style={styles.photoBtnSub}>Depuis votre galerie</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ville */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>VILLE *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Douala"
            placeholderTextColor={colors.textGray}
            value={ville}
            onChangeText={setVille}
            autoCapitalize="words"
          />
        </View>

        {/* Quartier */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>QUARTIER *</Text>
          <TouchableOpacity
            style={[styles.picker, quartier && styles.pickerSelected]}
            onPress={() => setShowQuartierPicker(!showQuartierPicker)}
          >
            <Text style={[styles.pickerText, !quartier && styles.pickerPlaceholder]}>
              {quartier || "Choisissez votre quartier"}
            </Text>
            <Text style={styles.pickerArrow}>{showQuartierPicker ? "▴" : "▾"}</Text>
          </TouchableOpacity>
          {showQuartierPicker && (
            <View style={styles.pickerDropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {QUARTIERS_DOUALA.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.pickerItem, quartier === q && styles.pickerItemSelected]}
                    onPress={() => {
                      setQuartier(q);
                      setShowQuartierPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        quartier === q && styles.pickerItemTextSelected,
                      ]}
                    >
                      {q}
                    </Text>
                    {quartier === q && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Pays */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PAYS *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Cameroun"
            placeholderTextColor={colors.textGray}
            value={pays}
            onChangeText={setPays}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.btnText}>Créer mon profil →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textGray },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: 6,
  },
  brand: { fontSize: 18, fontWeight: "800", color: colors.primary },
  title: { fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 },
  subtitle: { fontSize: 13, color: colors.textLight },
  scroll: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textGray,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.textDark,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputReadOnly: {
    backgroundColor: "#F4F4F4",
    borderRadius: radius.md,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputReadOnlyText: { fontSize: 15, color: colors.textGray, fontWeight: "500" },
  lockIcon: { fontSize: 14 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  photoImage: { width: 64, height: 64 },
  photoPlaceholder: { fontSize: 28 },
  photoBtn: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 2,
  },
  photoBtnText: { fontSize: 13, color: colors.textDark, fontWeight: "600" },
  photoBtnSub: { fontSize: 11, color: colors.textGray },
  picker: {
    backgroundColor: colors.lightGray,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pickerSelected: { borderColor: colors.primary, backgroundColor: "#F0FAF6" },
  pickerText: { fontSize: 14, color: colors.textDark, fontWeight: "500" },
  pickerPlaceholder: { color: colors.textGray, fontWeight: "400" },
  pickerArrow: { fontSize: 12, color: colors.textGray },
  pickerDropdown: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pickerItem: {
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: { backgroundColor: "#F0FAF6" },
  pickerItemText: { fontSize: 14, color: colors.textDark },
  pickerItemTextSelected: { color: colors.primary, fontWeight: "600" },
  checkMark: { fontSize: 14, color: colors.primary, fontWeight: "700" },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

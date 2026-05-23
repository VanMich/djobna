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
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../config/supabase";
import { QUARTIERS_PAR_VILLE } from "../constants/services";
import { useProfile } from "../hooks/useProfile";
import { Input, Select, Button } from "../components/ui";
import Icon from "../components/ui/Icon";
import { colors, radius, spacing, typography } from "../theme";

export default function ProfileSetupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState("");
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [pays, setPays] = useState("Cameroun");
  const [photoUri, setPhotoUri] = useState(null);
  const [phone, setPhone] = useState("");

  const { createProfile, loading } = useProfile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPhone(session?.user?.phone || "");
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

  const quartiersForVille = QUARTIERS_PAR_VILLE[ville] || [];

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
        {/* Téléphone pré-rempli */}
        <Input
          label="NUMÉRO DE TÉLÉPHONE"
          value={phone}
          readOnly
        />

        {/* Nom complet */}
        <Input
          label="NOM COMPLET *"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Ex : Jean-Baptiste Mbarga"
          autoCapitalize="words"
        />

        {/* Photo de profil */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PHOTO DE PROFIL (OPTIONNEL)</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoPreview} onPress={pickImage} activeOpacity={0.8}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              ) : (
                <Icon name="camera" size={28} color="#CCC" weight="duotone" />
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
        <Input
          label="VILLE *"
          value={ville}
          onChangeText={(v) => {
            setVille(v);
            setQuartier(""); // reset quartier on city change
          }}
          placeholder="Ex : Douala"
          autoCapitalize="words"
        />

        {/* Quartier */}
        <Select
          label="QUARTIER *"
          value={quartier}
          options={quartiersForVille}
          onSelect={setQuartier}
          placeholder="Choisissez votre quartier"
          allowCustom={quartiersForVille.length === 0}
          customPlaceholder="Entrez votre quartier"
          searchable={quartiersForVille.length > 10}
        />

        {/* Pays */}
        <Input
          label="PAYS *"
          value={pays}
          onChangeText={setPays}
          placeholder="Ex : Cameroun"
          autoCapitalize="words"
        />

        <Button
          title="Créer mon profil →"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.headerBg },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: 6,
  },
  brand: { fontSize: 18, fontWeight: "800", color: colors.primary },
  title: { fontSize: 26, fontWeight: "700", color: colors.headerText, lineHeight: 34 },
  subtitle: { fontSize: 13, color: colors.headerSubtext },
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  inputGroup: { gap: 6 },
  label: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  photoImage: { width: 64, height: 64 },
  photoBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 2,
  },
  photoBtnText: { fontSize: 13, color: colors.textPrimary, fontWeight: "600" },
  photoBtnSub: { fontSize: 11, color: colors.textSecondary },
});

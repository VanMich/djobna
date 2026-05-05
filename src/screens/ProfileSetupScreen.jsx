// src/screens/ProfileSetupScreen.js
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
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
import { QUARTIERS_DOUALA, SERVICES } from "../constants/services";
import { useProfile } from "../hooks/useProfile";
import { colors, radius, spacing } from "../theme";

export default function ProfileSetupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("client");
  const [displayName, setDisplayName] = useState("");
  const [quartier, setQuartier] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showQuartierPicker, setShowQuartierPicker] = useState(false);

  const { createProfile, loading } = useProfile();

  // ─── Données selon l'étape ─────────────────────────
  const steps = [
    {
      label: "ÉTAPE 1 / 3",
      title: "Vous êtes…",
      subtitle: "Choisissez votre rôle sur Djobna",
    },
    {
      label: "ÉTAPE 2 / 3",
      title: "Vos informations",
      subtitle: "Visibles sur votre profil",
    },
    {
      label: "ÉTAPE 3 / 3",
      title: "Vos spécialités",
      subtitle: "Sélectionnez tout ce que vous proposez",
    },
  ];

  const progressWidth = ["33%", "66%", "100%"][step];

  // ─── Photo picker ──────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin d'accéder à vos photos.",
      );
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

  // ─── Toggle service ────────────────────────────────
  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  // ─── Continuer étape 1 → 2 ────────────────────────
  const handleContinueRole = () => setStep(1);

  // ─── Continuer étape 2 → 3 ou créer profil ────────
  const handleContinueInfos = () => {
    if (!displayName.trim()) {
      Alert.alert("Erreur", "Entrez votre nom complet");
      return;
    }
    if (!quartier) {
      Alert.alert("Erreur", "Choisissez votre quartier");
      return;
    }
    role === "client" ? handleCreateProfile() : setStep(2);
  };

  // ─── Créer le profil Firestore ─────────────────────
  const handleCreateProfile = async () => {
    if (role === "provider" && selectedServices.length === 0) {
      Alert.alert("Erreur", "Sélectionnez au moins une spécialité");
      return;
    }
    const result = await createProfile({
      displayName: displayName.trim(),
      quartier,
      photoURL: null,
      role,
      services: role === "provider" ? selectedServices : undefined,
    });
    if (result.success) {
      navigation.replace(role === "provider" ? "HomeProvider" : "Home");
    } else {
      Alert.alert("Erreur", result.message || "Échec de création du profil");
    }
  };

  // ─── Loader ────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Création du profil...</Text>
      </View>
    );
  }

  // ─── Rendu principal ───────────────────────────────
  return (
    // SafeAreaView gère les encoches iPhone (notch, dynamic island)
    <SafeAreaView style={styles.safeArea}>
      {/* ── HEADER FIXE (en dehors du ScrollView) ── */}
      <View style={styles.header}>
        {/* Barre de progression tout en haut */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {/* Bouton retour (sauf à l'étape 0) */}
        {step > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        )}

        {/* Textes du header */}
        <Text style={styles.stepLabel}>{steps[step].label}</Text>
        <Text style={styles.title}>{steps[step].title}</Text>
        <Text style={styles.subtitle}>{steps[step].subtitle}</Text>
      </View>

      {/* ── CONTENU qui défile ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        // keyboardShouldPersistTaps="handled" → le clavier ne se ferme pas
        // si on tape en dehors d'un TextInput (évite les fermetures accidentelles)
        showsVerticalScrollIndicator={false}
      >
        {/* ════════════════════════════════════ */}
        {/* ÉTAPE 0 — Choix du rôle             */}
        {/* ════════════════════════════════════ */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <View style={styles.roleGrid}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === "client" && styles.roleCardSelected,
                ]}
                onPress={() => setRole("client")}
                activeOpacity={0.8}
              >
                <Text style={styles.roleIcon}>🙋</Text>
                <Text
                  style={[
                    styles.roleName,
                    role === "client" && styles.roleNameSelected,
                  ]}
                >
                  Client
                </Text>
                <Text style={styles.roleDesc}>
                  Je cherche des prestataires de service
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === "provider" && styles.roleCardSelected,
                ]}
                onPress={() => setRole("provider")}
                activeOpacity={0.8}
              >
                <Text style={styles.roleIcon}>🔧</Text>
                <Text
                  style={[
                    styles.roleName,
                    role === "provider" && styles.roleNameSelected,
                  ]}
                >
                  Prestataire
                </Text>
                <Text style={styles.roleDesc}>
                  Je propose mes services professionnels
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Vous pourrez changer de rôle ou avoir les deux à la fois plus
                tard depuis votre profil.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleContinueRole}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Continuer →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ════════════════════════════════════ */}
        {/* ÉTAPE 1 — Informations              */}
        {/* ════════════════════════════════════ */}
        {step === 1 && (
          <View style={styles.stepContent}>
            {/* Nom */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOM COMPLET</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Jean-Baptiste Mbarga"
                placeholderTextColor={colors.textGray}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>

            {/* Quartier */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>QUARTIER À DOUALA</Text>
              <TouchableOpacity
                style={[styles.picker, quartier && styles.pickerSelected]}
                onPress={() => setShowQuartierPicker(!showQuartierPicker)}
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
                <Text style={styles.pickerArrow}>
                  {showQuartierPicker ? "▴" : "▾"}
                </Text>
              </TouchableOpacity>

              {/* Liste déroulante quartiers */}
              {showQuartierPicker && (
                <View style={styles.pickerDropdown}>
                  <ScrollView
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled={true}
                    // nestedScrollEnabled = true obligatoire pour un ScrollView
                    // imbriqué dans un autre ScrollView (Android)
                  >
                    {QUARTIERS_DOUALA.map((q) => (
                      <TouchableOpacity
                        key={q}
                        style={[
                          styles.pickerItem,
                          quartier === q && styles.pickerItemSelected,
                        ]}
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
                        {quartier === q && (
                          <Text style={styles.checkMark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Photo de profil */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PHOTO DE PROFIL (OPTIONNEL)</Text>
              <View style={styles.photoRow}>
                <View style={styles.photoPreview}>
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <Text style={styles.photoPlaceholder}>👤</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoBtnText}>
                    {photoUri ? "Changer la photo" : "Choisir une photo"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleContinueInfos}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {role === "client" ? "Créer mon profil →" : "Continuer →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ════════════════════════════════════ */}
        {/* ÉTAPE 2 — Services (provider)       */}
        {/* ════════════════════════════════════ */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.servicesGrid}>
              {SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceChip,
                      isSelected && styles.serviceChipSelected,
                    ]}
                    onPress={() => toggleService(service.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <Text
                      style={[
                        styles.serviceLabel,
                        isSelected && styles.serviceLabelSelected,
                      ]}
                    >
                      {service.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.serviceCount}>
              {selectedServices.length} spécialité
              {selectedServices.length > 1 ? "s" : ""} sélectionnée
              {selectedServices.length > 1 ? "s" : ""}
            </Text>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleCreateProfile}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Créer mon profil →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Conteneurs principaux ─────────────────
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    // backgroundColor ici = couleur derrière la SafeArea (zone encoche iPhone)
    // → donne l'impression que le header remonte jusqu'en haut de l'écran
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textGray },

  // ── Header fixe ───────────────────────────
  header: {
    backgroundColor: colors.background, // #0D1F1A → fond sombre comme la maquette
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: 6,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  backBtn: { marginBottom: 6 },
  backText: { color: colors.primary, fontSize: 14, fontWeight: "500" },
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  title: { fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 },
  subtitle: { fontSize: 13, color: colors.textLight },

  // ── Scroll ────────────────────────────────
  scroll: { flex: 1, backgroundColor: "#fff" },
  // backgroundColor: '#fff' → le scroll devient blanc en dessous du header
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  stepContent: { gap: spacing.md },

  // ── Rôle ──────────────────────────────────
  roleGrid: { flexDirection: "row", gap: 12 },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F0FAF6",
  },
  roleIcon: { fontSize: 32 },
  roleName: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  roleNameSelected: { color: colors.primary },
  roleDesc: {
    fontSize: 11,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 16,
  },

  infoBox: {
    backgroundColor: "#F0FAF6",
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "#9FE1CB",
  },
  infoText: { fontSize: 12, color: "#0F6E56", lineHeight: 18 },

  // ── Inputs ────────────────────────────────
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

  // ── Picker quartier ───────────────────────
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
    // Ombre (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // Élévation (Android)
    elevation: 4,
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

  // ── Photo profil ──────────────────────────
  photoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  photoPreview: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  photoImage: { width: 60, height: 60, borderRadius: 16 },
  photoPlaceholder: { fontSize: 26 },
  photoBtn: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: radius.md,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  photoBtnText: { fontSize: 13, color: colors.textGray, fontWeight: "600" },

  // ── Services ──────────────────────────────
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  serviceChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F0FAF6",
  },
  serviceIcon: { fontSize: 16 },
  serviceLabel: { fontSize: 12, fontWeight: "600", color: colors.textDark },
  serviceLabelSelected: { color: colors.primary },
  serviceCount: {
    fontSize: 12,
    color: colors.textGray,
    textAlign: "center",
    marginTop: 4,
  },

  // ── Bouton principal ──────────────────────
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: spacing.sm,
    // Ombre (iOS)
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // Élévation (Android)
    elevation: 4,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

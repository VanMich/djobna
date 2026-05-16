// src/screens/ProfileSetupScreen.js
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
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

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

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
      navigation.replace("MainApp");
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
      {/* Header fixe */}
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.stepLabel}>{steps[step].label}</Text>
        <Text style={styles.title}>{steps[step].title}</Text>
        <Text style={styles.subtitle}>{steps[step].subtitle}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ÉTAPE 0 : Rôle */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <View style={styles.roleGrid}>
              {[
                {
                  id: "client",
                  icon: "🙋",
                  name: "Client",
                  desc: "Je cherche des prestataires",
                },
                {
                  id: "provider",
                  icon: "🔧",
                  name: "Prestataire",
                  desc: "Je propose mes services",
                },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.roleCard,
                    role === r.id && styles.roleCardSelected,
                  ]}
                  onPress={() => setRole(r.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.roleIcon}>{r.icon}</Text>
                  <Text
                    style={[
                      styles.roleName,
                      role === r.id && styles.roleNameSelected,
                    ]}
                  >
                    {r.name}
                  </Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Vous pourrez changer de rôle plus tard depuis votre profil.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => setStep(1)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Continuer →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ÉTAPE 1 : Infos */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOM COMPLET</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Jean-Baptiste Mbarga"
                placeholderTextColor={colors.textGray}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>QUARTIER À DOUALA</Text>
              <TouchableOpacity
                style={[styles.picker, quartier && styles.pickerSelected]}
                onPress={() => setShowQuartierPicker(!showQuartierPicker)}
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
              {showQuartierPicker && (
                <View style={styles.pickerDropdown}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
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

        {/* ÉTAPE 2 : Services */}
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
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  progressFill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },
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
  scroll: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },
  stepContent: { gap: spacing.md },
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
  roleCardSelected: { borderColor: colors.primary, backgroundColor: "#F0FAF6" },
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

// src/screens/ProviderSetupScreen.jsx
// Formulaire d'inscription prestataire en 5 étapes.
//
// Remplace Firebase :
//   auth.currentUser?.phoneNumber → supabase.auth.getUser() (async, user.phone)
//   auth.currentUser + getDoc(doc(db,'users',uid)) → supabase.auth.getUser() + supabase.from('users')
//   d.displayName → d.display_name  |  d.ville → d.ville (inchangé)
//   Le reste de la logique de soumission est dans useProviderSetup.js

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
import { SERVICES, QUARTIERS_DOUALA } from "../constants/services";
import { useProviderSetup } from "../hooks/useProviderSetup";
import { colors, radius, spacing } from "../theme";

const LANGUAGES = ["Français", "Anglais", "Duala", "Bamiléké", "Ewondo", "Fufuldé", "Pidgin"];
const UNITS = ["Par intervention", "Par heure", "Par jour"];

const STEPS = [
  { label: "ÉTAPE 1 / 5", title: "Infos personnelles", subtitle: "Vos coordonnées de prestataire" },
  { label: "ÉTAPE 2 / 5", title: "Services & Tarifs", subtitle: "Ce que vous proposez et à quel prix" },
  { label: "ÉTAPE 3 / 5", title: "Votre profil", subtitle: "Présentez votre expérience" },
  { label: "ÉTAPE 4 / 5", title: "Vérification d'identité", subtitle: "Documents requis pour valider votre compte" },
  { label: "ÉTAPE 5 / 5", title: "Récapitulatif", subtitle: "Vérifiez avant de soumettre" },
];

export default function ProviderSetupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const { submitProviderProfile, loading } = useProviderSetup();

  // ── Étape 1 ─────────────────────────────────────────
  const [displayName, setDisplayName] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [pays, setPays] = useState("Cameroun");
  const [interventionZones, setInterventionZones] = useState([]);
  const [showQuartierPicker, setShowQuartierPicker] = useState(false);
  const [showZonesPicker, setShowZonesPicker] = useState(false);

  // ── Étape 2 ─────────────────────────────────────────
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  // { [serviceId]: { customLabel, minPrice, maxPrice, unit } }
  const [servicePricing, setServicePricing] = useState({});

  // ── Étape 3 ─────────────────────────────────────────
  const [bio, setBio] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [languages, setLanguages] = useState([]);

  // ── Étape 4 ─────────────────────────────────────────
  const [cniRecto, setCniRecto] = useState(null);
  const [cniVerso, setCniVerso] = useState(null);
  const [selfie, setSelfie] = useState(null);

  const [phone, setPhone] = useState("");

  // Pré-remplissage depuis le profil client existant
  // Remplace auth.currentUser + getDoc(doc(db,'users',uid))
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: authData }) => {
      const user = authData?.user;
      if (!user) return;

      // Récupère le numéro de téléphone — user.phone sous Supabase (= user.phoneNumber Firebase)
      setPhone(user.phone || "");

      // Pré-remplit le formulaire depuis le profil client
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, ville, quartier, pays")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");  // display_name (snake_case) → state displayName
        setVille(profile.ville || "");
        setQuartier(profile.quartier || "");
        setPays(profile.pays || "Cameroun");
      }
    });
  }, []);

  // ── Helpers photos ───────────────────────────────────
  const pickPhoto = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée", "Accès à la galerie requis."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée", "Accès à la caméra requis."); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled) setSelfie(result.assets[0].uri);
  };

  // ── Helpers services ─────────────────────────────────
  const toggleService = (svc) => {
    if (selectedServiceIds.includes(svc.id)) {
      setSelectedServiceIds((prev) => prev.filter((id) => id !== svc.id));
      setServicePricing((prev) => { const { [svc.id]: _, ...rest } = prev; return rest; });
    } else {
      setSelectedServiceIds((prev) => [...prev, svc.id]);
      setServicePricing((prev) => ({
        ...prev,
        [svc.id]: { customLabel: svc.label, minPrice: "", maxPrice: "", unit: "Par intervention" },
      }));
    }
  };

  const updatePricing = (serviceId, field, value) => {
    setServicePricing((prev) => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], [field]: value },
    }));
  };

  const toggleZone = (zone) => {
    setInterventionZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  const toggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // ── Validation par étape ─────────────────────────────
  const validateStep = () => {
    switch (step) {
      case 0:
        if (!displayName.trim()) { Alert.alert("Requis", "Entrez votre nom complet."); return false; }
        if (!photoUri) { Alert.alert("Requis", "Ajoutez une photo de profil."); return false; }
        if (!ville.trim()) { Alert.alert("Requis", "Entrez votre ville."); return false; }
        if (!quartier) { Alert.alert("Requis", "Choisissez votre quartier."); return false; }
        if (interventionZones.length === 0) { Alert.alert("Requis", "Sélectionnez au moins une zone d'intervention."); return false; }
        return true;
      case 1:
        if (selectedServiceIds.length === 0) { Alert.alert("Requis", "Sélectionnez au moins un service."); return false; }
        for (const id of selectedServiceIds) {
          const p = servicePricing[id];
          if (!p?.customLabel?.trim()) { Alert.alert("Requis", "Renseignez l'intitulé de chaque service."); return false; }
          if (!p?.minPrice || !p?.maxPrice) { Alert.alert("Requis", "Renseignez les tarifs min et max."); return false; }
          if (Number(p.minPrice) >= Number(p.maxPrice)) { Alert.alert("Erreur", "Le tarif max doit être supérieur au tarif min."); return false; }
        }
        return true;
      case 2:
        if (bio.trim().length < 50) { Alert.alert("Requis", "La description doit faire au moins 50 caractères."); return false; }
        if (bio.trim().length > 500) { Alert.alert("Trop long", "La description ne doit pas dépasser 500 caractères."); return false; }
        if (languages.length === 0) { Alert.alert("Requis", "Sélectionnez au moins une langue."); return false; }
        return true;
      case 3:
        if (!cniRecto) { Alert.alert("Requis", "Ajoutez la photo recto de votre CNI."); return false; }
        if (!cniVerso) { Alert.alert("Requis", "Ajoutez la photo verso de votre CNI."); return false; }
        if (!selfie) { Alert.alert("Requis", "Prenez un selfie avec votre CNI en main."); return false; }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const services = selectedServiceIds.map((id) => ({
      type: id,
      customLabel: servicePricing[id].customLabel,
      minPrice: Number(servicePricing[id].minPrice),
      maxPrice: Number(servicePricing[id].maxPrice),
      unit: servicePricing[id].unit,
    }));

    const result = await submitProviderProfile({
      displayName, photoUri, ville, quartier, pays, interventionZones,
      services, bio: bio.trim(),
      yearsOfExperience: yearsExp,
      languages, cniRecto, cniVerso, selfie,
    });

    if (result.success) {
      navigation.replace("VerificationPending");
    } else {
      Alert.alert("Erreur", "Impossible de soumettre le dossier. Réessayez.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Envoi du dossier...</Text>
      </View>
    );
  }

  const progressWidth = `${((step + 1) / 5) * 100}%`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* ── Header fixe ── */}
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        )}
        {step === 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Annuler</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.stepLabel}>{STEPS[step].label}</Text>
        <Text style={styles.title}>{STEPS[step].title}</Text>
        <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ════════════════════════════════════════
            ÉTAPE 1 — Infos personnelles
        ════════════════════════════════════════ */}
        {step === 0 && (
          <View style={styles.stepContent}>
            {/* Téléphone (lecture seule) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TÉLÉPHONE</Text>
              <View style={styles.inputReadOnly}>
                <Text style={styles.inputReadOnlyText}>{phone}</Text>
                <Text>🔒</Text>
              </View>
            </View>

            {/* Nom complet */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOM COMPLET *</Text>
              <TextInput style={styles.input} value={displayName}
                onChangeText={setDisplayName} autoCapitalize="words"
                placeholder="Ex : Jean-Baptiste Mbarga" placeholderTextColor={colors.textGray} />
            </View>

            {/* Photo de profil */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PHOTO DE PROFIL * (obligatoire)</Text>
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoPreview} onPress={() => pickPhoto(setPhotoUri)} activeOpacity={0.8}>
                  {photoUri
                    ? <Image source={{ uri: photoUri }} style={styles.photoImage} />
                    : <Text style={styles.photoPlaceholder}>👤</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto(setPhotoUri)} activeOpacity={0.8}>
                  <Text style={styles.photoBtnText}>{photoUri ? "Changer la photo" : "Ajouter une photo"}</Text>
                  <Text style={styles.photoBtnSub}>Depuis votre galerie</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ville */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>VILLE *</Text>
              <TextInput style={styles.input} value={ville} onChangeText={setVille}
                autoCapitalize="words" placeholder="Ex : Douala" placeholderTextColor={colors.textGray} />
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
                      <TouchableOpacity key={q}
                        style={[styles.pickerItem, quartier === q && styles.pickerItemSelected]}
                        onPress={() => { setQuartier(q); setShowQuartierPicker(false); }}>
                        <Text style={[styles.pickerItemText, quartier === q && styles.pickerItemTextSelected]}>{q}</Text>
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
              <TextInput style={styles.input} value={pays} onChangeText={setPays}
                autoCapitalize="words" placeholder="Ex : Cameroun" placeholderTextColor={colors.textGray} />
            </View>

            {/* Zones d'intervention */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ZONES D'INTERVENTION * ({interventionZones.length} sélectionnée{interventionZones.length > 1 ? "s" : ""})</Text>
              <TouchableOpacity
                style={[styles.picker, interventionZones.length > 0 && styles.pickerSelected]}
                onPress={() => setShowZonesPicker(!showZonesPicker)}
              >
                <Text style={[styles.pickerText, interventionZones.length === 0 && styles.pickerPlaceholder]} numberOfLines={1}>
                  {interventionZones.length > 0 ? interventionZones.join(", ") : "Sélectionnez vos zones"}
                </Text>
                <Text style={styles.pickerArrow}>{showZonesPicker ? "▴" : "▾"}</Text>
              </TouchableOpacity>
              {showZonesPicker && (
                <View style={styles.pickerDropdown}>
                  <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                    {QUARTIERS_DOUALA.map((z) => (
                      <TouchableOpacity key={z}
                        style={[styles.pickerItem, interventionZones.includes(z) && styles.pickerItemSelected]}
                        onPress={() => toggleZone(z)}>
                        <Text style={[styles.pickerItemText, interventionZones.includes(z) && styles.pickerItemTextSelected]}>{z}</Text>
                        {interventionZones.includes(z) && <Text style={styles.checkMark}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════
            ÉTAPE 2 — Services & Tarifs
        ════════════════════════════════════════ */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionHint}>Sélectionnez vos services puis définissez vos tarifs.</Text>

            {/* Chips de sélection des services */}
            <View style={styles.chipsWrap}>
              {SERVICES.map((svc) => {
                const selected = selectedServiceIds.includes(svc.id);
                return (
                  <TouchableOpacity key={svc.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleService(svc)} activeOpacity={0.8}>
                    <Text style={styles.chipIcon}>{svc.icon}</Text>
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{svc.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Formulaire de tarification par service sélectionné */}
            {selectedServiceIds.map((id) => {
              const svc = SERVICES.find((s) => s.id === id);
              const p = servicePricing[id] || {};
              return (
                <View key={id} style={styles.pricingCard}>
                  <Text style={styles.pricingCardTitle}>{svc?.icon} {svc?.label}</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>INTITULÉ PERSONNALISÉ</Text>
                    <TextInput style={styles.input} value={p.customLabel}
                      onChangeText={(v) => updatePricing(id, "customLabel", v)}
                      placeholder={`Ex : ${svc?.label} à domicile`} placeholderTextColor={colors.textGray} />
                  </View>

                  <View style={styles.priceRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>MIN (FCFA)</Text>
                      <TextInput style={styles.input} value={p.minPrice}
                        onChangeText={(v) => updatePricing(id, "minPrice", v)}
                        keyboardType="numeric" placeholder="5 000" placeholderTextColor={colors.textGray} />
                    </View>
                    <Text style={styles.priceSeparator}>—</Text>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>MAX (FCFA)</Text>
                      <TextInput style={styles.input} value={p.maxPrice}
                        onChangeText={(v) => updatePricing(id, "maxPrice", v)}
                        keyboardType="numeric" placeholder="20 000" placeholderTextColor={colors.textGray} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>UNITÉ</Text>
                    <View style={styles.unitRow}>
                      {UNITS.map((u) => (
                        <TouchableOpacity key={u}
                          style={[styles.unitBtn, p.unit === u && styles.unitBtnSelected]}
                          onPress={() => updatePricing(id, "unit", u)} activeOpacity={0.8}>
                          <Text style={[styles.unitBtnText, p.unit === u && styles.unitBtnTextSelected]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ════════════════════════════════════════
            ÉTAPE 3 — Description & Expérience
        ════════════════════════════════════════ */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DESCRIPTION / BIO * ({bio.length}/500)</Text>
              <TextInput style={[styles.input, styles.inputMultiline]}
                value={bio} onChangeText={setBio}
                multiline numberOfLines={5} maxLength={500}
                placeholder="Décrivez votre expertise, votre façon de travailler, ce qui vous distingue... (min. 50 caractères)"
                placeholderTextColor={colors.textGray} textAlignVertical="top" />
              {bio.length > 0 && bio.length < 50 && (
                <Text style={styles.hintError}>{50 - bio.length} caractères manquants</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ANNÉES D'EXPÉRIENCE</Text>
              <TextInput style={styles.input} value={yearsExp} onChangeText={setYearsExp}
                keyboardType="numeric" placeholder="Ex : 5" placeholderTextColor={colors.textGray} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LANGUES PARLÉES *</Text>
              <View style={styles.chipsWrap}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity key={lang}
                    style={[styles.chip, languages.includes(lang) && styles.chipSelected]}
                    onPress={() => toggleLanguage(lang)} activeOpacity={0.8}>
                    <Text style={[styles.chipLabel, languages.includes(lang) && styles.chipLabelSelected]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════
            ÉTAPE 4 — Vérification d'identité (KYC)
        ════════════════════════════════════════ */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Ces documents sont nécessaires pour valider votre compte. Ils sont traités de manière confidentielle.
              </Text>
            </View>

            {/* CNI Recto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CNI RECTO *</Text>
              <TouchableOpacity style={styles.kycBtn} onPress={() => pickPhoto(setCniRecto)} activeOpacity={0.8}>
                {cniRecto
                  ? <Image source={{ uri: cniRecto }} style={styles.kycImage} />
                  : <View style={styles.kycPlaceholder}><Text style={styles.kycIcon}>🪪</Text><Text style={styles.kycBtnText}>Ajouter recto CNI</Text></View>}
              </TouchableOpacity>
            </View>

            {/* CNI Verso */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CNI VERSO *</Text>
              <TouchableOpacity style={styles.kycBtn} onPress={() => pickPhoto(setCniVerso)} activeOpacity={0.8}>
                {cniVerso
                  ? <Image source={{ uri: cniVerso }} style={styles.kycImage} />
                  : <View style={styles.kycPlaceholder}><Text style={styles.kycIcon}>🪪</Text><Text style={styles.kycBtnText}>Ajouter verso CNI</Text></View>}
              </TouchableOpacity>
            </View>

            {/* Selfie avec CNI */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SELFIE AVEC CNI EN MAIN * (caméra uniquement)</Text>
              <TouchableOpacity style={styles.kycBtn} onPress={takeSelfie} activeOpacity={0.8}>
                {selfie
                  ? <Image source={{ uri: selfie }} style={styles.kycImage} />
                  : <View style={styles.kycPlaceholder}><Text style={styles.kycIcon}>🤳</Text><Text style={styles.kycBtnText}>Prendre un selfie</Text></View>}
              </TouchableOpacity>
              <Text style={styles.hintInfo}>Tenez votre CNI bien visible à côté de votre visage.</Text>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════
            ÉTAPE 5 — Récapitulatif
        ════════════════════════════════════════ */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.recapCard}>
              <Text style={styles.recapTitle}>Informations personnelles</Text>
              <Text style={styles.recapLine}>👤 {displayName}</Text>
              <Text style={styles.recapLine}>📍 {quartier}, {ville}, {pays}</Text>
              <Text style={styles.recapLine}>🗺️ Zones : {interventionZones.join(", ")}</Text>
            </View>

            <View style={styles.recapCard}>
              <Text style={styles.recapTitle}>Services ({selectedServiceIds.length})</Text>
              {selectedServiceIds.map((id) => {
                const p = servicePricing[id];
                const svc = SERVICES.find((s) => s.id === id);
                return (
                  <Text key={id} style={styles.recapLine}>
                    {svc?.icon} {p?.customLabel} — {p?.minPrice}–{p?.maxPrice} FCFA {p?.unit}
                  </Text>
                );
              })}
            </View>

            <View style={styles.recapCard}>
              <Text style={styles.recapTitle}>Profil</Text>
              <Text style={styles.recapLine}>💼 {yearsExp || "0"} an(s) d'expérience</Text>
              <Text style={styles.recapLine}>🗣️ {languages.join(", ")}</Text>
              <Text style={styles.recapLine} numberOfLines={3}>📝 {bio}</Text>
            </View>

            <View style={styles.recapCard}>
              <Text style={styles.recapTitle}>Documents KYC</Text>
              <Text style={styles.recapLine}>{cniRecto ? "✅" : "❌"} CNI recto</Text>
              <Text style={styles.recapLine}>{cniVerso ? "✅" : "❌"} CNI verso</Text>
              <Text style={styles.recapLine}>{selfie ? "✅" : "❌"} Selfie avec CNI</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Après soumission, votre dossier sera examiné sous 24 à 48 heures. Vous serez notifié par l'application.
              </Text>
            </View>
          </View>
        )}

        {/* ── Bouton d'action ── */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={step < 4 ? handleNext : handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {step < 4 ? "Continuer →" : "Soumettre mon dossier →"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", gap: 12 },
  loaderText: { fontSize: 14, color: colors.textGray },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: 6,
  },
  progressBar: { height: 3, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, marginBottom: spacing.md },
  progressFill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  backBtn: { marginBottom: 6 },
  backText: { color: colors.primary, fontSize: 14, fontWeight: "500" },
  stepLabel: { fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff", lineHeight: 32 },
  subtitle: { fontSize: 13, color: colors.textLight },
  scroll: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  stepContent: { gap: spacing.md },
  sectionHint: { fontSize: 13, color: colors.textGray, lineHeight: 20 },
  inputGroup: { gap: 6 },
  label: { fontSize: 10, fontWeight: "700", color: colors.textGray, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.lightGray, borderRadius: radius.md,
    padding: 14, fontSize: 15, color: colors.textDark,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputMultiline: { height: 120, paddingTop: 14 },
  inputReadOnly: {
    backgroundColor: "#F4F4F4", borderRadius: radius.md, padding: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputReadOnlyText: { fontSize: 15, color: colors.textGray, fontWeight: "500" },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  photoPreview: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: "#E8E8E8", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.border, overflow: "hidden",
  },
  photoImage: { width: 64, height: 64 },
  photoPlaceholder: { fontSize: 28 },
  photoBtn: {
    flex: 1, backgroundColor: colors.lightGray, borderRadius: radius.md,
    padding: 14, borderWidth: 1.5, borderColor: colors.border, gap: 2,
  },
  photoBtnText: { fontSize: 13, color: colors.textDark, fontWeight: "600" },
  photoBtnSub: { fontSize: 11, color: colors.textGray },
  picker: {
    backgroundColor: colors.lightGray, borderRadius: radius.md, padding: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1.5, borderColor: colors.border,
  },
  pickerSelected: { borderColor: colors.primary, backgroundColor: "#F0FAF6" },
  pickerText: { fontSize: 14, color: colors.textDark, fontWeight: "500", flex: 1, marginRight: 8 },
  pickerPlaceholder: { color: colors.textGray, fontWeight: "400" },
  pickerArrow: { fontSize: 12, color: colors.textGray },
  pickerDropdown: {
    marginTop: 6, backgroundColor: "#fff", borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primary, elevation: 4,
  },
  pickerItem: {
    padding: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  pickerItemSelected: { backgroundColor: "#F0FAF6" },
  pickerItemText: { fontSize: 14, color: colors.textDark },
  pickerItemTextSelected: { color: colors.primary, fontWeight: "600" },
  checkMark: { fontSize: 14, color: colors.primary, fontWeight: "700" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: "#fff",
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: "#F0FAF6" },
  chipIcon: { fontSize: 14 },
  chipLabel: { fontSize: 12, fontWeight: "600", color: colors.textDark },
  chipLabelSelected: { color: colors.primary },
  pricingCard: {
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary,
    padding: spacing.md, gap: spacing.sm, backgroundColor: "#F9FFFE",
  },
  pricingCardTitle: { fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  priceSeparator: { fontSize: 16, color: colors.textGray, marginBottom: 14, fontWeight: "600" },
  unitRow: { flexDirection: "row", gap: 8 },
  unitBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border, alignItems: "center", backgroundColor: "#fff",
  },
  unitBtnSelected: { borderColor: colors.primary, backgroundColor: "#F0FAF6" },
  unitBtnText: { fontSize: 11, fontWeight: "600", color: colors.textGray },
  unitBtnTextSelected: { color: colors.primary },
  hintError: { fontSize: 11, color: "#E24B4A", marginTop: 2 },
  hintInfo: { fontSize: 11, color: colors.textGray, marginTop: 4, fontStyle: "italic" },
  infoBox: {
    backgroundColor: "#F0FAF6", borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: "#9FE1CB",
  },
  infoText: { fontSize: 13, color: "#0F6E56", lineHeight: 20 },
  kycBtn: {
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    overflow: "hidden", backgroundColor: colors.lightGray,
  },
  kycImage: { width: "100%", height: 160, resizeMode: "cover" },
  kycPlaceholder: { height: 120, alignItems: "center", justifyContent: "center", gap: 8 },
  kycIcon: { fontSize: 32 },
  kycBtnText: { fontSize: 14, color: colors.textGray, fontWeight: "600" },
  recapCard: {
    backgroundColor: "#F8F8F8", borderRadius: 14,
    padding: spacing.md, gap: 6, borderWidth: 1, borderColor: colors.border,
  },
  recapTitle: { fontSize: 13, fontWeight: "700", color: colors.textDark, marginBottom: 4 },
  recapLine: { fontSize: 13, color: colors.textGray, lineHeight: 20 },
  btnPrimary: {
    backgroundColor: colors.primary, borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: spacing.sm,
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

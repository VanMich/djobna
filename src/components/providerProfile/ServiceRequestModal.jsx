// src/components/providerProfile/ServiceRequestModal.jsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
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
import { SERVICES } from "../../constants/services";
import { useServiceRequest } from "../../hooks/useServiceRequest";
import { supabase } from "../../config/supabase";
import { colors } from "../../theme";

export default function ServiceRequestModal({ visible, onClose, provider }) {
  const [selectedService, setSelectedService] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [budget, setBudget] = useState("");
  const [photos, setPhotos] = useState([]);

  const { submitRequest, loading } = useServiceRequest();

  const reset = () => {
    setSelectedService(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setScheduledDate("");
    setBudget("");
    setPhotos([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert("Maximum atteint", "Vous pouvez joindre jusqu'à 3 photos.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès à la galerie pour ajouter des photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const validate = () => {
    if (!selectedService) {
      Alert.alert("Service requis", "Sélectionnez le service souhaité.");
      return false;
    }
    if (!title.trim()) {
      Alert.alert("Intitulé requis", "Décrivez brièvement votre tâche.");
      return false;
    }
    if (description.trim().length < 20) {
      Alert.alert("Description trop courte", "La description doit faire au moins 20 caractères.");
      return false;
    }
    if (!location.trim()) {
      Alert.alert("Lieu requis", "Indiquez le lieu d'intervention.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Upload les photos vers Supabase Storage avant de soumettre la demande
    let photoUrls = [];
    if (photos.length > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        photoUrls = await Promise.all(
          photos.map(async (uri, i) => {
            const blob = await fetch(uri).then((r) => r.blob());
            const path = `${user.id}/${Date.now()}-${i}.jpg`;
            const { error } = await supabase.storage.from("request-photos").upload(path, blob);
            if (error) throw error;
            return supabase.storage.from("request-photos").getPublicUrl(path).data.publicUrl;
          })
        );
      } catch (err) {
        console.error("Erreur upload photos:", err);
        Alert.alert("Erreur", "Impossible d'uploader les photos. Réessayez.");
        return;
      }
    }

    const result = await submitRequest({
      providerId: provider.id,
      service: selectedService,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      scheduledDate: scheduledDate.trim() || null,
      budget: budget.trim() || null,
      photos: photoUrls,
    });
    if (result.success) {
      Alert.alert(
        "Demande envoyée ✓",
        `${provider?.displayName} a reçu votre demande et vous répondra dès que possible.`,
        [{ text: "OK", onPress: handleClose }],
      );
    } else {
      Alert.alert("Erreur", "Impossible d'envoyer la demande. Réessayez.");
    }
  };

  const serviceItems = (provider?.services || [])
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean);

  const selectedPricing = selectedService
    ? provider?.servicePricing?.[selectedService]
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color="#555" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Solliciter un service</Text>
            <Text style={styles.headerSub}>{provider?.displayName}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Service ── */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Service souhaité <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipsWrap}>
              {serviceItems.map((svc) => {
                const active = selectedService === svc.id;
                return (
                  <TouchableOpacity
                    key={svc.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedService(svc.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipIcon}>{svc.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {provider?.servicePricing?.[svc.id]?.customLabel || svc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedPricing && (
              <View style={styles.pricingHint}>
                <Ionicons name="pricetag-outline" size={13} color={colors.primary} />
                <Text style={styles.pricingHintText}>
                  {(selectedPricing.minPrice || 0).toLocaleString("fr-FR")} –{" "}
                  {(selectedPricing.maxPrice || 0).toLocaleString("fr-FR")} FCFA
                  {selectedPricing.unit ? ` / ${selectedPricing.unit}` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* ── Intitulé ── */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Intitulé de la tâche <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder='Ex : "Réparation fuite robinet cuisine"'
              placeholderTextColor="#C0C0C0"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
          </View>

          {/* ── Description ── */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Description détaillée <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Décrivez le problème, les difficultés d'accès, ce que vous attendez…"
              placeholderTextColor="#C0C0C0"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text
              style={[
                styles.counter,
                description.length > 0 && description.length < 20 && styles.counterWarn,
              ]}
            >
              {description.length}/500
              {description.length > 0 && description.length < 20
                ? `  — encore ${20 - description.length} car.`
                : ""}
            </Text>
          </View>

          {/* ── Lieu ── */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Lieu d'intervention <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={16} color="#AAB0B7" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Rue, quartier, repère…"
                placeholderTextColor="#C0C0C0"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* ── Date ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Date et heure souhaitées</Text>
            <View style={styles.inputRow}>
              <Ionicons name="calendar-outline" size={16} color="#AAB0B7" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Ex : 25/05/2026 à 10h00"
                placeholderTextColor="#C0C0C0"
                value={scheduledDate}
                onChangeText={setScheduledDate}
              />
            </View>
          </View>

          {/* ── Budget ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Budget proposé (optionnel)</Text>
            <View style={styles.budgetRow}>
              <TextInput
                style={[styles.input, styles.budgetInput]}
                placeholder="Ex : 15 000"
                placeholderTextColor="#C0C0C0"
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
              />
              <View style={styles.budgetUnit}>
                <Text style={styles.budgetUnitText}>FCFA</Text>
              </View>
            </View>
          </View>

          {/* ── Photos ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Photos (optionnel, max 3)</Text>
            <View style={styles.photosRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  >
                    <Ionicons name="close-circle" size={20} color="#E24B4A" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 3 && (
                <TouchableOpacity style={styles.photoAdd} onPress={handlePickPhoto} activeOpacity={0.8}>
                  <Ionicons name="camera-outline" size={26} color="#AAB0B7" />
                  <Text style={styles.photoAddText}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Ionicons name="flash" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>
              {loading ? "Envoi en cours…" : "Envoyer la demande"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 2 },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#111" },
  headerSub: { fontSize: 12, color: "#888" },
  headerRight: { width: 36 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 12, gap: 4 },

  section: { gap: 8 },
  label: { fontSize: 13, fontWeight: "700", color: "#333" },
  required: { color: "#E24B4A" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    backgroundColor: "#FAFAFA",
  },
  chipActive: { borderColor: colors.primary, backgroundColor: "#F0FAF6" },
  chipIcon: { fontSize: 15 },
  chipText: { fontSize: 13, fontWeight: "600", color: "#555" },
  chipTextActive: { color: colors.primary },

  pricingHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FAF6",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  pricingHintText: { fontSize: 12, color: colors.primary, fontWeight: "600" },

  input: {
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#FAFAFA",
  },
  textarea: { height: 100, paddingTop: 12 },
  counter: { fontSize: 11, color: "#AAB0B7", textAlign: "right" },
  counterWarn: { color: "#F59E0B" },

  inputRow: { position: "relative" },
  inputIcon: { position: "absolute", left: 14, top: 14, zIndex: 1 },
  inputWithIcon: { paddingLeft: 38 },

  budgetRow: { flexDirection: "row", gap: 10 },
  budgetInput: { flex: 1 },
  budgetUnit: {
    width: 64,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
  },
  budgetUnitText: { fontSize: 12, fontWeight: "700", color: "#888" },

  photosRow: { flexDirection: "row", gap: 10 },
  photoThumb: { position: "relative", width: 80, height: 80 },
  photoImg: { width: 80, height: 80, borderRadius: 12 },
  photoRemove: { position: "absolute", top: -6, right: -6 },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FAFAFA",
  },
  photoAddText: { fontSize: 10, color: "#AAB0B7", fontWeight: "600" },

  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});

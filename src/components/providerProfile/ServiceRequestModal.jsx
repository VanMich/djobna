// src/components/providerProfile/ServiceRequestModal.jsx
import DateTimePicker from "@react-native-community/datetimepicker";
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
import Icon from "../ui/Icon";
import { colors, fonts } from "../../theme";

export default function ServiceRequestModal({ visible, onClose, provider }) {
  const [selectedService, setSelectedService] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [scheduledDate, setScheduledDate] = useState(null); // Date | null
  const [budget, setBudget] = useState("");
  const [photos, setPhotos] = useState([]);

  const [showPicker, setShowPicker] = useState(false);
  const [androidMode, setAndroidMode] = useState("date");
  const [androidTemp, setAndroidTemp] = useState(new Date());

  const { submitRequest, loading } = useServiceRequest();

  const formatScheduledDate = (date) => {
    if (!date) return null;
    const d = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const t = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return `${d} à ${t}`;
  };

  const openPicker = () => {
    setAndroidTemp(scheduledDate || new Date());
    setAndroidMode("date");
    setShowPicker(true);
  };

  const handlePickerChange = (event, selected) => {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") { setShowPicker(false); return; }
      if (!selected) return;
      if (androidMode === "date") {
        setAndroidTemp(selected);
        setAndroidMode("time");
      } else {
        const d = new Date(androidTemp);
        d.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setScheduledDate(d);
        setShowPicker(false);
        setAndroidMode("date");
      }
    } else {
      if (selected) setScheduledDate(selected);
    }
  };

  const reset = () => {
    setSelectedService(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setScheduledDate(null);
    setBudget("");
    setPhotos([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert("Maximum atteint", "Tu peux joindre jusqu'à 3 photos.");
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
      Alert.alert("Service requis", "Sélectionne le service souhaité.");
      return false;
    }
    if (!title.trim()) {
      Alert.alert("Intitulé requis", "Décris brièvement ta tâche.");
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
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error("Non connecté");
        photoUrls = await Promise.all(
          photos.map(async (uri, i) => {
            const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
            const path = `${user.id}/${Date.now()}-${i}.${ext}`;
            const formData = new FormData();
            formData.append("file", { uri, name: `photo-${i}.${ext}`, type: `image/${ext}` });
            const { error } = await supabase.storage.from("request-photos").upload(path, formData, { contentType: `image/${ext}` });
            if (error) throw error;
            return supabase.storage.from("request-photos").getPublicUrl(path).data.publicUrl;
          })
        );
      } catch (err) {
        console.error("Erreur upload photos:", err);
        Alert.alert("Erreur", "Impossible d'uploader les photos. Réessaye.");
        return;
      }
    }

    const result = await submitRequest({
      providerId: provider.id,
      service: selectedService,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      scheduledDate: scheduledDate ? scheduledDate.toISOString() : null,
      budget: budget.trim() || null,
      photos: photoUrls,
    });
    if (result.success) {
      Alert.alert(
        "Demande envoyée ✓",
        `${provider?.displayName} a reçu ta demande et te répondra dès que possible.`,
        [{ text: "OK", onPress: handleClose }],
      );
    } else {
      Alert.alert("Erreur", "Impossible d'envoyer la demande. Réessaye.");
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
            <Icon name="close" size={20} color={colors.ink500} />
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
                    <Icon name={svc.icon} size={16} color={active ? colors.textInverse : colors.primary} weight="duotone" />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {provider?.servicePricing?.[svc.id]?.customLabel || svc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedPricing && (
              <View style={styles.pricingHint}>
                <Icon name="pricetag-outline" size={13} color={colors.primary} />
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
              placeholderTextColor={colors.ink100}
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
              placeholder="Décris le problème, les difficultés d'accès, ce que tu attends…"
              placeholderTextColor={colors.ink100}
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
              <Icon name="location-outline" size={16} color={colors.ink300} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Rue, quartier, repère…"
                placeholderTextColor={colors.ink100}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* ── Date & heure ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Date et heure souhaitées</Text>
            <TouchableOpacity style={styles.dateField} onPress={openPicker} activeOpacity={0.8}>
              <Icon name="calendar-outline" size={16} color={scheduledDate ? colors.primary : colors.ink300} />
              <Text style={[styles.dateFieldText, !scheduledDate && styles.dateFieldPlaceholder]}>
                {scheduledDate ? formatScheduledDate(scheduledDate) : "Sélectionner une date et heure"}
              </Text>
              {scheduledDate ? (
                <TouchableOpacity onPress={() => setScheduledDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close-circle" size={18} color={colors.ink100} />
                </TouchableOpacity>
              ) : (
                <Icon name="chevron-forward" size={16} color={colors.ink100} />
              )}
            </TouchableOpacity>

            {showPicker && (
              <View>
                <DateTimePicker
                  value={Platform.OS === "android" && androidMode === "time" ? androidTemp : (scheduledDate || new Date())}
                  mode={Platform.OS === "android" ? androidMode : "datetime"}
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={new Date()}
                  onChange={handlePickerChange}
                  locale="fr-FR"
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity style={styles.pickerDone} onPress={() => setShowPicker(false)}>
                    <Text style={styles.pickerDoneText}>Fermer</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* ── Budget ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Budget proposé (optionnel)</Text>
            <View style={styles.budgetRow}>
              <TextInput
                style={[styles.input, styles.budgetInput]}
                placeholder="Ex : 15 000"
                placeholderTextColor={colors.ink100}
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
                    <Icon name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 3 && (
                <TouchableOpacity style={styles.photoAdd} onPress={handlePickPhoto} activeOpacity={0.8}>
                  <Icon name="camera-outline" size={26} color={colors.ink300} />
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
            <Icon name="flash" size={16} color={colors.textInverse} />
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
  root: { flex: 1, backgroundColor: colors.card },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 2 },
  headerTitle: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.ink900 },
  headerSub: { fontSize: 12, color: colors.ink500 },
  headerRight: { width: 36 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 12, gap: 4 },

  section: { gap: 8 },
  label: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink700 },
  required: { color: colors.error },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.ink50,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipIcon: { fontSize: 15 },
  chipText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.ink500 },
  chipTextActive: { color: colors.primary },

  pricingHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  pricingHintText: { fontSize: 12, color: colors.primary, fontFamily: fonts.semiBold },

  input: {
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.ink900,
    backgroundColor: colors.ink50,
  },
  textarea: { height: 100, paddingTop: 12 },
  counter: { fontSize: 11, color: colors.ink300, textAlign: "right" },
  counterWarn: { color: colors.mango },

  inputRow: { position: "relative" },
  inputIcon: { position: "absolute", left: 14, top: 14, zIndex: 1 },
  inputWithIcon: { paddingLeft: 38 },

  budgetRow: { flexDirection: "row", gap: 10 },
  budgetInput: { flex: 1 },
  budgetUnit: {
    width: 64,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink50,
  },
  budgetUnitText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink500 },

  dateField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: colors.ink50,
  },
  dateFieldText: { flex: 1, fontSize: 14, color: colors.ink900 },
  dateFieldPlaceholder: { color: colors.ink100 },
  pickerDone: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 8 },
  pickerDoneText: { fontSize: 14, fontFamily: fonts.bold, color: colors.primary },

  photosRow: { flexDirection: "row", gap: 10 },
  photoThumb: { position: "relative", width: 80, height: 80 },
  photoImg: { width: 80, height: 80, borderRadius: 12 },
  photoRemove: { position: "absolute", top: -6, right: -6 },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.ink50,
  },
  photoAddText: { fontSize: 10, color: colors.ink300, fontFamily: fonts.semiBold },

  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
  submitBtnText: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.textInverse },
});

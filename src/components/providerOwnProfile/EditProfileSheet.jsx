// src/components/providerOwnProfile/EditProfileSheet.jsx
//
// Feuille modale d'édition du profil prestataire (§14).
// Sections (de haut en bas) :
//   1. Infos de base       — nom complet, bio, quartier principal
//   2. Zones d'intervention — chips multi-sélection depuis QUARTIERS_DOUALA
//   3. Langues parlées      — chips de sélection rapide (langues camerounaises)
//   4. Tarifs par service   — fourchettes de prix pour chaque prestation exercée
//
// Toutes les modifications sont sauvegardées en une seule fois au clic "Enregistrer".

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

import { QUARTIERS_PAR_VILLE, SERVICES } from "../../constants/services";
import Icon from "../ui/Icon";
import { colors, radius, fonts } from "../../theme";

// Langues couramment parlées au Cameroun (§14 — section langues)
const LANGUAGES = ["Français", "Anglais", "Duala", "Bamiléké", "Ewondo", "Bassa", "Fulfulde", "Pidgin", "Haoussa"];

const UNITS = ["Par heure", "Par intervention", "Par jour", "Par m²", "Par mètre", "Par kg"];

export default function EditProfileSheet({
  visible,
  onClose,
  profile,
  provider,
  onSave,
}) {
  // ── Section 1 : Infos de base ─────────────────────────────────────────────
  const [displayName, setDisplayName]   = useState("");
  const [bio, setBio]                   = useState("");
  const [quartier, setQuartier]         = useState("");
  const [showQPicker, setShowQPicker]   = useState(false);

  // ── Section 2 : Zones d'intervention ─────────────────────────────────────
  const [selectedZones, setSelectedZones]     = useState([]);
  const [showZonePicker, setShowZonePicker]   = useState(false);

  // ── Section 3 : Langues ───────────────────────────────────────────────────
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  // ── Section 4 : Tarifs ────────────────────────────────────────────────────
  // Structure locale : { [serviceId]: { customLabel, minPrice, maxPrice, unit } }
  // Les prix sont des strings tant que l'input est en cours — convertis en nombres au save.
  const [pricingDraft, setPricingDraft] = useState({});

  const [saving, setSaving] = useState(false);

  // Initialise tous les champs à chaque ouverture du modal
  useEffect(() => {
    if (!visible) return;

    setDisplayName(profile?.displayName || "");
    setBio(provider?.bio || "");
    setQuartier(profile?.quartier || "");
    setShowQPicker(false);
    setSelectedZones(provider?.zones || []);
    setShowZonePicker(false);
    setSelectedLanguages(provider?.languages || []);

    // Initialise les fourchettes depuis servicePricing existant
    const draft = {};
    (provider?.services || []).forEach((id) => {
      const p = provider?.servicePricing?.[id] || {};
      draft[id] = {
        customLabel: p.customLabel || "",
        minPrice:    p.minPrice ? String(p.minPrice) : "",
        maxPrice:    p.maxPrice ? String(p.maxPrice) : "",
        unit:        p.unit    || "",
      };
    });
    setPricingDraft(draft);
  }, [profile, provider, visible]);

  // Met à jour un champ précis du brouillon de tarifs pour un service donné
  const setPricing = (serviceId, field, value) => {
    setPricingDraft((prev) => ({
      ...prev,
      [serviceId]: { ...(prev[serviceId] || {}), [field]: value },
    }));
  };

  // Bascule la présence d'une zone dans la sélection locale
  const toggleZone = (zone) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone],
    );
  };

  // Bascule la présence d'une langue dans la sélection locale
  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  // Enregistre toutes les modifications via le callback onSave fourni par le parent
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Champ requis", "Entre ton nom complet");
      return;
    }

    // Reconstruit l'objet servicePricing avec des valeurs numériques (parseInt)
    const servicePricing = {};
    (provider?.services || []).forEach((id) => {
      const d = pricingDraft[id] || {};
      servicePricing[id] = {
        customLabel: d.customLabel || "",
        minPrice:    parseInt(d.minPrice, 10) || 0,
        maxPrice:    parseInt(d.maxPrice, 10) || 0,
        unit:        d.unit || "",
      };
    });

    setSaving(true);
    const result = await onSave({
      displayName:      displayName.trim(),
      bio:              bio.trim(),
      quartier,
      zones:            selectedZones,
      languages:        selectedLanguages,
      servicePricing,
    });
    setSaving(false);

    if (result.success) {
      onClose();
    } else {
      Alert.alert("Oups", "Impossible d'enregistrer. Réessaye.");
    }
  };

  // Zones disponibles à ajouter (= non encore sélectionnées)
  const availableZones = (QUARTIERS_PAR_VILLE[profile?.ville] || []).filter((q) => !selectedZones.includes(q));

  // Services exercés par le prestataire (pour la section tarifs)
  const providerServices = SERVICES.filter((s) =>
    (provider?.services || []).includes(s.id),
  );

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
        {/* ── En-tête fixe : Annuler / titre / Enregistrer ── */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtn}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Modifier le profil</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}>
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
          {/* ════ Section 1 : Infos de base ════ */}
          <Text style={styles.sectionLabel}>INFORMATIONS DE BASE</Text>

          <View style={styles.field}>
            <Text style={styles.label}>NOM COMPLET</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ex : Paul Nguema"
              placeholderTextColor={colors.ink300}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>BIO / DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="Décris ton expérience, tes spécialités..."
              placeholderTextColor={colors.ink300}
              multiline
              numberOfLines={4}
              maxLength={300}
            />
            <Text style={styles.charCount}>{bio.length}/300</Text>
          </View>

          {/* Quartier principal — sélecteur unique (dropdown) */}
          <View style={styles.field}>
            <Text style={styles.label}>QUARTIER PRINCIPAL</Text>
            <TouchableOpacity
              style={[styles.picker, quartier && styles.pickerSelected]}
              onPress={() => { setShowQPicker(!showQPicker); setShowZonePicker(false); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickerText, !quartier && styles.pickerPlaceholder]}>
                {quartier || "Choisis ton quartier"}
              </Text>
              <Icon
                name={showQPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.ink300}
              />
            </TouchableOpacity>

            {showQPicker && (
              <View style={styles.pickerList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {(QUARTIERS_PAR_VILLE[profile?.ville] || []).map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.pickerItem, quartier === q && styles.pickerItemActive]}
                      onPress={() => { setQuartier(q); setShowQPicker(false); }}
                    >
                      <Text style={[styles.pickerItemText, quartier === q && styles.pickerItemTextActive]}>
                        {q}
                      </Text>
                      {quartier === q && (
                        <Icon name="checkmark" size={14} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.separator} />

          {/* ════ Section 2 : Zones d'intervention ════ */}
          <Text style={styles.sectionLabel}>ZONES D'INTERVENTION</Text>
          <Text style={styles.sectionSub}>
            Quartiers où tu te déplaces pour intervenir chez les clients.
          </Text>

          {/* Chips des zones déjà sélectionnées — tap pour retirer */}
          <View style={styles.chipsRow}>
            {selectedZones.map((zone) => (
              <TouchableOpacity
                key={zone}
                style={styles.chipSelected}
                onPress={() => toggleZone(zone)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipSelectedText}>{zone}</Text>
                <Icon name="close-circle" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}
            {selectedZones.length === 0 && (
              <Text style={styles.chipEmpty}>Aucune zone sélectionnée</Text>
            )}
          </View>

          {/* Bouton "Ajouter une zone" → dropdown des zones restantes */}
          {availableZones.length > 0 && (
            <TouchableOpacity
              style={styles.addZoneBtn}
              onPress={() => { setShowZonePicker(!showZonePicker); setShowQPicker(false); }}
              activeOpacity={0.8}
            >
              <Icon name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.addZoneBtnText}>Ajouter une zone</Text>
              <Icon
                name={showZonePicker ? "chevron-up" : "chevron-down"}
                size={14}
                color={colors.ink300}
              />
            </TouchableOpacity>
          )}

          {showZonePicker && (
            <View style={styles.pickerList}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {availableZones.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.pickerItem}
                    onPress={() => { toggleZone(q); setShowZonePicker(false); }}
                  >
                    <Text style={styles.pickerItemText}>{q}</Text>
                    <Icon name="add" size={14} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.separator} />

          {/* ════ Section 3 : Langues parlées ════ */}
          <Text style={styles.sectionLabel}>LANGUES PARLÉES</Text>
          <View style={styles.chipsRow}>
            {LANGUAGES.map((lang) => {
              const active = selectedLanguages.includes(lang);
              return (
                <TouchableOpacity
                  key={lang}
                  style={active ? styles.chipSelected : styles.chip}
                  onPress={() => toggleLanguage(lang)}
                  activeOpacity={0.8}
                >
                  <Text style={active ? styles.chipSelectedText : styles.chipText}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ════ Section 4 : Tarifs par service ════ */}
          {providerServices.length > 0 && (
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionLabel}>MES TARIFS</Text>
              <Text style={styles.sectionSub}>
                Renseigne une fourchette de prix pour chacun de tes services.
              </Text>

              {providerServices.map((svc) => {
                const d = pricingDraft[svc.id] || {};
                return (
                  <View key={svc.id} style={styles.pricingCard}>
                    {/* Identité du service */}
                    <View style={styles.pricingHeader}>
                      <Icon name={svc.icon} size={18} color={colors.primary} weight="duotone" />
                      <Text style={styles.pricingServiceName}>{svc.label}</Text>
                    </View>

                    {/* Libellé personnalisé optionnel (ex : "Mécanicien spécialisé Toyota") */}
                    <View style={styles.pricingField}>
                      <Text style={styles.label}>NOM PERSONNALISÉ (optionnel)</Text>
                      <TextInput
                        style={styles.input}
                        value={d.customLabel}
                        onChangeText={(v) => setPricing(svc.id, "customLabel", v)}
                        placeholder={`Ex : "${svc.label} spécialisé"`}
                        placeholderTextColor={colors.ink300}
                      />
                    </View>

                    {/* Fourchette min – max côte à côte */}
                    <View style={styles.priceRow}>
                      <View style={[styles.pricingField, { flex: 1 }]}>
                        <Text style={styles.label}>PRIX MIN (FCFA)</Text>
                        <TextInput
                          style={styles.input}
                          value={d.minPrice}
                          onChangeText={(v) => setPricing(svc.id, "minPrice", v)}
                          placeholder="5 000"
                          placeholderTextColor={colors.ink300}
                          keyboardType="numeric"
                        />
                      </View>
                      <Text style={styles.priceDash}>–</Text>
                      <View style={[styles.pricingField, { flex: 1 }]}>
                        <Text style={styles.label}>PRIX MAX (FCFA)</Text>
                        <TextInput
                          style={styles.input}
                          value={d.maxPrice}
                          onChangeText={(v) => setPricing(svc.id, "maxPrice", v)}
                          placeholder="15 000"
                          placeholderTextColor={colors.ink300}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    {/* Unité de tarification — chips sélectionnables */}
                    <View style={styles.pricingField}>
                      <Text style={styles.label}>UNITÉ</Text>
                      <View style={styles.chipsRow}>
                        {UNITS.map((u) => {
                          const active = d.unit === u;
                          return (
                            <TouchableOpacity
                              key={u}
                              style={active ? styles.chipSelected : styles.chip}
                              // Tap sur le chip actif le désélectionne
                              onPress={() => setPricing(svc.id, "unit", active ? "" : u)}
                              activeOpacity={0.8}
                            >
                              <Text style={active ? styles.chipSelectedText : styles.chipText}>
                                {u}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card },

  // En-tête fixe
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.ink300,
    alignSelf: "center",
    marginTop: 8, marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title:           { fontSize: 16, fontFamily: fonts.bold, color: colors.ink900 },
  cancelBtn:       { fontSize: 14, color: colors.ink500, fontFamily: fonts.medium },
  saveBtn:         { fontSize: 14, color: colors.primary, fontFamily: fonts.bold },
  saveBtnDisabled: { opacity: 0.5 },

  content: { padding: 20, gap: 16 },

  // Titres de section
  sectionLabel: {
    fontSize: 10, fontFamily: fonts.extraBold,
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 4,
  },
  sectionSub: { fontSize: 12, color: colors.ink500, lineHeight: 17, marginTop: -10 },

  separator: { height: 1, backgroundColor: colors.ink50, marginVertical: 4 },

  // Champs texte
  field: { gap: 6 },
  label: {
    fontSize: 10, fontFamily: fonts.bold,
    color: colors.ink300, letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.ink50,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14, color: colors.ink900,
    borderWidth: 1.5, borderColor: colors.borderLight,
  },
  inputMultiline: { height: 120, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: colors.ink300, textAlign: "right" },

  // Dropdown partagé (quartier principal + zones)
  picker: {
    backgroundColor: colors.ink50,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5, borderColor: colors.borderLight,
  },
  pickerSelected:        { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pickerText:            { fontSize: 14, color: colors.ink900, fontFamily: fonts.medium },
  pickerPlaceholder:     { color: colors.ink300, fontFamily: fonts.regular },
  pickerList: {
    marginTop: 6,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primary,
    elevation: 4,
  },
  pickerItem: {
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5, borderBottomColor: colors.borderLight,
  },
  pickerItemActive:      { backgroundColor: colors.primarySoft },
  pickerItemText:        { fontSize: 14, color: colors.ink900 },
  pickerItemTextActive:  { color: colors.primary, fontFamily: fonts.semiBold },

  // Bouton "Ajouter une zone" (tirets verts)
  addZoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: "#D1F5E8",
    borderStyle: "dashed",
    backgroundColor: colors.primarySoft,
    alignSelf: "flex-start",
  },
  addZoneBtnText: { fontSize: 13, color: colors.primary, fontFamily: fonts.semiBold },

  // Chips (zones sélectionnées + langues)
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.borderLight,
    backgroundColor: colors.ink50,
  },
  chipText:     { fontSize: 12, color: colors.ink500, fontFamily: fonts.medium },
  chipSelected: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipSelectedText: { fontSize: 12, color: colors.primary, fontFamily: fonts.bold },
  chipEmpty:        { fontSize: 12, color: colors.ink300, fontStyle: "italic" },

  // Carte tarifs par service
  pricingCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    borderWidth: 1, borderColor: colors.green200,
    padding: 14,
    gap: 12,
  },
  pricingHeader:      { flexDirection: "row", alignItems: "center", gap: 8 },
  pricingIcon:        { fontSize: 20 },
  pricingServiceName: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink900 },
  pricingField:       { gap: 6 },
  priceRow:           { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  priceDash:          { fontSize: 16, color: colors.ink300, paddingBottom: 14, fontFamily: fonts.bold },
});

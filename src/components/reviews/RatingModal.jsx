// src/components/reviews/RatingModal.jsx
//
// Modal de notation d'un prestataire après une mission terminée (§15.2).
//
// Sections :
//   1. Note globale     — grande sélection d'étoiles (1-5) avec libellé
//   2. Critères détaillés — ponctualité, qualité, communication, rapport qualité/prix
//   3. Commentaire libre — optionnel, 500 caractères max

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
import Icon from "../ui/Icon";
import { colors, radius } from "../../theme";

// Libellés associés à chaque note globale
const RATING_LABELS = ["", "Mauvais", "Passable", "Bien", "Très bien", "Excellent !"];

// Critères de notation (§15.2)
const CRITERIA = [
  { key: "punctuality",   label: "Ponctualité",           icon: "timer" },
  { key: "quality",       label: "Qualité du travail",     icon: "wrench" },
  { key: "communication", label: "Communication",          icon: "chat-circle" },
  { key: "valueForMoney", label: "Rapport qualité/prix",   icon: "hand-coins" },
];

// ─── Sélecteur d'étoiles ──────────────────────────────────────────────────────
// Tap sur une étoile pour choisir la note (1 à 5).
// La couleur dorée remplie jusqu'à la valeur sélectionnée.
function StarSelector({ value, onChange, size = 30 }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
          <Text style={{ fontSize: size, color: n <= value ? "#F59E0B" : "#E0E0E0" }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
});

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function RatingModal({ visible, onClose, onSubmit, providerName, loading }) {
  // Note globale (obligatoire)
  const [globalRating,   setGlobalRating]   = useState(0);
  // Critères détaillés (optionnels — si non renseignés, on utilise globalRating)
  const [punctuality,    setPunctuality]    = useState(0);
  const [quality,        setQuality]        = useState(0);
  const [communication,  setCommunication]  = useState(0);
  const [valueForMoney,  setValueForMoney]  = useState(0);
  // Commentaire libre (optionnel)
  const [comment,        setComment]        = useState("");

  // Réinitialise le formulaire à chaque ouverture du modal
  useEffect(() => {
    if (visible) {
      setGlobalRating(0);
      setPunctuality(0);
      setQuality(0);
      setCommunication(0);
      setValueForMoney(0);
      setComment("");
    }
  }, [visible]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleSubmit = () => {
    if (globalRating === 0) {
      Alert.alert("Note requise", "Sélectionnez au moins une note globale (1 à 5 étoiles).");
      return;
    }
    // Si un critère n'est pas renseigné, on utilise la note globale par défaut
    onSubmit({
      globalRating,
      punctuality:   punctuality   || globalRating,
      quality:       quality       || globalRating,
      communication: communication || globalRating,
      valueForMoney: valueForMoney || globalRating,
      comment,
    });
  };

  // Correspondance clé → état + setter (pour l'affichage dynamique des critères)
  const criteriaValues  = { punctuality, quality, communication, valueForMoney };
  const criteriaSetters = {
    punctuality:   setPunctuality,
    quality:       setQuality,
    communication: setCommunication,
    valueForMoney: setValueForMoney,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── En-tête fixe ── */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.cancelBtn}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Laisser un avis</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
              <Text style={[styles.submitBtn, loading && styles.disabled]}>
                {loading ? "Envoi…" : "Publier"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Section 1 : Note globale ── */}
          <View style={styles.globalSection}>
            <Text style={styles.providerName}>{providerName}</Text>
            <Text style={styles.globalHint}>Comment s'est passée votre prestation ?</Text>
            <StarSelector value={globalRating} onChange={setGlobalRating} size={42} />
            {/* Libellé dynamique selon la note choisie */}
            <Text style={styles.ratingLabel}>
              {RATING_LABELS[globalRating] || "Tapez une étoile pour commencer"}
            </Text>
          </View>

          <View style={styles.separator} />

          {/* ── Section 2 : Critères détaillés ── */}
          <Text style={styles.sectionLabel}>CRITÈRES DÉTAILLÉS (optionnel)</Text>
          <Text style={styles.sectionSub}>
            Laissez vide pour utiliser votre note globale sur chaque critère.
          </Text>
          {CRITERIA.map((c) => (
            <View key={c.key} style={styles.criteriaRow}>
              <Icon name={c.icon} size={16} color={colors.primary} weight="duotone" />
              <Text style={styles.criteriaLabel}>{c.label}</Text>
              <StarSelector
                value={criteriaValues[c.key]}
                onChange={criteriaSetters[c.key]}
                size={22}
              />
            </View>
          ))}

          <View style={styles.separator} />

          {/* ── Section 3 : Commentaire libre ── */}
          <Text style={styles.sectionLabel}>COMMENTAIRE (optionnel)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Décrivez votre expérience avec ce prestataire…"
            placeholderTextColor="#AAB0B7"
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#EEF0EF",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#DDD",
    alignSelf: "center", marginTop: 8, marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  title:      { fontSize: 16, fontWeight: "700", color: "#111" },
  cancelBtn:  { fontSize: 14, color: "#888", fontWeight: "500" },
  submitBtn:  { fontSize: 14, color: colors.primary, fontWeight: "700" },
  disabled:   { opacity: 0.5 },

  content: { padding: 24, gap: 16 },

  // Note globale — centrée et grande
  globalSection: { alignItems: "center", gap: 10, paddingVertical: 8 },
  providerName:  { fontSize: 15, fontWeight: "700", color: "#111" },
  globalHint:    { fontSize: 13, color: "#888" },
  ratingLabel:   { fontSize: 15, fontWeight: "700", color: "#F59E0B", minHeight: 22 },

  separator:    { height: 1, backgroundColor: "#F0F0F0" },
  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 1 },
  sectionSub:   { fontSize: 11, color: "#AAB0B7", lineHeight: 16, marginTop: -10 },

  // Ligne critère : icône + libellé + étoiles
  criteriaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  criteriaLabel: { fontSize: 13, color: "#555", flex: 1 },

  commentInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14, color: "#111",
    borderWidth: 1.5, borderColor: "#E8E8E8",
    height: 120,
  },
  charCount: { fontSize: 11, color: "#AAB0B7", textAlign: "right", marginTop: -8 },
});

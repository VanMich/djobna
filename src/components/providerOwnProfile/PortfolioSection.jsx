// src/components/providerOwnProfile/PortfolioSection.jsx
//
// Affiche les photos de réalisations du prestataire (§14.2).
// Chaque item du tableau portfolio est un objet { uri, caption }.
//
// Mode édition (readOnly = false) :
//   - Long press sur une photo → "Modifier la légende" ou "Supprimer"
//   - La légende est affichée sous chaque photo (2 lignes max)
//   - Bouton "Ajouter" pour choisir une photo depuis la galerie
//
// Mode lecture (readOnly = true, profil public) :
//   - Même affichage, pas de contrôles d'édition

import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "../../components/ui/Icon";

import { colors, fonts } from "../../theme";

export default function PortfolioSection({
  portfolio,
  onAdd,
  onRemove,
  onUpdateCaption,  // (uri, caption) → met à jour la légende dans le hook
  readOnly = false,
}) {
  // ── Modal de saisie de légende ─────────────────────────────────────────────
  // uri de la photo en cours d'édition (null = modal fermé)
  const [editUri, setEditUri]       = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");

  // Ouvre le modal de légende pour une photo donnée
  const openCaptionModal = (item) => {
    setEditUri(item.uri);
    setCaptionDraft(item.caption || "");
  };

  // Sauvegarde la légende et ferme le modal
  const saveCaption = () => {
    if (editUri && onUpdateCaption) {
      onUpdateCaption(editUri, captionDraft.trim());
    }
    setEditUri(null);
  };

  // Long press en mode édition → choix : modifier légende / supprimer
  const handleLongPress = (item) => {
    if (readOnly || !onRemove) return;

    Alert.alert(
      "Photo de réalisation",
      item.caption ? `"${item.caption}"` : "Aucune légende",
      [
        {
          text: "Modifier la légende",
          onPress: () => openCaptionModal(item),
        },
        {
          text: "Supprimer la photo",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Supprimer cette photo ?",
              "Elle sera retirée définitivement de ton portfolio.",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Supprimer", style: "destructive", onPress: () => onRemove(item.uri) },
              ],
            );
          },
        },
        { text: "Annuler", style: "cancel" },
      ],
    );
  };

  const items = portfolio || [];

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item, i) => (
          // Chaque item est {uri, caption} — on affiche la photo + la légende en dessous
          <TouchableOpacity
            key={`${item.uri}-${i}`}
            activeOpacity={0.85}
            onLongPress={() => handleLongPress(item)}
            // En mode édition, un simple tap ouvre aussi la légende
            onPress={!readOnly ? () => openCaptionModal(item) : undefined}
          >
            <View style={styles.photoWrap}>
              <Image source={{ uri: item.uri }} style={styles.photo} />
              {/* Légende sous la photo (visible si renseignée) */}
              {item.caption ? (
                <Text style={styles.caption} numberOfLines={2}>
                  {item.caption}
                </Text>
              ) : !readOnly ? (
                // Invite à ajouter une légende en mode édition
                <Text style={styles.captionEmpty}>+ légende</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}

        {/* Bouton "Ajouter" (mode édition uniquement, limite 20 photos) */}
        {!readOnly && items.length < 20 && (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
            <Icon name="add" size={24} color={colors.primary} />
            <Text style={styles.addText}>Ajouter</Text>
          </TouchableOpacity>
        )}

        {/* État vide */}
        {items.length === 0 && (
          <View style={styles.empty}>
            <Icon name="images-outline" size={24} color={colors.ink300} />
            <Text style={styles.emptyText}>
              {readOnly
                ? "Ce pro n'a pas encore ajouté de photos"
                : "Ajoute des photos de tes travaux pour attirer plus de clients"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Modal de saisie de légende (cross-platform) ── */}
      {/* Alert.prompt n'existe pas sur Android — on utilise un petit Modal */}
      <Modal
        visible={editUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditUri(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Légende de la photo</Text>
            <TextInput
              style={styles.modalInput}
              value={captionDraft}
              onChangeText={setCaptionDraft}
              placeholder="Ex : Installation électrique terminée"
              placeholderTextColor={colors.ink300}
              maxLength={100}
              autoFocus
            />
            <Text style={styles.modalCount}>{captionDraft.length}/100</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditUri(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={saveCaption}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    alignItems: "flex-start", // alignement haut pour que les légendes s'affichent vers le bas
  },

  // Conteneur photo + légende (largeur fixe pour la grille horizontale)
  photoWrap: { width: 80, gap: 4 },

  photo: {
    width: 80, height: 80,
    borderRadius: 12,
    backgroundColor: colors.ink50,
  },

  caption: {
    fontSize: 9, color: colors.ink500,
    lineHeight: 13,
    textAlign: "center",
  },
  captionEmpty: {
    fontSize: 9, color: colors.primary,
    textAlign: "center",
    opacity: 0.6,
  },

  // Bouton "Ajouter" en pointillés verts
  addBtn: {
    width: 80, height: 80,
    borderRadius: 12,
    borderWidth: 1.5, borderColor: "#D1F5E8",
    borderStyle: "dashed",
    backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
    gap: 2,
  },
  addText: { fontSize: 9, fontFamily: fonts.bold, color: colors.primary },

  // État vide
  empty: {
    flexDirection: "row", alignItems: "center",
    gap: 8, padding: 4, maxWidth: 220,
  },
  emptyText: { fontSize: 11, color: colors.ink300, lineHeight: 16, flex: 1 },

  // Modal légende
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink900, textAlign: "center" },
  modalInput: {
    backgroundColor: colors.ink50,
    borderRadius: 10,
    padding: 12,
    fontSize: 14, color: colors.ink900,
    borderWidth: 1.5, borderColor: colors.borderLight,
  },
  modalCount: { fontSize: 11, color: colors.ink300, textAlign: "right", marginTop: -8 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1, paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.ink50,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink500 },
  modalSave: {
    flex: 1, paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  modalSaveText: { fontSize: 14, fontFamily: fonts.bold, color: colors.textInverse },
});

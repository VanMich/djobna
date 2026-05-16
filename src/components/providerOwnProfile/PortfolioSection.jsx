// src/components/providerOwnProfile/PortfolioSection.jsx
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../theme";

export default function PortfolioSection({
  portfolio,
  onAdd,
  onRemove,
  readOnly = false,
}) {
  const handleLongPress = (uri) => {
    if (readOnly || !onRemove) return;

    Alert.alert(
      "Supprimer cette photo ?",
      "Cette photo sera retirée de votre portfolio.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => onRemove(uri),
        },
      ],
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {(portfolio || []).map((uri, i) => (
        <TouchableOpacity
          key={`${uri}-${i}`}
          activeOpacity={0.85}
          onLongPress={() => handleLongPress(uri)}
        >
          <Image source={{ uri }} style={styles.photo} />
        </TouchableOpacity>
      ))}

      {!readOnly && (portfolio || []).length < 20 && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
          <Text style={styles.addText}>Ajouter</Text>
        </TouchableOpacity>
      )}

      {(portfolio || []).length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={24} color="#DDD" />
          <Text style={styles.emptyText}>
            {readOnly
              ? "Ce prestataire n'a pas encore ajouté de photos"
              : "Ajoutez des photos de vos travaux pour attirer plus de clients"}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    alignItems: "center",
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  addBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D1F5E8",
    borderStyle: "dashed",
    backgroundColor: "#F0FAF6",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  addText: { fontSize: 9, fontWeight: "700", color: colors.primary },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 4,
    maxWidth: 220,
  },
  emptyText: { fontSize: 11, color: "#AAB0B7", lineHeight: 16, flex: 1 },
});

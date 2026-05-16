// src/components/clientProfile/FavoritesSection.js
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AVATAR_COLORS, SERVICES } from "../../constants/services";
import { colors } from "../../theme";

export default function FavoritesSection({ favorites, onPress, onRemove }) {
  if (favorites.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="heart-outline" size={28} color="#DDD" />
        <Text style={styles.emptyText}>
          Aucun favori — ajoutez des prestataires depuis leur profil
        </Text>
      </View>
    );
  }

  const handleLongPress = (provider) => {
    Alert.alert(
      "Retirer des favoris ?",
      `Retirer ${provider.displayName} de vos favoris ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => onRemove(provider.id),
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
      {favorites.map((provider) => {
        const initials = (provider.displayName || "XX")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const avatarColor =
          AVATAR_COLORS[provider.services?.[0]] || colors.primary;
        const svc = SERVICES.find((s) => s.id === provider.services?.[0]);

        return (
          <TouchableOpacity
            key={provider.id}
            style={styles.chip}
            onPress={() => onPress(provider.id)}
            onLongPress={() => handleLongPress(provider)}
            activeOpacity={0.8}
          >
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {/* Nom */}
            <Text style={styles.name} numberOfLines={1}>
              {provider.displayName?.split(" ")[0]}
            </Text>
            {/* Service */}
            <Text style={styles.service}>{svc?.icon}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4 },
  chip: { alignItems: "center", gap: 5, width: 52 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  name: {
    fontSize: 10,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
    width: 52,
  },
  service: { fontSize: 12 },
  emptyWrap: {
    alignItems: "center",
    padding: 20,
    gap: 8,
    flexDirection: "row",
  },
  emptyText: {
    fontSize: 12,
    color: "#AAB0B7",
    flex: 1,
    lineHeight: 18,
  },
});

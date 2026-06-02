// src/components/ui/ErrorState.jsx
// État d'erreur réutilisable (panne réseau, échec de chargement).
// Affiche une icône, un message clair et un bouton « Réessayer ».
// Usage : {error ? <ErrorState onRetry={refetch} /> : ...}

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "./Icon";
import { colors, fonts, radius, spacing } from "../../theme";

export default function ErrorState({
  message = "Impossible de charger les données. Vérifie ta connexion et réessaie.",
  onRetry,
}) {
  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Icon name="alert-circle" size={40} color={colors.error} />
      </View>
      <Text style={s.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={s.btn} onPress={onRetry} activeOpacity={0.85}>
          <Icon name="refresh-cw" size={16} color={colors.textInverse} />
          <Text style={s.btnText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: spacing.lg, gap: 14 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.errorLight, alignItems: "center", justifyContent: "center",
  },
  message: { fontSize: 14, fontFamily: fonts.medium, color: colors.ink500, textAlign: "center", lineHeight: 21 },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 28,
  },
  btnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.textInverse },
});

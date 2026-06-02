// src/components/home/QuickActions.jsx
// 2 cartes raccourci contextuelles : Urgence + Mes demandes.

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../ui/Icon";
import { colors, fonts, radius, spacing, shadows } from "../../theme";

export default function QuickActions({ requestCount = 0, onUrgency, onMyRequests }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.card} onPress={onUrgency} activeOpacity={0.85}>
        <View style={[styles.iconWrap, { backgroundColor: colors.errorLight }]}>
          <Icon name="zap" size={18} color={colors.error} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Urgence</Text>
          <Text style={styles.sub}>Pro dispo maintenant</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={onMyRequests} activeOpacity={0.85}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Icon name="file-text" size={18} color={colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Mes demandes</Text>
          <Text style={styles.sub}>
            {requestCount > 0 ? `${requestCount} en cours` : "Historique"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: spacing.s5,
    paddingBottom: spacing.md,
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink100,
    borderRadius: radius.lg,
    padding: 14,
    ...shadows.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  title: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink900 },
  sub: { fontSize: 10, fontFamily: fonts.medium, color: colors.ink500, marginTop: 1 },
});

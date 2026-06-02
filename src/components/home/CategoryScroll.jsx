// src/components/home/CategoryScroll.jsx
// Carrousel horizontal de categories de services.
// Chaque categorie = icone dans une carte + label en dessous.

import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../ui/Icon";
import { colors, fonts, radius, spacing, shadows } from "../../theme";

export default function CategoryScroll({ services, activeService, onSelect }) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>SERVICES</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* "Tous" chip */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelect(null)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, !activeService && styles.iconWrapActive]}>
            <Icon
              name="sparkle"
              size={22}
              color={!activeService ? colors.textInverse : colors.ink700}
              weight="fill"
            />
          </View>
          <Text style={[styles.name, !activeService && styles.nameActive]}>Tous</Text>
        </TouchableOpacity>

        {services.map((svc) => {
          const isActive = activeService === svc.id;
          return (
            <TouchableOpacity
              key={svc.id}
              style={styles.card}
              onPress={() => onSelect(isActive ? null : svc.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Icon
                  name={svc.icon}
                  size={22}
                  color={isActive ? colors.textInverse : colors.ink700}
                  weight="duotone"
                />
              </View>
              <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
                {svc.label.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: spacing.md, paddingBottom: spacing.xs },
  label: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: spacing.s5,
    marginBottom: 10,
  },
  scroll: { paddingHorizontal: spacing.s5, gap: 12 },
  card: { alignItems: "center", gap: 6, width: 68 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.ink100,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  name: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.ink500,
    textAlign: "center",
  },
  nameActive: {
    color: colors.primary,
    fontFamily: fonts.bold,
  },
});

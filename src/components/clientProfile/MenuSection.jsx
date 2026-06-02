// src/components/clientProfile/MenuSection.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../theme";

export default function MenuSection({ title, children, last }) {
  return (
    <View style={[styles.container, last && styles.containerLast]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  containerLast: { marginBottom: 10 },
  title: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.ink300,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  content: {},
});

// src/components/clientProfile/MenuSection.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF0EF",
  },
  containerLast: { marginBottom: 10 },
  title: {
    fontSize: 10,
    fontWeight: "700",
    color: "#AAB0B7",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  content: {},
});

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { AVATAR_COLORS } from "../../constants/services";
import { colors, fonts } from "../../theme";

/**
 * Avatar universel — affiche la photo de profil ou les initiales
 * Usage: <Avatar name="Ivan Michel" photoURL={url} size={48} service="mechanic" />
 */
export default function Avatar({ name, photoURL, size = 48, service, style }) {
  const initials = (name || "??")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const bgColor = AVATAR_COLORS[service] || colors.primary;
  const fontSize = Math.round(size * 0.35);
  const borderRadius = size / 2;

  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={[{ width: size, height: size, borderRadius }, style]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ fontSize, fontFamily: fonts.extraBold, color: colors.textInverse }}>
        {initials}
      </Text>
    </View>
  );
}

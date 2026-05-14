// src/components/homeProvider/AvailabilityToggle.js
import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { colors } from "../../theme";

export default function AvailabilityToggle({
  isAvailable,
  onToggle,
  requestCount,
}) {
  // Animation du thumb du toggle
  const thumbAnim = useRef(new Animated.Value(isAvailable ? 1 : 0)).current;

  const handleToggle = () => {
    const newValue = !isAvailable;

    // Animer le thumb
    Animated.spring(thumbAnim, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    onToggle(newValue);
  };

  // Interpolations pour l'animation
  const thumbTranslateX = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 23],
  });
  const trackColor = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.2)", colors.primary],
  });

  return (
    <TouchableOpacity
      style={[styles.container, !isAvailable && styles.containerOff]}
      onPress={handleToggle}
      activeOpacity={0.9}
    >
      {/* Texte et sous-titre */}
      <View style={styles.textBlock}>
        <Text style={[styles.label, !isAvailable && styles.labelOff]}>
          {isAvailable ? "Je suis disponible" : "Je suis hors ligne"}
        </Text>
        <Text style={[styles.sublabel, !isAvailable && styles.sublabelOff]}>
          {isAvailable
            ? requestCount > 0
              ? `Visible sur la carte · ${requestCount} nouvelle${requestCount > 1 ? "s" : ""} demande${requestCount > 1 ? "s" : ""}`
              : "Visible sur la carte · En attente de demandes"
            : "Non visible · Aucune nouvelle demande"}
        </Text>
      </View>

      {/* Toggle animé */}
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX: thumbTranslateX }] },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.06)",
  },
  containerOff: {
    backgroundColor: "rgba(255,255,255,.04)",
    borderColor: "rgba(255,255,255,.03)",
  },
  textBlock: { flex: 1, gap: 3 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  labelOff: { color: "rgba(255,255,255,.4)" },
  sublabel: { fontSize: 10, color: "#9FE1CB" },
  sublabelOff: { color: "rgba(255,255,255,.25)" },

  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    flexShrink: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    // Ombre pour le thumb
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

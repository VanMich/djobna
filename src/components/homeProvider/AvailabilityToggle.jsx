// src/components/homeProvider/AvailabilityToggle.jsx
import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { colors, fonts } from "../../theme";

export default function AvailabilityToggle({ isAvailable, onToggle, requestCount }) {
  const thumbAnim = useRef(new Animated.Value(isAvailable ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: isAvailable ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [isAvailable]);

  const thumbTranslateX = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 23],
  });
  const trackColor = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.ink100, colors.primary],
  });

  return (
    <TouchableOpacity
      style={[styles.container, !isAvailable && styles.containerOff]}
      onPress={() => onToggle(!isAvailable)}
      activeOpacity={0.9}
    >
      <View style={styles.textBlock}>
        <Text style={[styles.label, !isAvailable && styles.labelOff]}>
          {isAvailable ? "Je suis disponible" : "Je suis hors ligne"}
        </Text>
        <Text style={[styles.sublabel, !isAvailable && styles.sublabelOff]}>
          {isAvailable
            ? requestCount > 0
              ? `Visible sur la carte · ${requestCount} nouvelle${requestCount > 1 ? "s" : ""} demande${requestCount > 1 ? "s" : ""}`
              : "Visible sur la carte · En attente de demandes"
            : "Non visible · Active pour recevoir des demandes"}
        </Text>
      </View>

      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.thumb, { transform: [{ translateX: thumbTranslateX }] }]}
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
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.green200,
  },
  containerOff: {
    backgroundColor: colors.ink50,
    borderColor: colors.ink100,
  },
  textBlock: { flex: 1, gap: 3 },
  label: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink900 },
  labelOff: { color: colors.ink500 },
  sublabel: { fontSize: 11, fontFamily: fonts.medium, color: colors.primary },
  sublabelOff: { color: colors.ink300 },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    flexShrink: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

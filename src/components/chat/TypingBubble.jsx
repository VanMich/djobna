// src/components/chat/TypingBubble.jsx
// ─────────────────────────────────────────────────────────
// Bulle « en train d'écrire » : 3 points qui pulsent en boucle,
// affichée en bas du fil quand l'autre personne tape un message.
// Animé avec l'API Animated de React Native (aucune dépendance).
// ─────────────────────────────────────────────────────────

import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import { colors } from "../../theme";

function Dot({ delay }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(700 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  return <Animated.View style={[s.dot, { opacity, transform: [{ translateY }] }]} />;
}

export default function TypingBubble() {
  return (
    <View style={s.row}>
      <View style={s.bubble}>
        <Dot delay={0} />
        <Dot delay={180} />
        <Dot delay={360} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "flex-start", paddingHorizontal: 10, marginBottom: 6, marginTop: 2 },
  bubble: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.card, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingVertical: 11, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink300 },
});

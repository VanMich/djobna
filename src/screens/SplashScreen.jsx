// src/screens/SplashScreen.jsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { colors } from "../theme";

async function getAuthenticatedRoute(user) {
  if (!user) return "Phone";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return "ProfileSetup";

    return "MainApp";
  } catch (err) {
    console.error("Erreur chargement role utilisateur:", err);
    return "MainApp";
  }
}

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animate dots in sequence
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScales[0], {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotScales[0], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotScales[1], {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotScales[1], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotScales[2], {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotScales[2], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    let timer;
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      const nextRoute = await getAuthenticatedRoute(user);
      timer = setTimeout(() => {
        navigation.replace(nextRoute);
      }, 1200);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [fadeAnim, navigation, dotScales]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Dj</Text>
        </View>
        <Text style={styles.appName}>Djobna</Text>
        <Text style={styles.tagline}>
          Trouvez le bon prestataire{"\n"}près de chez vous, maintenant.
        </Text>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { transform: [{ scale: dotScales[i] }] }]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { alignItems: "center", gap: 16 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  dots: { flexDirection: "row", gap: 8, marginTop: 40 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});

// src/screens/SplashScreen.jsx
// Écran de démarrage — vérifie si l'utilisateur est déjà connecté
// et redirige vers le bon écran sans action de l'utilisateur.
//
// Logique de navigation :
//   - Pas de session active   → "Phone"        (écran de connexion)
//   - Session + pas de profil → "ProfileSetup" (premier lancement)
//   - Session + profil ok     → "MainApp"       (app principale)
//
// Remplace Firebase :
//   onAuthStateChanged(auth, cb)  →  supabase.auth.onAuthStateChange(cb)
//   getDoc(doc(db, 'users', uid)) →  supabase.from('users').select().eq('id', uid)

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";
import { colors, fonts } from "../theme";

// Détermine vers quel écran rediriger selon l'état de l'utilisateur
async function getAuthenticatedRoute(user) {
  if (!user) return "Phone";

  try {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    return profile ? "MainApp" : "ProfileSetup";
  } catch (err) {
    console.error("Erreur chargement profil utilisateur:", err);
    return "Phone";
  }
}

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  useEffect(() => {
    // Logo entrance — scale + fade
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScales[0], { toValue: 1.5, duration: 300, useNativeDriver: true }),
        Animated.timing(dotScales[0], { toValue: 1,   duration: 300, useNativeDriver: true }),
        Animated.timing(dotScales[1], { toValue: 1.5, duration: 300, useNativeDriver: true }),
        Animated.timing(dotScales[1], { toValue: 1,   duration: 300, useNativeDriver: true }),
        Animated.timing(dotScales[2], { toValue: 1.5, duration: 300, useNativeDriver: true }),
        Animated.timing(dotScales[2], { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]),
    ).start();

    let timer;

    const checkSession = async () => {
      try {
        // Vérifier si l'onboarding a déjà été vu
        const onboardingDone = await AsyncStorage.getItem("onboarding_done");
        if (!onboardingDone) {
          timer = setTimeout(() => navigation.replace("Onboarding"), 1200);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const nextRoute = await getAuthenticatedRoute(session?.user ?? null);
        timer = setTimeout(() => navigation.replace(nextRoute), 1200);
      } catch (err) {
        console.error("Erreur vérification session:", err);
        timer = setTimeout(() => navigation.replace("Phone"), 1200);
      }
    };

    checkSession();

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation, dotScales]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>Dj</Text>
        </View>
        <Text style={styles.appName}>Djobna</Text>
        <Text style={styles.tagline}>
          Trouve le bon pro{"\n"}près de chez toi, maintenant.
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
    backgroundColor: "#0D1F1A",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { alignItems: "center", gap: 16 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 32, fontFamily: fonts.extraBold, color: "#FFFFFF" },
  appName: {
    fontSize: 36,
    fontFamily: fonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 22,
  },
  dots: { flexDirection: "row", gap: 8, marginTop: 40 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});

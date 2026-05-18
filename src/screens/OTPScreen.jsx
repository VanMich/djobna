// src/screens/OTPScreen.jsx
// Écran de saisie du code OTP reçu par SMS
//
// Différences avec la version Firebase :
//   - Plus de <FirebaseRecaptchaVerifierModal> ni de ref recaptcha
//   - Plus de verificationId dans route.params (on utilise phone directement)
//   - verifyOTP(phone, code) au lieu de verifyOTP(code, verificationId)
//   - isNewUser est détecté dans useAuth.verifyOTP (vérification table users)
//   - getAuthenticatedRoute() supprimé — rendu inutile car isNewUser couvre ce cas

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing } from "../theme";

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }) {
  // phone vient de PhoneScreen — plus de verificationId avec Supabase
  const { phone } = route.params;

  const [code, setCode] = useState(Array(OTP_LENGTH).fill(""));
  const [activeIdx, setActiveIdx] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { sendOTP, verifyOTP, loading, error } = useAuth();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation d'entrée
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Compte à rebours avant de pouvoir renvoyer le code
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Animation secousse sur code incorrect
  const shakeBoxes = useCallback(() => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Saisie d'un chiffre sur le clavier virtuel
  const handleKey = useCallback(
    async (digit) => {
      if (activeIdx >= OTP_LENGTH || loading) return;

      const newCode = [...code];
      newCode[activeIdx] = digit;
      setCode(newCode);
      const nextIdx = activeIdx + 1;
      setActiveIdx(nextIdx);

      if (nextIdx === OTP_LENGTH) {
        const fullCode = newCode.join("");

        // verifyOTP prend (phone, code) — plus de verificationId
        // isNewUser = true si c'est le premier login (pas encore de profil dans users)
        const result = await verifyOTP(phone, fullCode);

        if (result.success) {
          // Redirection directe selon isNewUser — getAuthenticatedRoute n'est plus nécessaire
          navigation.replace(result.isNewUser ? "ProfileSetup" : "MainApp");
        } else {
          shakeBoxes();
          setTimeout(() => {
            setCode(Array(OTP_LENGTH).fill(""));
            setActiveIdx(0);
          }, 800);
        }
      }
    },
    [activeIdx, code, loading, verifyOTP, phone, shakeBoxes, navigation],
  );

  // Effacement du dernier chiffre
  const handleDelete = useCallback(() => {
    if (activeIdx <= 0) return;
    const newCode = [...code];
    newCode[activeIdx - 1] = "";
    setCode(newCode);
    setActiveIdx(activeIdx - 1);
  }, [activeIdx, code]);

  // Renvoyer un nouveau code SMS
  const handleResend = async () => {
    setCode(Array(OTP_LENGTH).fill(""));
    setActiveIdx(0);
    setCountdown(60);
    setCanResend(false);

    // Plus besoin de recaptchaVerifier, plus besoin de mettre à jour verificationId
    const result = await sendOTP(phone);
    if (!result.success) {
      Alert.alert("Erreur", result.message || "Impossible de renvoyer le code.");
    }
  };

  // Rendu d'une case du code OTP
  const renderBox = (idx) => {
    const isFilled = code[idx] !== "";
    const isActive = idx === activeIdx;
    return (
      <Animated.View
        key={idx}
        style={[
          styles.box,
          isFilled && styles.boxFilled,
          isActive && styles.boxActive,
          error && code[idx] && styles.boxError,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <Text style={[styles.boxText, isFilled && styles.boxTextFilled]}>
          {code[idx] || (isActive ? "|" : "")}
        </Text>
      </Animated.View>
    );
  };

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", null, "0", "⌫"];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      {/* Plus de <FirebaseRecaptchaVerifierModal> — supprimé avec Supabase */}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Code de{"\n"}vérification</Text>
        <Text style={styles.subtitle}>Code envoyé au {phone}</Text>
      </View>

      <View style={styles.body}>
        <Animated.View
          style={[styles.boxes, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: OTP_LENGTH }, (_, i) => renderBox(i))}
        </Animated.View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.timerRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendBtn}>Renvoyer le code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Renvoyer dans <Text style={styles.timerCount}>{countdown}s</Text>
            </Text>
          )}
        </View>

        <View style={styles.keypad}>
          {keypad.map((k, i) => (
            <React.Fragment key={i}>
              {k === null ? (
                <View style={styles.keyEmpty} />
              ) : k === "⌫" ? (
                <TouchableOpacity style={styles.key} onPress={handleDelete} activeOpacity={0.7}>
                  <Text style={styles.keyText}>⌫</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.key} onPress={() => handleKey(k)} activeOpacity={0.7}>
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: 60,
    gap: spacing.sm,
  },
  back: { color: colors.primary, fontSize: 14, fontWeight: "500", marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 },
  subtitle: { fontSize: 13, color: colors.textLight },
  body: { flex: 1, padding: spacing.lg, alignItems: "center", gap: 20 },
  boxes: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  box: {
    width: 48,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: { backgroundColor: "#F0FAF6", borderColor: colors.primary },
  boxActive: { borderColor: colors.primary, backgroundColor: "#fff", elevation: 3 },
  boxError: { borderColor: "#E24B4A", backgroundColor: "#FCEBEB" },
  boxText: { fontSize: 26, fontWeight: "700", color: colors.textGray },
  boxTextFilled: { color: colors.primaryDark },
  errorText: { fontSize: 13, color: "#E24B4A", textAlign: "center" },
  timerRow: { alignItems: "center" },
  timerText: { fontSize: 13, color: colors.textGray },
  timerCount: { color: colors.primary, fontWeight: "600" },
  resendBtn: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  keypad: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: "auto",
    paddingBottom: spacing.lg,
  },
  key: {
    width: "30%",
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyEmpty: { width: "30%", height: 56 },
  keyText: { fontSize: 22, fontWeight: "600", color: colors.textDark },
});

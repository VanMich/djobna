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
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "../components/ui/Icon";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, radius, fonts } from "../theme";

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }) {
  const { phone } = route.params || {};

  const [code, setCode] = useState(Array(OTP_LENGTH).fill(""));
  const [activeIdx, setActiveIdx] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { sendOTP, verifyOTP, loading, error } = useAuth();

  // Sécurité : si phone est absent, revenir à l'écran précédent
  useEffect(() => {
    if (!phone) navigation.goBack();
  }, [phone, navigation]);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // Compte à rebours
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
        const result = await verifyOTP(phone, fullCode);

        if (result.success) {
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

  const handleDelete = useCallback(() => {
    if (activeIdx <= 0) return;
    const newCode = [...code];
    newCode[activeIdx - 1] = "";
    setCode(newCode);
    setActiveIdx(activeIdx - 1);
  }, [activeIdx, code]);

  const handleResend = async () => {
    setCode(Array(OTP_LENGTH).fill(""));
    setActiveIdx(0);
    setCountdown(60);
    setCanResend(false);

    const result = await sendOTP(phone);
    if (!result.success) {
      Alert.alert("Erreur", result.message || "Impossible de renvoyer le code. Réessaye.");
    }
  };

  // Rendu d'une case OTP
  const renderBox = (idx) => {
    const isFilled = code[idx] !== "";
    const isActive = idx === activeIdx;
    return (
      <View
        key={idx}
        style={[
          styles.box,
          isFilled && styles.boxFilled,
          isActive && styles.boxActive,
          error && code[idx] && styles.boxError,
        ]}
      >
        <Text style={[styles.boxText, isFilled && styles.boxTextFilled]}>
          {code[idx] || (isActive ? "|" : "")}
        </Text>
      </View>
    );
  };

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", null, "0", "⌫"];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Icon name="chevron-back" size={20} color={colors.headerText} />
        </TouchableOpacity>
        <Text style={styles.title}>Code de{"\n"}vérification</Text>
        <Text style={styles.subtitle}>Code envoyé au {phone}</Text>
      </View>

      <Animated.View
        style={[
          styles.body,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Loading overlay */}
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Vérification…</Text>
          </View>
        ) : null}

        <Animated.View
          style={[styles.boxes, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: OTP_LENGTH }, (_, i) => renderBox(i))}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.timerRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
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
                  <Icon name="backspace-outline" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.key} onPress={() => handleKey(k)} activeOpacity={0.7}>
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              )}
            </React.Fragment>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.headerBg,
    padding: spacing.lg,
    paddingTop: 60,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 26, fontFamily: fonts.bold, color: colors.headerText, lineHeight: 34 },
  subtitle: { fontSize: 13, color: colors.headerSubtext },
  body: { flex: 1, padding: spacing.lg, alignItems: "center", gap: 20 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.medium },
  boxes: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  box: {
    width: 48,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  boxActive: { borderColor: colors.primary, backgroundColor: colors.background, elevation: 3 },
  boxError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  boxText: { fontSize: 26, fontFamily: fonts.bold, color: colors.textMuted },
  boxTextFilled: { color: colors.primaryDark },
  errorText: { fontSize: 13, color: colors.error, textAlign: "center" },
  timerRow: { alignItems: "center" },
  timerText: { fontSize: 13, color: colors.textSecondary },
  timerCount: { color: colors.primary, fontFamily: fonts.semiBold },
  resendBtn: { fontSize: 14, color: colors.primary, fontFamily: fonts.semiBold },
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
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyEmpty: { width: "30%", height: 56 },
  keyText: { fontSize: 22, fontFamily: fonts.semiBold, color: colors.textPrimary },
});

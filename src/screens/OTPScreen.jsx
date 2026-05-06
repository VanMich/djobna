// src/screens/OTPScreen.js
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { firebaseConfig } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing } from "../theme";

const OTP_LENGTH = 6;
// On utilise 6 chiffres comme WhatsApp Cameroun
export default function OTPScreen({ navigation, route }) {
  // route.params contient les données passées depuis PhoneScreen
  // navigation.navigate('OTP', { phone: '+237612345678' })
  const { phone } = route.params;

  const [code, setCode] = useState(Array(OTP_LENGTH).fill(""));
  // code = tableau de 5 strings : ['2','4','','','']
  // On choisit un tableau plutôt qu'une string pour contrôler chaque case

  const [activeIdx, setActiveIdx] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { sendOTP, verifyOTP, loading, error } = useAuth();

  // Ref pour reCAPTCHA
  const recaptchaRef = useRef(null);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Animation d'entrée ──────────────────
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Compte à rebours 60s ────────────────
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // Le return nettoie le timer si le composant est démonté
    // → évite les memory leaks
  }, [countdown]);

  // ── Envoi du SMS au montage (avec délai pour reCAPTCHA) ─────
  useEffect(() => {
    // Délai de 2s pour laisser reCAPTCHA s'initialiser
    const timer = setTimeout(() => {
      if (recaptchaRef.current) {
        handleSendOTP();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSendOTP = async () => {
    const result = await sendOTP(phone, recaptchaRef.current);
    if (!result.success) {
      Alert.alert("Erreur", result.message);
    }
  };

  // ── Resend ──────────────────────────────
  const handleResend = async () => {
    setCode(Array(OTP_LENGTH).fill(""));
    setActiveIdx(0);
    setCountdown(60);
    setCanResend(false);
    await handleSendOTP();
  };

  // ── Animation de secousse (mauvais code) ─
  const shakeBoxes = useCallback(() => {
    Vibration.vibrate(200);
    // Vibration.vibrate() fait vibrer le téléphone (Android/iOS)

    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

  // ── Saisie d'un chiffre ──────────────────
  const handleKey = useCallback(
    async (digit) => {
      if (activeIdx >= OTP_LENGTH || loading) return;

      const newCode = [...code];
      newCode[activeIdx] = digit;
      setCode(newCode);

      const nextIdx = activeIdx + 1;
      setActiveIdx(nextIdx);

      // Si toutes les cases sont remplies → vérification auto
      if (nextIdx === OTP_LENGTH) {
        const fullCode = newCode.join("");
        const result = await verifyOTP(fullCode);

        if (result.success) {
          // Navigation selon si c'est un nouvel utilisateur ou non
          if (result.isNewUser) {
            navigation.replace("ProfileSetup"); // Compléter le profil
          } else {
            navigation.replace("MainApp");
          }
        } else {
          shakeBoxes();
          // Reset les cases après 800ms pour ressaisir
          setTimeout(() => {
            setCode(Array(OTP_LENGTH).fill(""));
            setActiveIdx(0);
          }, 800);
        }
      }
    },
    [activeIdx, code, loading, verifyOTP, shakeBoxes, navigation],
  );

  // ── Effacement ───────────────────────────
  const handleDelete = useCallback(() => {
    if (activeIdx <= 0) return;
    const newCode = [...code];
    const prevIdx = activeIdx - 1;
    newCode[prevIdx] = "";
    setCode(newCode);
    setActiveIdx(prevIdx);
  }, [activeIdx, code]);

  // ── Rendu d'une case OTP ─────────────────
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
          {/* On affiche un curseur '|' dans la case active vide */}
        </Text>
      </Animated.View>
    );
  };

  // ── Rendu d'une touche du clavier ────────
  const renderKey = (value) => {
    if (value === null) return <View style={styles.keyEmpty} />;
    if (value === "⌫") {
      return (
        <TouchableOpacity
          style={styles.key}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.keyText}>⌫</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.key}
        onPress={() => handleKey(value)}
        activeOpacity={0.7}
      >
        <Text style={styles.keyText}>{value}</Text>
      </TouchableOpacity>
    );
  };

  const keypad = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    null,
    "0",
    "⌫",
    // null = touche vide (position du 0 au centre)
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* FirebaseRecaptchaVerifierModal */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaRef}
        firebaseConfig={firebaseConfig}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Code de{"\n"}vérification</Text>
        <Text style={styles.subtitle}>Code envoyé au {phone}</Text>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Cases OTP */}
        <Animated.View
          style={[styles.boxes, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: OTP_LENGTH }, (_, i) => renderBox(i))}
        </Animated.View>

        {/* Message d'erreur */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Compte à rebours / Renvoyer */}
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

        {/* Clavier custom */}
        <View style={styles.keypad}>
          {keypad.map((k, i) => (
            <React.Fragment key={i}>{renderKey(k)}</React.Fragment>
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
  back: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 34 },
  subtitle: { fontSize: 13, color: colors.textLight },

  body: {
    flex: 1,
    padding: spacing.lg,
    alignItems: "center",
    gap: 20,
  },

  boxes: {
    flexDirection: "row",
    gap: 10,
    marginTop: spacing.md,
  },
  box: {
    width: 48, // ← réduit de 54 à 48 pour 6 cases
    height: 60, // garde la hauteur
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: {
    backgroundColor: "#F0FAF6",
    borderColor: colors.primary,
  },
  boxActive: {
    borderColor: colors.primary,
    backgroundColor: "#fff",
    // Ombre légère pour indiquer la case active
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  boxError: {
    borderColor: "#E24B4A",
    backgroundColor: "#FCEBEB",
  },
  boxText: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textGray,
  },
  boxTextFilled: { color: colors.primaryDark },

  errorText: {
    fontSize: 13,
    color: "#E24B4A",
    textAlign: "center",
  },

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
    width: "30%", // 3 colonnes avec les gaps
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

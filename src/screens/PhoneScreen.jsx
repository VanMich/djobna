// src/screens/PhoneScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, radius } from "../theme";

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef(null);
  const { sendOTP } = useAuth();

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length !== 9) {
      Alert.alert("Erreur", "Entrez un numéro valide à 9 chiffres");
      return;
    }
    setLoading(true);
    try {
      const result = await sendOTP("+237" + cleaned, recaptchaVerifier.current);
      if (result.success) {
        navigation.navigate("OTP", {
          phone: "+237" + cleaned,
          verificationId: result.verificationId,
        });
      } else {
        Alert.alert("Erreur", result.message);
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'envoyer le SMS. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* reCAPTCHA invisible obligatoire pour Firebase Phone Auth */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={true}
      />

      <View style={styles.header}>
        <Text style={styles.brand}>Djobna</Text>
        <Text style={styles.title}>Entrez votre{"\n"}numéro de téléphone</Text>
        <Text style={styles.subtitle}>
          Un SMS vous sera envoyé pour confirmer
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>NUMÉRO DE TÉLÉPHONE</Text>
        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryText}>🇨🇲 +237</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="6 XX XX XX XX"
            placeholderTextColor={colors.textGray}
            keyboardType="phone-pad"
            maxLength={9}
            value={phone}
            onChangeText={setPhone}
            autoFocus
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📱 Fonctionne avec MTN, Orange et Camtel. Code SMS gratuit.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {loading ? "Envoi..." : "Recevoir le code SMS →"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: 60,
    gap: spacing.sm,
  },
  brand: { fontSize: 22, fontWeight: "800", color: colors.primary },
  title: { fontSize: 24, fontWeight: "700", color: "#fff", lineHeight: 32 },
  subtitle: { fontSize: 14, color: colors.textLight },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textGray,
    letterSpacing: 0.5,
  },
  inputRow: { flexDirection: "row", gap: 10 },
  countryCode: {
    backgroundColor: colors.lightGray,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
  },
  countryText: { fontSize: 15, fontWeight: "600", color: colors.textDark },
  input: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.textDark,
  },
  infoBox: {
    backgroundColor: "#F0FAF6",
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "#9FE1CB",
  },
  infoText: { fontSize: 13, color: "#0F6E56", lineHeight: 20 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

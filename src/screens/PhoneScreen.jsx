// src/screens/PhoneScreen.jsx
// Écran de saisie du numéro de téléphone
// → envoie un SMS OTP via Supabase (qui appelle Twilio en arrière-plan)
//
// Différence avec la version Firebase :
//   - Plus de <FirebaseRecaptchaVerifierModal> ni de ref recaptcha
//   - sendOTP() n'a plus besoin de recaptchaVerifier en paramètre
//   - Plus de verificationId dans les params de navigation
//     (Supabase identifie la session par le numéro de téléphone directement)

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../hooks/useAuth";
import { Input, Button } from "../components/ui";
import Icon from "../components/ui/Icon";
import { colors, spacing, radius, typography, fonts } from "../theme";

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendOTP } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length !== 9 || !/^\d{9}$/.test(cleaned)) {
      Alert.alert("Numéro invalide", "Entre un numéro valide à 9 chiffres.");
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP("+237" + cleaned);
      if (result.success) {
        navigation.navigate("OTP", { phone: "+237" + cleaned });
      } else {
        Alert.alert("Erreur", result.message);
      }
    } catch (err) {
      Alert.alert("Oups", "Impossible d'envoyer le SMS. Réessaye.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.brand}>Djobna</Text>
        <Text style={styles.title}>Entre ton{"\n"}numéro de téléphone</Text>
        <Text style={styles.subtitle}>
          Un SMS te sera envoyé pour confirmer
        </Text>
      </View>

      <Animated.View
        style={[
          styles.body,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Input
          label="NUMÉRO DE TÉLÉPHONE"
          value={phone}
          onChangeText={setPhone}
          placeholder="6 XX XX XX XX"
          keyboardType="phone-pad"
          maxLength={9}
          autoFocus
          leftComponent={
            <Text style={styles.countryText}>🇨🇲 +237</Text>
          }
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Fonctionne avec MTN, Orange et Camtel. Code SMS gratuit.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Button
          title={loading ? "Envoi..." : "Recevoir le code SMS →"}
          onPress={handleSendOTP}
          loading={loading}
          disabled={phone.replace(/\s/g, "").length < 9}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.headerBg,
    padding: spacing.lg,
    paddingTop: 60,
    gap: spacing.sm,
  },
  brand: { fontSize: 22, fontFamily: fonts.extraBold, color: colors.primary },
  title: { fontSize: 24, fontFamily: fonts.bold, color: colors.headerText, lineHeight: 32 },
  subtitle: { fontSize: 14, color: colors.headerSubtext },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  countryText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.textPrimary },
  infoBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.green200,
  },
  infoText: { fontSize: 13, color: colors.primaryDark, lineHeight: 20 },
});

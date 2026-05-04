// src/screens/PhoneScreen.js
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radius, spacing } from "../theme";

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  // useState('') = variable réactive.
  // phone = valeur actuelle, setPhone = fonction pour la changer
  // Quand setPhone est appelé → le composant se re-affiche

  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    // Validation simple du numéro camerounais
    const cleaned = phone.replace(/\s/g, ""); // Supprimer les espaces
    if (cleaned.length < 9) {
      Alert.alert("Erreur", "Entrez un numéro valide à 9 chiffres");
      return;
    }

    setLoading(true);
    try {
      // TODO: Appel Firebase Auth ou Twilio ici
      // await sendOTPviaTwilio('+237' + cleaned);

      // Simuler un délai réseau
      await new Promise((r) => setTimeout(r, 1000));

      // Naviguer vers l'écran OTP en passant le numéro
      navigation.navigate("OTP", { phone: "+237" + cleaned });
      // On passe phone comme paramètre → récupéré dans OTPScreen
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'envoyer le SMS. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // KeyboardAvoidingView remonte le contenu quand le clavier s'ouvre
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // iOS et Android gèrent le clavier différemment → Platform.OS
    >
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
            keyboardType="phone-pad" // Affiche le clavier numérique
            maxLength={9}
            value={phone}
            onChangeText={setPhone} // Mise à jour automatique à chaque frappe
            autoFocus // Focus automatique à l'ouverture
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📱 Fonctionne avec MTN, Orange et Camtel. Code SMS gratuit.
          </Text>
        </View>

        {/* TouchableOpacity = bouton avec effet de clic */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
          activeOpacity={0.8} // Opacité au clic (0 = invisible, 1 = normal)
        >
          <Text style={styles.buttonText}>
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
    paddingTop: 60, // Espace pour la status bar
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
    fontSize: 11,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

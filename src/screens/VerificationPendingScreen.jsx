// src/screens/VerificationPendingScreen.jsx
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing } from "../theme";

export default function VerificationPendingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.brand}>Djobna</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        <Text style={styles.title}>Dossier soumis !</Text>
        <Text style={styles.subtitle}>
          Votre dossier est en cours d'examen. Notre équipe vérifie vos informations et vos documents d'identité.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Que se passe-t-il maintenant ?</Text>
          <View style={styles.infoStep}>
            <Text style={styles.infoStepNum}>1</Text>
            <Text style={styles.infoStepText}>Vérification automatique de votre CNI (quelques minutes)</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.infoStepNum}>2</Text>
            <Text style={styles.infoStepText}>Si nécessaire, examen manuel par notre équipe (24–48h)</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.infoStepNum}>3</Text>
            <Text style={styles.infoStepText}>Notification dans l'application dès que c'est validé</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.infoStepNum}>4</Text>
            <Text style={styles.infoStepText}>1 mois Premium offert automatiquement à l'activation</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            En attendant, vous pouvez continuer à utiliser Djobna en tant que client.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.replace("MainApp")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Continuer en mode Client →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  brand: { fontSize: 18, fontWeight: "800", color: colors.primary },
  body: { flex: 1, backgroundColor: "#fff", padding: spacing.lg, gap: spacing.md, alignItems: "center" },
  iconWrap: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: "#F0FAF6", alignItems: "center", justifyContent: "center",
    marginTop: spacing.lg,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 26, fontWeight: "700", color: colors.textDark, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.textGray, textAlign: "center", lineHeight: 22 },
  infoCard: {
    width: "100%", backgroundColor: "#F8F8F8", borderRadius: 16,
    padding: spacing.md, gap: 12, borderWidth: 1, borderColor: "#E8E8E8",
  },
  infoTitle: { fontSize: 13, fontWeight: "700", color: colors.textDark, marginBottom: 4 },
  infoStep: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoStepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, color: "#fff",
    fontSize: 12, fontWeight: "700", textAlign: "center", lineHeight: 24,
  },
  infoStepText: { flex: 1, fontSize: 13, color: colors.textGray, lineHeight: 20 },
  noteBox: {
    width: "100%", backgroundColor: "#F0FAF6", borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: "#9FE1CB",
  },
  noteText: { fontSize: 13, color: "#0F6E56", textAlign: "center", lineHeight: 20 },
  btn: {
    width: "100%", backgroundColor: colors.primary, borderRadius: 14,
    padding: 16, alignItems: "center", marginTop: "auto",
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

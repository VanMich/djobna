// src/screens/VerificationPendingScreen.jsx
import { CommonActions } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/ui";
import Icon from "../components/ui/Icon";
import { colors, spacing, radius, fonts } from "../theme";

export default function VerificationPendingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.brand}>Djobna</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Icon name="hourglass" size={48} color={colors.primary} weight="duotone" />
        </View>

        <Text style={styles.title}>Dossier soumis !</Text>
        <Text style={styles.subtitle}>
          Ton dossier est en cours d'examen. Notre équipe vérifie tes informations et tes documents d'identité.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Que se passe-t-il maintenant ?</Text>
          <View style={styles.infoStep}>
            <Text style={styles.infoStepNum}>1</Text>
            <Text style={styles.infoStepText}>Vérification automatique de ta CNI (quelques minutes)</Text>
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
            En attendant, tu peux continuer à utiliser Djobna en tant que client.
          </Text>
        </View>

        <Button
          title="Continuer en mode Client →"
          onPress={() =>
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: "MainApp" }] })
            )
          }
          style={{ marginTop: "auto" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.headerBg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  brand: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.primary },
  body: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md, alignItems: "center" },
  iconWrap: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center",
    marginTop: spacing.lg,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 26, fontFamily: fonts.bold, color: colors.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
  infoCard: {
    width: "100%", backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, gap: 12, borderWidth: 1, borderColor: colors.border,
  },
  infoTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 4 },
  infoStep: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoStepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, color: colors.textInverse,
    fontSize: 12, fontFamily: fonts.bold, textAlign: "center", lineHeight: 24,
  },
  infoStepText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  noteBox: {
    width: "100%", backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: 14, borderWidth: 1, borderColor: colors.green200,
  },
  noteText: { fontSize: 13, color: colors.primaryDark, textAlign: "center", lineHeight: 20 },
});

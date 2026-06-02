// src/screens/PaymentScreen.jsx
// Écran de paiement Mobile Money (Orange Money, MTN MoMo).
// Flux : sélection opérateur → numéro → confirmation → traitement → succès/échec.
// Accessible depuis DevisCard (bouton "Payer") ou fin de mission.

import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../config/supabase";
import Icon from "../components/ui/Icon";
import { colors, fonts, spacing, radius } from "../theme";

// ── Opérateurs supportés ─────────────────────────────────────────────────────
const OPERATORS = [
  { id: "orange", label: "Orange Money", color: "#FF6600", prefix: "69" },
  { id: "mtn",    label: "MTN MoMo",     color: "#FFCC00", prefix: "67" },
];

// ── Étapes du flux ───────────────────────────────────────────────────────────
const STATUS = {
  IDLE: "idle",
  CONFIRMING: "confirming",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
};

export default function PaymentScreen({ route, navigation }) {
  const { amount, requestId, providerName, devisId } = route.params || {};

  const [operator, setOperator] = useState(null);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [transactionRef, setTransactionRef] = useState(null);

  const formattedAmount = (amount || 0).toLocaleString("fr-FR");

  const handleSelectOperator = useCallback((op) => {
    setOperator(op);
    if (!phone) setPhone(op.prefix);
  }, [phone]);

  const validatePhone = useCallback(() => {
    const cleaned = phone.replace(/\s/g, "");
    if (!/^\d{9}$/.test(cleaned)) {
      Alert.alert("Numéro invalide", "Entre un numéro à 9 chiffres.");
      return false;
    }
    return true;
  }, [phone]);

  const handleConfirm = useCallback(() => {
    if (!operator) { Alert.alert("Opérateur requis", "Sélectionne ton opérateur."); return; }
    if (!validatePhone()) return;
    setStatus(STATUS.CONFIRMING);
  }, [operator, validatePhone]);

  const handlePay = useCallback(async () => {
    setStatus(STATUS.PROCESSING);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Non connecté");

      // Appel à l'Edge Function de paiement
      const { data, error } = await supabase.functions.invoke("initiate-payment", {
        body: {
          amount,
          operator: operator.id,
          phone: phone.replace(/\s/g, ""),
          requestId,
          devisId,
          userId: session.user.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setTransactionRef(data.transactionRef);
        setStatus(STATUS.SUCCESS);

        // NOTE (chantier Paiement) : le marquage « payé » sera fait côté serveur
        // par le webhook PSP (il met à jour la table `payments` + le statut sur
        // `requests`). Le client ne peut pas écrire le devis du message
        // (bloqué par le trigger protect_message_columns), donc rien ici.
      } else {
        setStatus(STATUS.FAILED);
      }
    } catch (err) {
      console.error("Erreur paiement:", err);
      setStatus(STATUS.FAILED);
    }
  }, [amount, operator, phone, requestId, devisId]);

  const handleRetry = useCallback(() => {
    setStatus(STATUS.IDLE);
  }, []);

  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ── Écran de succès ────────────────────────────────────────────────────────
  if (status === STATUS.SUCCESS) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.resultContainer}>
          <View style={[styles.resultIcon, { backgroundColor: colors.primarySoft }]}>
            <Icon name="check-circle" size={56} color={colors.primary} />
          </View>
          <Text style={styles.resultTitle}>Paiement effectué !</Text>
          <Text style={styles.resultSub}>
            {formattedAmount} FCFA envoyés via {operator?.label}.
          </Text>
          {transactionRef && (
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Référence</Text>
              <Text style={styles.refValue}>{transactionRef}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Terminé</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Écran d'échec ──────────────────────────────────────────────────────────
  if (status === STATUS.FAILED) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.resultContainer}>
          <View style={[styles.resultIcon, { backgroundColor: colors.errorLight }]}>
            <Icon name="x-circle" size={56} color={colors.error} />
          </View>
          <Text style={styles.resultTitle}>Paiement échoué</Text>
          <Text style={styles.resultSub}>
            La transaction n'a pas abouti. Vérifie ton solde et réessaye.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
            <Icon name="refresh-cw" size={16} color={colors.textInverse} />
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleDone} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Écran de traitement ────────────────────────────────────────────────────
  if (status === STATUS.PROCESSING) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.resultContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingTitle}>Transaction en cours...</Text>
          <Text style={styles.processingSub}>
            Valide la transaction sur ton téléphone via le menu USSD de {operator?.label}.
          </Text>
        </View>
      </View>
    );
  }

  // ── Écran de confirmation ──────────────────────────────────────────────────
  if (status === STATUS.CONFIRMING) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.headerSafe} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStatus(STATUS.IDLE)}>
              <Icon name="arrow-left" size={20} color={colors.ink700} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirmer le paiement</Text>
          </View>
        </SafeAreaView>
        <View style={styles.confirmContainer}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmLabel}>Montant</Text>
            <Text style={styles.confirmAmount}>{formattedAmount} FCFA</Text>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmDetail}>Opérateur</Text>
              <Text style={styles.confirmValue}>{operator?.label}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmDetail}>Numéro</Text>
              <Text style={styles.confirmValue}>{phone}</Text>
            </View>
            {providerName && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmDetail}>Destinataire</Text>
                <Text style={styles.confirmValue}>{providerName}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.85}>
            <Icon name="lock" size={16} color={colors.textInverse} />
            <Text style={styles.payBtnText}>Payer {formattedAmount} FCFA</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Formulaire principal ───────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={colors.ink700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Montant */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Montant à payer</Text>
            <Text style={styles.amountValue}>{formattedAmount} FCFA</Text>
            {providerName && <Text style={styles.amountSub}>Pour : {providerName}</Text>}
          </View>

          {/* Opérateur */}
          <Text style={styles.sectionLabel}>OPÉRATEUR</Text>
          <View style={styles.operatorsRow}>
            {OPERATORS.map((op) => (
              <TouchableOpacity
                key={op.id}
                style={[styles.opCard, operator?.id === op.id && styles.opCardActive]}
                onPress={() => handleSelectOperator(op)}
                activeOpacity={0.8}
              >
                <View style={[styles.opDot, { backgroundColor: op.color }]} />
                <Text style={[styles.opLabel, operator?.id === op.id && styles.opLabelActive]}>
                  {op.label}
                </Text>
                {operator?.id === op.id && <Icon name="check" size={14} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Numéro */}
          <Text style={styles.sectionLabel}>NUMÉRO MOBILE MONEY</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+237</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="6X XXX XXXX"
              placeholderTextColor={colors.ink300}
              keyboardType="phone-pad"
              maxLength={12}
            />
          </View>

          {/* Sécurité */}
          <View style={styles.securityNote}>
            <Icon name="shield-check" size={16} color={colors.primary} />
            <Text style={styles.securityText}>
              Transaction sécurisée. Aucune donnée bancaire stockée.
            </Text>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.ctaBtn, (!operator || !phone) && styles.ctaBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={!operator || !phone}
          >
            <Text style={styles.ctaBtnText}>Continuer</Text>
            <Icon name="arrow-right" size={16} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.headerBg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.ink50, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink900 },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, gap: 20 },

  // Amount card
  amountCard: {
    backgroundColor: colors.primarySoft, borderRadius: radius.lg,
    padding: 20, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: colors.green200,
  },
  amountLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.primaryDark },
  amountValue: { fontSize: 32, fontFamily: fonts.extraBold, color: colors.primaryDark },
  amountSub: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500, marginTop: 4 },

  // Section label
  sectionLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.ink500, letterSpacing: 0.5 },

  // Operators
  operatorsRow: { flexDirection: "row", gap: 12 },
  opCard: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: 14, borderWidth: 1.5, borderColor: colors.borderLight,
  },
  opCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  opDot: { width: 12, height: 12, borderRadius: 6 },
  opLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.ink700, flex: 1 },
  opLabelActive: { color: colors.primaryDark },

  // Phone
  phoneRow: { flexDirection: "row", gap: 8 },
  phonePrefix: {
    backgroundColor: colors.ink50, borderRadius: radius.md,
    paddingHorizontal: 14, justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.borderLight,
  },
  phonePrefixText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink700 },
  phoneInput: {
    flex: 1, backgroundColor: colors.ink50, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 16, fontFamily: fonts.medium, color: colors.ink900,
    borderWidth: 1.5, borderColor: colors.borderLight,
  },

  // Security
  securityNote: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  securityText: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500, flex: 1 },

  // Footer
  footer: { paddingHorizontal: spacing.lg, paddingBottom: 32, paddingTop: 12 },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16,
  },
  ctaBtnDisabled: { opacity: 0.4 },
  ctaBtnText: { fontSize: 16, fontFamily: fonts.bold, color: colors.textInverse },

  // Confirmation
  confirmContainer: { flex: 1, padding: spacing.lg, justifyContent: "center", gap: 24 },
  confirmCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: 24, gap: 14, borderWidth: 1, borderColor: colors.borderLight,
  },
  confirmLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.ink300, textTransform: "uppercase" },
  confirmAmount: { fontSize: 28, fontFamily: fonts.extraBold, color: colors.ink900 },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  confirmDetail: { fontSize: 13, fontFamily: fonts.medium, color: colors.ink500 },
  confirmValue: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink900 },
  payBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16,
  },
  payBtnText: { fontSize: 16, fontFamily: fonts.bold, color: colors.textInverse },

  // Result screens
  resultContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: 16 },
  resultIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  resultTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.ink900, textAlign: "center" },
  resultSub: { fontSize: 14, fontFamily: fonts.medium, color: colors.ink500, textAlign: "center", lineHeight: 22 },
  refBox: {
    backgroundColor: colors.ink50, borderRadius: radius.md,
    padding: 14, alignItems: "center", gap: 4, width: "100%",
  },
  refLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.ink300, textTransform: "uppercase" },
  refValue: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink900 },
  doneBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: 40, marginTop: 12,
  },
  doneBtnText: { fontSize: 15, fontFamily: fonts.bold, color: colors.textInverse },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: 32, marginTop: 8,
  },
  retryBtnText: { fontSize: 15, fontFamily: fonts.bold, color: colors.textInverse },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.medium, color: colors.ink500 },
  processingTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink900, marginTop: 16 },
  processingSub: { fontSize: 13, fontFamily: fonts.medium, color: colors.ink500, textAlign: "center", lineHeight: 20 },
});

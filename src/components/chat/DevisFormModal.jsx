// src/components/chat/DevisFormModal.jsx
import Icon from "../../components/ui/Icon";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, fonts } from "../../theme";

export default function DevisFormModal({ visible, onClose, onSend }) {
  const [title, setTitle] = useState("");
  const [lines, setLines] = useState([{ label: "", amount: "" }]);
  const [validUntil, setValidUntil] = useState("");

  const total = lines.reduce((sum, l) => sum + (parseInt(l.amount) || 0), 0);

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { label: "", amount: "" }]);

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!title.trim() || total === 0) return;
    const validLines = lines.filter((l) => l.label.trim() && parseInt(l.amount) > 0);
    onSend({
      title: title.trim(),
      lines: validLines.map((l) => ({ label: l.label.trim(), amount: parseInt(l.amount) })),
      total,
      validUntil: validUntil.trim() || null,
    });
    setTitle("");
    setLines([{ label: "", amount: "" }]);
    setValidUntil("");
    onClose();
  };

  const canSend = title.trim().length > 0 && total > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Créer un devis</Text>
              <Text style={styles.headerSub}>Détaillez les prestations</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Icon name="close" size={18} color={colors.ink500} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            {/* Titre */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Intitulé du devis</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Vidange Toyota Corolla"
                placeholderTextColor={colors.ink300}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
              />
            </View>

            {/* Lignes de prestation */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Détail des prestations</Text>
              {lines.map((line, index) => (
                <View key={index} style={styles.lineRow}>
                  <TextInput
                    style={[styles.input, styles.lineLabel]}
                    placeholder={`Prestation ${index + 1}`}
                    placeholderTextColor={colors.ink300}
                    value={line.label}
                    onChangeText={(v) => updateLine(index, "label", v)}
                  />
                  <TextInput
                    style={[styles.input, styles.lineAmount]}
                    placeholder="0"
                    placeholderTextColor={colors.ink300}
                    value={line.amount}
                    onChangeText={(v) => updateLine(index, "amount", v)}
                    keyboardType="numeric"
                  />
                  {lines.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeLine(index)}
                      activeOpacity={0.8}
                    >
                      <Icon name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addLineBtn} onPress={addLine} activeOpacity={0.8}>
                <Icon name="add-circle-outline" size={15} color={colors.primary} />
                <Text style={styles.addLineBtnText}>Ajouter une ligne</Text>
              </TouchableOpacity>
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalAmount}>{total.toLocaleString("fr-FR")} FCFA</Text>
            </View>

            {/* Validité */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Valable jusqu'au (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 27 mai 2026"
                placeholderTextColor={colors.ink300}
                value={validUntil}
                onChangeText={setValidUntil}
              />
            </View>

            {/* Envoyer */}
            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.85}
            >
              <Icon name="document-text-outline" size={16} color={colors.textInverse} />
              <Text style={styles.sendBtnText}>Envoyer le devis</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink100,
    alignSelf: "center",
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink900 },
  headerSub: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink300, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { padding: 20, gap: 20 },

  field: { gap: 8 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink300,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.ink50,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.ink900,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  lineLabel: { flex: 1 },
  lineAmount: { width: 90, textAlign: "right" },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  addLineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  addLineBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.primary },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.green200,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: fonts.extraBold,
    color: colors.primaryDark,
    letterSpacing: 0.8,
  },
  totalAmount: { fontSize: 22, fontFamily: fonts.extraBold, color: colors.primary },

  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.45, elevation: 0, shadowOpacity: 0 },
  sendBtnText: { fontSize: 15, fontFamily: fonts.bold, color: colors.textInverse },
});

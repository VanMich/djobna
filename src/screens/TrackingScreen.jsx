// src/screens/TrackingScreen.jsx
// ─────────────────────────────────────────────────────────
// Écran de suivi d'une mission (vue client).
// Basé UNIQUEMENT sur les vrais statuts en base (requests.status +
// requests.devis_accepted). Aucune dépendance GPS / carte / ETA.
// Accessible depuis le Chat quand status = "in_progress".
// ─────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../config/supabase";
import Icon from "../components/ui/Icon";
import MissionTimeline from "../components/tracking/MissionTimeline";
import { colors, fonts, spacing, radius } from "../theme";

export default function TrackingScreen({ route, navigation }) {
  const { requestId, providerName, providerPhone } = route.params || {};

  const [status, setStatus] = useState(null);
  const [devisAccepted, setDevisAccepted] = useState(false);
  const [timestamps, setTimestamps] = useState({});
  const [loading, setLoading] = useState(true);

  // Applique une ligne de la table requests à l'état local
  const applyRow = useCallback((row) => {
    if (!row) return;
    setStatus(row.status || "pending");
    setDevisAccepted(!!row.devis_accepted);
    setTimestamps({
      sent: row.created_at || null,
      done: row.completed_at || null,
    });
  }, []);

  // Chargement initial (vraies colonnes uniquement)
  useEffect(() => {
    if (!requestId) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("requests")
        .select("status, devis_accepted, created_at, completed_at")
        .eq("id", requestId)
        .single();
      if (active) {
        applyRow(data);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [requestId, applyRow]);

  // Realtime : se met à jour quand le pro fait avancer la mission
  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel(`tracking-${requestId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "requests",
        filter: `id=eq.${requestId}`,
      }, (payload) => applyRow(payload.new))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [requestId, applyRow]);

  const handleCall = useCallback(() => {
    if (providerPhone) Linking.openURL(`tel:${providerPhone}`);
  }, [providerPhone]);

  const handleChat = useCallback(() => {
    navigation.navigate("Chat", { requestId, providerName });
  }, [navigation, requestId, providerName]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── En-tête ── */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={colors.ink700} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Suivi de la mission</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{providerName || "Pro"}</Text>
          </View>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      {/* ── Contenu ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <MissionTimeline
              status={status}
              devisAccepted={devisAccepted}
              timestamps={timestamps}
            />
          </View>
        </ScrollView>
      )}

      {/* ── Actions de contact ── */}
      {!loading && status !== "declined" && (
        <SafeAreaView style={styles.actionsSafe} edges={["bottom"]}>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleChat} activeOpacity={0.85}>
              <Icon name="message-circle" size={18} color={colors.primary} />
              <Text style={styles.actionText}>Chat</Text>
            </TouchableOpacity>
            {providerPhone && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnCall]} onPress={handleCall} activeOpacity={0.85}>
                <Icon name="phone" size={18} color={colors.textInverse} />
                <Text style={[styles.actionText, styles.actionTextCall]}>Appeler</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  headerSafe: { backgroundColor: colors.card },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.ink50,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.ink50, alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink900 },
  headerSub: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500, marginTop: 1 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: spacing.md, paddingBottom: 24 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: 18, borderWidth: 1, borderColor: colors.ink50,
  },

  // Actions
  actionsSafe: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.ink50 },
  actions: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.primarySoft, borderRadius: radius.md,
    paddingVertical: 14,
  },
  actionBtnCall: { backgroundColor: colors.primary },
  actionText: { fontSize: 14, fontFamily: fonts.bold, color: colors.primary },
  actionTextCall: { color: colors.textInverse },
});

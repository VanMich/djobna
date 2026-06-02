// src/screens/MissionHistoryScreen.jsx
// Historique des missions du client (§17).
// Affiche toutes les demandes liées à l'utilisateur connecté, triées par date.

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../config/supabase";
import { SERVICES } from "../constants/services";
import Icon from "../components/ui/Icon";
import { colors, radius, fonts } from "../theme";

const STATUS_CONFIG = {
  pending:     { label: "En attente",  color: colors.mangoDark, bg: colors.mangoSoft },
  in_progress: { label: "En cours",    color: colors.info, bg: colors.infoLight },
  completed:   { label: "Terminée",    color: colors.primary, bg: colors.successSoft },
  declined:    { label: "Déclinée",    color: colors.ink500, bg: colors.ink50 },
  cancelled:   { label: "Annulée",     color: colors.error, bg: colors.errorLight },
};

function formatDate(val) {
  if (!val) return "";
  return new Date(val).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function MissionItem({ item }) {
  const svc = SERVICES.find((s) => s.id === item.service);
  const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={styles.svcIcon}>
            <Icon name={svc?.icon || "clipboard-text"} size={18} color={colors.primary} weight="duotone" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || svc?.label || "Mission"}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {item.client_name || item.location || "—"}
            </Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        {item.budget ? (
          <Text style={styles.cardBudget}>
            {Number(item.budget).toLocaleString("fr-FR")} FCFA
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function MissionHistoryScreen({ navigation }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }

      const { data: userData } = await supabase
        .from("users")
        .select("active_role")
        .eq("id", user.id)
        .single();
      const activeRole = userData?.active_role || "client";

      const col = activeRole === "provider" ? "provider_id" : "client_id";
      const { data } = await supabase
        .from("requests")
        .select("*")
        .eq(col, user.id)
        .order("created_at", { ascending: false });

      setMissions(data || []);
      setLoading(false);
    })();
  }, []);

  const FILTERS = [
    { key: "all",         label: "Toutes" },
    { key: "in_progress", label: "En cours" },
    { key: "completed",   label: "Terminées" },
    { key: "pending",     label: "En attente" },
  ];

  const filtered = filter === "all"
    ? missions
    : missions.filter((m) => m.status === filter);

  if (loading) {
    return (
      <View style={styles.loader}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="chevron-back" size={20} color={colors.ink700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique des missions</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{missions.length}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Filtres */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <MissionItem item={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="time-outline" size={52} color={colors.ink100} />
            <Text style={styles.emptyTitle}>Aucune mission</Text>
            <Text style={styles.emptySub}>
              {filter === "all"
                ? "Tes missions apparaîtront ici une fois que tu auras fait des demandes."
                : "Aucune mission ne correspond à ce filtre."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  loader: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.headerBg,
  },
  headerSafe: { backgroundColor: colors.headerBg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.ink50,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: fonts.bold, color: colors.headerText },
  countBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: { fontSize: 11, fontFamily: fonts.extraBold, color: colors.primary },

  filtersRow: {
    flexDirection: "row",
    gap: 8, paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },

  list: { padding: 16, gap: 10, paddingBottom: 30 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: 14, gap: 10,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  svcIcon: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, flexShrink: 0 },
  badgeText: { fontSize: 11, fontFamily: fonts.bold },
  cardBottom: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8,
  },
  cardDate: { fontSize: 11, color: colors.textMuted },
  cardBudget: { fontSize: 12, fontFamily: fonts.bold, color: colors.primary },

  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.textPrimary },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
});

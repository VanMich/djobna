// src/screens/EarningsScreen.jsx
// Tableau de bord des revenus du pro — solde, historique des transactions, retrait Mobile Money.
// Accessible depuis le profil pro (ProviderProfileOwnScreen).

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../config/supabase";
import Icon from "../components/ui/Icon";
import { colors, fonts, spacing, radius } from "../theme";

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(val) {
  return (val || 0).toLocaleString("fr-FR");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTransactionConfig(type) {
  switch (type) {
    case "payment_received":
      return { icon: "arrow-down-left", color: colors.primary, bg: colors.primarySoft, sign: "+" };
    case "withdrawal":
      return { icon: "arrow-up-right", color: colors.error, bg: colors.errorLight, sign: "-" };
    case "commission":
      return { icon: "percent", color: colors.mango, bg: colors.mangoSoft, sign: "-" };
    case "bonus":
      return { icon: "gift", color: colors.purple, bg: colors.purpleSoft, sign: "+" };
    default:
      return { icon: "circle", color: colors.ink500, bg: colors.ink50, sign: "" };
  }
}

// ── Carte statistique ───────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Icon name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Ligne de transaction ────────────────────────────────────────────────────
function TransactionItem({ item }) {
  const config = getTransactionConfig(item.type);

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: config.bg }]}>
        <Icon name={config.icon} size={16} color={config.color} />
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txTitle} numberOfLines={1}>{item.description || item.type}</Text>
        <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: config.color }]}>
        {config.sign}{formatCurrency(item.amount)} F
      </Text>
    </View>
  );
}

// ── Écran principal ─────────────────────────────────────────────────────────
export default function EarningsScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [completedMissions, setCompletedMissions] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      // Solde du wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (wallet) setBalance(wallet.balance || 0);

      // Revenus du mois en cours
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthData } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("type", "payment_received")
        .gte("created_at", startOfMonth.toISOString());

      if (monthData) {
        const total = monthData.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        setMonthEarnings(total);
      }

      // Missions terminées ce mois
      const { count } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", userId)
        .eq("status", "completed")
        .gte("updated_at", startOfMonth.toISOString());

      setCompletedMissions(count || 0);

      // Historique des transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (txData) setTransactions(txData);
    } catch (err) {
      console.error("Erreur chargement revenus:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const handleWithdraw = useCallback(() => {
    if (balance <= 0) {
      Alert.alert("Solde insuffisant", "Tu n'as pas encore de fonds à retirer.");
      return;
    }
    navigation.navigate("Payment", {
      amount: balance,
      requestId: null,
      providerName: null,
      devisId: null,
      mode: "withdrawal",
    });
  }, [balance, navigation]);

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
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={colors.ink700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes revenus</Text>
        </View>
      </SafeAreaView>

      <FlatList
        data={transactions}
        renderItem={({ item }) => <TransactionItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchEarnings(); }}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Solde principal ── */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceValue}>{formatCurrency(balance)} FCFA</Text>
              <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw} activeOpacity={0.85}>
                <Icon name="arrow-up-right" size={16} color={colors.textInverse} />
                <Text style={styles.withdrawBtnText}>Retirer</Text>
              </TouchableOpacity>
            </View>

            {/* ── Statistiques du mois ── */}
            <View style={styles.statsRow}>
              <StatCard
                icon="trending-up"
                label="Ce mois"
                value={`${formatCurrency(monthEarnings)} F`}
                color={colors.primary}
                bg={colors.primarySoft}
              />
              <StatCard
                icon="check-circle"
                label="Missions"
                value={`${completedMissions}`}
                color={colors.mango}
                bg={colors.mangoSoft}
              />
            </View>

            {/* ── Titre section historique ── */}
            <Text style={styles.sectionTitle}>Historique</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="inbox" size={40} color={colors.ink100} />
            <Text style={styles.emptyTitle}>Aucune transaction</Text>
            <Text style={styles.emptySub}>Tes revenus apparaitront ici une fois ta premiere mission terminee.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },

  headerSafe: { backgroundColor: colors.headerBg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.ink50, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.ink900 },

  listContent: { paddingBottom: 40 },

  // Balance card
  balanceCard: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    margin: spacing.lg, marginBottom: spacing.md,
    padding: 24, alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: "#0D1F1A", shadowOpacity: 0.04, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  balanceLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500 },
  balanceValue: { fontSize: 34, fontFamily: fonts.extraBold, color: colors.ink900 },
  withdrawBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 24, marginTop: 8,
  },
  withdrawBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.textInverse },

  // Stats
  statsRow: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: spacing.lg, marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1, borderRadius: radius.lg,
    padding: 16, gap: 6,
  },
  statValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink900 },
  statLabel: { fontSize: 11, fontFamily: fonts.medium, color: colors.ink500 },

  // Section title
  sectionTitle: {
    fontSize: 16, fontFamily: fonts.bold, color: colors.ink900,
    paddingHorizontal: spacing.lg, marginBottom: 8,
  },

  // Transactions
  txRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: colors.borderLight,
  },
  txIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  txBody: { flex: 1, gap: 2 },
  txTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink900 },
  txDate: { fontSize: 11, fontFamily: fonts.medium, color: colors.ink300 },
  txAmount: { fontSize: 14, fontFamily: fonts.bold },

  // Empty
  empty: { alignItems: "center", paddingTop: 40, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink700 },
  emptySub: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink300, textAlign: "center", lineHeight: 18 },
});

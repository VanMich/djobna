// src/screens/NotificationsScreen.jsx
// Centre de notifications — liste toutes les notifications reçues (demandes, messages, avis, système).
// Accessible depuis l'icône cloche dans les headers.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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

// ── Types de notification et leurs icônes/couleurs ─────────────────────────────
const NOTIF_CONFIG = {
  request_received: { icon: "inbox", color: colors.primary, bg: colors.primarySoft, label: "Nouvelle demande" },
  request_accepted: { icon: "check-circle", color: colors.primary, bg: colors.primarySoft, label: "Demande acceptée" },
  request_declined: { icon: "x-circle", color: colors.error, bg: colors.errorLight, label: "Demande déclinée" },
  message:          { icon: "message-circle", color: colors.purple, bg: colors.purpleSoft, label: "Message" },
  review:           { icon: "star", color: colors.mango, bg: colors.mangoSoft, label: "Nouvel avis" },
  mission_complete: { icon: "award", color: colors.primary, bg: colors.primarySoft, label: "Mission terminee" },
  payment:          { icon: "credit-card", color: colors.sky, bg: colors.skySoft, label: "Paiement" },
  system:           { icon: "bell", color: colors.ink500, bg: colors.ink50, label: "Système" },
};

function getConfig(type) {
  return NOTIF_CONFIG[type] || NOTIF_CONFIG.system;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "maintenant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── Carte de notification ────────────────────────────────────────────────────
function NotificationItem({ item, onPress }) {
  const config = getConfig(item.type);
  const opacity = useRef(new Animated.Value(item.read ? 1 : 1)).current;

  return (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Icon name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <Text style={styles.itemLabel}>{config.label}</Text>
          <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        {item.body ? (
          <Text style={styles.itemDesc} numberOfLines={2}>{item.body}</Text>
        ) : null}
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ── Écran principal ──────────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) setNotifications(data);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime — écoute les nouvelles notifications
  useEffect(() => {
    let channel;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      channel = supabase
        .channel(`notifs-${session.user.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        }, (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        })
        .subscribe();
    })();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const handlePress = useCallback(async (notif) => {
    // 1) Marquer comme lu (optimiste)
    if (!notif.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", notif.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
      );
    }

    // 2) Deep-linking : on reconstruit la cible à partir de related_id (= id de la demande).
    // Notif système sans cible → on s'arrête après le "marquer lu".
    const requestId = notif.related_id;
    if (!requestId) return;

    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return;

    // Existe-t-il un chat lié à cette demande ? (RLS : seul un participant le lit)
    const { data: chat } = await supabase
      .from("chats")
      .select("id, client_id, provider_id")
      .eq("request_id", requestId)
      .maybeSingle();

    if (chat) {
      // Chat trouvé (demande acceptée, mission terminée…) → on ouvre la conversation.
      // ChatScreen va chercher lui-même le nom/photo de l'autre user via otherUserId.
      const iAmClient = uid === chat.client_id;
      navigation.navigate("Chat", {
        chatId: chat.id,
        requestId,
        providerId: iAmClient ? chat.provider_id : undefined,
        clientId: iAmClient ? undefined : chat.client_id,
      });
      return;
    }

    // Pas de chat (demande encore en attente) → détail de la demande côté prestataire.
    // On mappe la ligne snake_case → camelCase, forme attendue par RequestDetailScreen.
    const { data: r } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (!r) return;
    navigation.navigate("RequestDetail", {
      request: {
        id: r.id,
        clientId: r.client_id,
        clientName: r.client_name,
        providerId: r.provider_id,
        service: r.service,
        title: r.title,
        description: r.description,
        location: r.location,
        scheduledDate: r.scheduled_date,
        budget: r.budget,
        photos: r.photos || [],
        status: r.status,
        quartier: r.quartier,
        providerCompletedAt: r.provider_completed_at ? new Date(r.provider_completed_at).getTime() : null,
        createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
      },
    });
  }, [navigation]);

  const handleMarkAllRead = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", session.user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Tout lire</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <FlatList
        data={notifications}
        renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell-off" size={48} color={colors.ink100} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySub}>Tu recevras tes alertes ici (demandes, messages, avis...).</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.ink50,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: fonts.bold, color: colors.ink900 },
  markAllBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primarySoft },
  markAllText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.primary },

  listContent: { paddingBottom: 40 },

  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  itemUnread: { backgroundColor: colors.ink50 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  itemBody: { flex: 1, gap: 2 },
  itemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.ink500, textTransform: "uppercase", letterSpacing: 0.5 },
  itemTime: { fontSize: 10, fontFamily: fonts.medium, color: colors.ink300 },
  itemTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink900 },
  itemDesc: { fontSize: 12, fontFamily: fonts.regular, color: colors.ink500, lineHeight: 18 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 16,
  },

  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink700 },
  emptySub: { fontSize: 13, fontFamily: fonts.medium, color: colors.ink300, textAlign: "center", lineHeight: 20 },
});

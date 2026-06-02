// src/screens/HomeScreen.jsx
// Homepage client — header light, carrousel categories, quick actions, liste de pros.
// Design System : fond creme, Manrope, forest-tinted neutrals, ombres Airbnb-like.

import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../config/supabase";
import { PRICE_RANGES, SERVICES } from "../constants/services";
import { useProviders } from "../hooks/useProviders";
import { Avatar, SkeletonList, EmptyState, PremiumBadge, VerifiedBadge } from "../components/ui";
import Icon from "../components/ui/Icon";
import ErrorState from "../components/ui/ErrorState";
import CategoryScroll from "../components/home/CategoryScroll";
import QuickActions from "../components/home/QuickActions";
import SearchModal from "../components/search/SearchModal";
import { colors, radius, spacing, shadows, typography, fonts } from "../theme";


// ── Utilitaire prix ────────────────────────────────────
function getPriceDisplay(provider) {
  const pricing = provider.servicePricing;
  if (pricing && Object.keys(pricing).length > 0) {
    const vals = Object.values(pricing);
    const min = Math.min(...vals.map((p) => p.minPrice || 0));
    const max = Math.max(...vals.map((p) => p.maxPrice || 0));
    return `${min.toLocaleString("fr-FR")} – ${max.toLocaleString("fr-FR")} FCFA`;
  }
  return PRICE_RANGES[provider.services?.[0]] || PRICE_RANGES.default;
}

// ── Utilitaire note ────────────────────────────────────
function getRating(provider) {
  if (typeof provider.rating === "object") return provider.rating?.global ?? 0;
  return provider.rating ?? 0;
}

export default function HomeScreen({ navigation }) {
  // ── Filtres ────────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeService, setActiveService]   = useState(null);
  const [activeQuartier, setActiveQuartier] = useState(null);
  const [activeRating, setActiveRating]     = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const { providers, loading, error, refetch } = useProviders({
    service: activeService,
    quartier: activeQuartier,
    minRating: activeRating,
    searchQuery,
  });

  // ── Infos utilisateur ──
  const [firstName, setFirstName] = useState("toi");
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", session.user.id)
        .single();
      if (data?.display_name) setFirstName(data.display_name.split(" ")[0]);
    })();
  }, []);
  const hour = new Date().getHours();
  const greetingText =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  // ── Animations ─────────────────────────────────────────
  const listAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      listAnim.setValue(0);
      Animated.spring(listAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 11,
      }).start();
    }
  }, [loading, providers.length]);

  const listTranslate = listAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ══════════ HEADER ══════════ */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          {/* Ligne salutation + cloche */}
          <View style={styles.topRow}>
            <View>
              <View style={styles.greetRow}>
                <Text style={styles.greetingText}>{greetingText}</Text>
                <Icon name="hand" size={14} color={colors.primary} />
              </View>
              <Text style={styles.userNameText}>{firstName}</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Icon name="bell" size={20} color={colors.ink700} />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche (faux bouton → ouvre la modale) */}
          <TouchableOpacity
            style={styles.searchWrap}
            onPress={() => setSearchOpen(true)}
            activeOpacity={0.8}
          >
            <Icon name="search" size={18} color={colors.ink300} />
            <Text style={styles.searchPlaceholder}>
              {searchQuery || "Rechercher un pro..."}
            </Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="x" size={16} color={colors.ink500} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ══════════ CORPS ══════════ */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Carrousel categories */}
        <CategoryScroll
          services={SERVICES}
          activeService={activeService}
          onSelect={setActiveService}
        />

        {/* Quick actions */}
        <QuickActions
          requestCount={0}
          onUrgency={() => {
            setActiveService(null);
            setActiveQuartier(null);
            setActiveRating(0);
          }}
          onMyRequests={() => navigation.navigate("MyRequests")}
        />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeService
              ? SERVICES.find((s) => s.id === activeService)?.label
              : searchQuery
              ? `Résultats pour "${searchQuery}"`
              : "Près de toi"}
          </Text>
          <View style={styles.sectionCount}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionCountText}>{providers.length} pro{providers.length > 1 ? "s" : ""}</Text>
          </View>
        </View>

        {/* Liste */}
        {loading ? (
          <SkeletonList count={3} />
        ) : error ? (
          <ErrorState onRetry={refetch} message="Impossible de charger les prestataires. Vérifie ta connexion et réessaie." />
        ) : providers.length === 0 ? (
          <EmptyState
            icon="search"
            title="Aucun pro trouvé"
            subtitle="Essaie d'autres filtres ou reviens plus tard."
          />
        ) : (
          <Animated.View style={{ opacity: listAnim, transform: [{ translateY: listTranslate }] }}>
            {providers.map((provider, index) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                index={index}
                onPress={() => navigation.navigate("ProviderProfile", { providerId: provider.id })}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* ══════════ SEARCH MODAL ══════════ */}
      <SearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProvider={(provider) => navigation.navigate("ProviderProfile", { providerId: provider.id })}
        onSelectService={(serviceId) => {
          setActiveService(serviceId);
          setSearchQuery("");
        }}
        onSelectQuartier={(quartier) => {
          setActiveQuartier(quartier);
          setSearchQuery("");
        }}
      />
    </View>
  );
}

// ── Carte prestataire ──────────────────────────────────
function ProviderCard({ provider, index, onPress }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 70,
      useNativeDriver: true,
      tension: 80,
      friction: 11,
    }).start();
  }, []);

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300 }).start();

  const mainService = SERVICES.find((s) => s.id === provider.services?.[0]);
  const extraCount  = (provider.services?.length || 1) - 1;
  const rating      = getRating(provider);
  const priceText   = getPriceDisplay(provider);
  const isPremium   = provider.subscription?.plan === "premium";

  const opacity    = anim;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <Animated.View style={[styles.cardWrap, { opacity, transform: [{ translateY }, { scale }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Avatar
            name={provider.displayName}
            photoURL={provider.photoURL}
            size={54}
            service={provider.services?.[0]}
          />
        </View>

        {/* Contenu */}
        <View style={styles.cardBody}>
          {/* Nom + badges */}
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{provider.displayName}</Text>
            <View style={styles.badgesRow}>
              {isPremium && <PremiumBadge />}
              {provider.verificationStatus === "approved" && !isPremium && (
                <VerifiedBadge size={18} />
              )}
            </View>
          </View>

          {/* Service + quartier */}
          <View style={styles.cardSubRow}>
            {mainService?.icon && <Icon name={mainService.icon} size={13} color={colors.primary} weight="duotone" />}
            <Text style={styles.cardSub} numberOfLines={1}>
              {mainService?.label}
              {extraCount > 0 ? `  +${extraCount}` : ""}
              {"  ·  "}
              {provider.quartier || "Douala"}
            </Text>
          </View>

          {/* Note + prix */}
          <View style={styles.cardFooter}>
            {rating > 0 ? (
              <View style={styles.ratingPill}>
                <Icon name="star" size={10} color={colors.star} />
                <Text style={styles.ratingVal}>{rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({provider.reviewCount || 0})</Text>
              </View>
            ) : (
              <View style={[styles.ratingPill, styles.ratingPillNew]}>
                <Icon name="star" size={10} color={colors.ink300} />
                <Text style={[styles.ratingVal, { color: colors.ink500 }]}>Nouveau</Text>
              </View>
            )}
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>{priceText}</Text>
            </View>
          </View>
        </View>

        <Icon name="chevron-right" size={16} color={colors.ink300} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.background },

  // Header
  header: {
    paddingHorizontal: spacing.s5,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  greetRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  greetingText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  userNameText: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    color: colors.ink900,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.ink50,
    borderWidth: 1,
    borderColor: colors.ink100,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.ink50,
    borderWidth: 1.5,
    borderColor: colors.ink100,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.ink300,
  },
  // Body
  body: { flex: 1 },
  bodyContent: { paddingBottom: 40 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.s5,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.ink900,
    letterSpacing: -0.3,
  },
  sectionCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.ink50,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  sectionCountText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.ink500,
  },

  // Provider card
  cardWrap: { paddingHorizontal: spacing.s5, marginBottom: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: colors.ink100,
    ...shadows.sm,
  },
  avatarWrap: { position: "relative" },
  cardBody: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink900,
    flex: 1,
  },
  badgesRow: { flexDirection: "row", gap: 4 },
  cardSubRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardSub: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.mangoSoft,
    borderRadius: radius.xs,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  ratingPillNew: { backgroundColor: colors.ink50 },
  ratingVal: { fontSize: 12, fontFamily: fonts.bold, color: colors.mangoDark },
  ratingCount: { fontSize: 10, fontFamily: fonts.medium, color: colors.ink500, marginLeft: 1 },
  pricePill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xs,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  priceText: { fontSize: 10, fontFamily: fonts.bold, color: colors.primaryDark },
});

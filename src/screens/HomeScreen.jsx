// src/screens/HomeScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../config/supabase";
import { AVATAR_COLORS, PRICE_RANGES, SERVICES, QUARTIERS_DOUALA } from "../constants/services";
import { useProviders } from "../hooks/useProviders";
import { colors, radius, spacing } from "../theme";

const PANEL_H = 290;
const RATING_OPTIONS = [0, 3, 4, 4.5];
const RATING_LABELS  = ["Tous", "3+", "4+", "4.5+"];

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
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = [activeService, activeQuartier, activeRating > 0]
    .filter(Boolean).length;

  const { providers, loading } = useProviders({
    service: activeService,
    quartier: activeQuartier,
    minRating: activeRating,
    searchQuery,
  });

  // ── Infos utilisateur ─────────────────────────────────
  // Remplace auth.currentUser (synchrone Firebase) + user.displayName
  // display_name est stocké dans la table users, pas dans supabase.auth
  const [firstName, setFirstName] = useState("vous");
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (data?.display_name) setFirstName(data.display_name.split(" ")[0]);
    })();
  }, []);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour 👋" : hour < 18 ? "Bon après-midi 👋" : "Bonsoir 👋";

  // ── Animations ─────────────────────────────────────────
  const panelHeight  = useRef(new Animated.Value(0)).current;
  const filterRotate = useRef(new Animated.Value(0)).current;
  const listAnim     = useRef(new Animated.Value(0)).current;
  const badgeScale   = useRef(new Animated.Value(1)).current;

  // Animation d'entrée de la liste quand le chargement termine
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

  // Animation du badge quand les filtres changent
  useEffect(() => {
    if (activeFilterCount > 0) {
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: 1.4, useNativeDriver: true, tension: 200 }),
        Animated.spring(badgeScale, { toValue: 1,   useNativeDriver: true, tension: 200 }),
      ]).start();
    }
  }, [activeFilterCount]);

  const toggleFilter = useCallback(() => {
    const opening = !filterOpen;
    setFilterOpen(opening);
    Animated.parallel([
      Animated.spring(panelHeight, {
        toValue: opening ? PANEL_H : 0,
        useNativeDriver: false,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(filterRotate, {
        toValue: opening ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [filterOpen, panelHeight, filterRotate]);

  const resetFilters = useCallback(() => {
    setActiveService(null);
    setActiveQuartier(null);
    setActiveRating(0);
  }, []);

  const iconRotation = filterRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const listTranslate = listAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ══════════ HEADER ══════════ */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>

          {/* Ligne salutation + cloche */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.userNameText}>{firstName}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
              <Ionicons name="notifications" size={20} color={colors.textLight} />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Barre de recherche + bouton filtre */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={colors.green300} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un prestataire…"
                placeholderTextColor="rgba(159,225,203,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={16} color={colors.textLight} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.filterBtn, filterOpen && styles.filterBtnActive]}
              onPress={toggleFilter}
              activeOpacity={0.85}
            >
              <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
                <Ionicons name="options" size={20} color={filterOpen ? "#fff" : colors.textLight} />
              </Animated.View>
              {activeFilterCount > 0 && (
                <Animated.View style={[styles.filterBadge, { transform: [{ scale: badgeScale }] }]}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════ PANNEAU DE FILTRES ══════════ */}
        <Animated.View style={[styles.filterPanel, { height: panelHeight }]}>
          <ScrollView
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {/* — Service — */}
            <Text style={styles.filterLabel}>SERVICE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, !activeService && styles.chipActive]}
                onPress={() => setActiveService(null)} activeOpacity={0.8}>
                <Text style={[styles.chipText, !activeService && styles.chipTextActive]}>🌟 Tous</Text>
              </TouchableOpacity>
              {SERVICES.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.chip, activeService === svc.id && styles.chipActive]}
                  onPress={() => setActiveService(activeService === svc.id ? null : svc.id)}
                  activeOpacity={0.8}>
                  <Text style={[styles.chipText, activeService === svc.id && styles.chipTextActive]}>
                    {svc.icon} {svc.label.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* — Quartier — */}
            <Text style={[styles.filterLabel, { marginTop: 10 }]}>QUARTIER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, !activeQuartier && styles.chipActive]}
                onPress={() => setActiveQuartier(null)} activeOpacity={0.8}>
                <Text style={[styles.chipText, !activeQuartier && styles.chipTextActive]}>📍 Tous</Text>
              </TouchableOpacity>
              {QUARTIERS_DOUALA.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.chip, activeQuartier === q && styles.chipActive]}
                  onPress={() => setActiveQuartier(activeQuartier === q ? null : q)}
                  activeOpacity={0.8}>
                  <Text style={[styles.chipText, activeQuartier === q && styles.chipTextActive]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* — Note — */}
            <View style={styles.ratingRow}>
              <Text style={styles.filterLabel}>NOTE MINIMALE</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.resetBtn}>Réinitialiser</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.ratingBtns}>
              {RATING_OPTIONS.map((val, i) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.ratingChip, activeRating === val && styles.ratingChipActive]}
                  onPress={() => setActiveRating(val)}
                  activeOpacity={0.8}>
                  {val > 0 && <Ionicons name="star" size={11} color={activeRating === val ? "#fff" : colors.star} />}
                  <Text style={[styles.ratingChipText, activeRating === val && styles.ratingChipTextActive]}>
                    {RATING_LABELS[i]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* ══════════ CORPS ══════════ */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Barre de stats + filtres actifs */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <View style={styles.statDot} />
            <Text style={styles.statText}>
              <Text style={styles.statNum}>{providers.length} </Text>
              prestataire{providers.length > 1 ? "s" : ""}
            </Text>
          </View>
          {activeService && (
            <TouchableOpacity style={styles.activeTag} onPress={() => setActiveService(null)} activeOpacity={0.8}>
              <Text style={styles.activeTagText}>
                {SERVICES.find((s) => s.id === activeService)?.icon}{" "}
                {SERVICES.find((s) => s.id === activeService)?.label.split(" ")[0]}
              </Text>
              <Ionicons name="close" size={11} color={colors.primary} />
            </TouchableOpacity>
          )}
          {activeQuartier && (
            <TouchableOpacity style={styles.activeTag} onPress={() => setActiveQuartier(null)} activeOpacity={0.8}>
              <Text style={styles.activeTagText}>📍 {activeQuartier}</Text>
              <Ionicons name="close" size={11} color={colors.primary} />
            </TouchableOpacity>
          )}
          {activeRating > 0 && (
            <TouchableOpacity style={styles.activeTag} onPress={() => setActiveRating(0)} activeOpacity={0.8}>
              <Text style={styles.activeTagText}>⭐ {activeRating}+</Text>
              <Ionicons name="close" size={11} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeService
              ? SERVICES.find((s) => s.id === activeService)?.label
              : searchQuery
              ? `Résultats pour "${searchQuery}"`
              : "Près de vous"}
          </Text>
        </View>

        {/* Liste */}
        {loading ? (
          <SkeletonList />
        ) : providers.length === 0 ? (
          <EmptyState />
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
    </View>
  );
}

// ── Carte prestataire ──────────────────────────────────
function ProviderCard({ provider, index, onPress }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Entrée décalée (stagger) selon l'index
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

  const avatarColor = AVATAR_COLORS[provider.services?.[0]] || colors.primary;
  const initials = (provider.displayName || "??")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

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
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.availDot} />
        </View>

        {/* Contenu */}
        <View style={styles.cardBody}>
          {/* Nom + badges */}
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{provider.displayName}</Text>
            <View style={styles.badgesRow}>
              {isPremium && (
                <View style={styles.badgePremium}>
                  <Text style={styles.badgePremiumText}>⭐ Pro</Text>
                </View>
              )}
              {provider.verificationStatus === "approved" && !isPremium && (
                <View style={styles.badgeVerified}>
                  <Text style={styles.badgeVerifiedText}>✓</Text>
                </View>
              )}
            </View>
          </View>

          {/* Service + quartier */}
          <Text style={styles.cardSub} numberOfLines={1}>
            {mainService?.icon} {mainService?.label}
            {extraCount > 0 ? `  +${extraCount}` : ""}
            {"  ·  "}
            <Text style={styles.cardQuartier}>{provider.quartier || "Douala"}</Text>
          </Text>

          {/* Note + prix */}
          <View style={styles.cardFooter}>
            {rating > 0 ? (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={10} color={colors.star} />
                <Text style={styles.ratingVal}>{rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({provider.reviewCount || 0})</Text>
              </View>
            ) : (
              <View style={styles.ratingPill}>
                <Ionicons name="star-outline" size={10} color="#CCC" />
                <Text style={[styles.ratingVal, { color: "#CCC" }]}>Nouveau</Text>
              </View>
            )}
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>{priceText}</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#DDD" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Skeleton de chargement ─────────────────────────────
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%", marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: "40%", marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
}

function SkeletonList() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
    </View>
  );
}

// ── État vide ──────────────────────────────────────────
function EmptyState() {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 700, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,  duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.empty}>
      <Animated.Text style={[styles.emptyIcon, { transform: [{ translateY: bounce }] }]}>🔍</Animated.Text>
      <Text style={styles.emptyTitle}>Aucun prestataire trouvé</Text>
      <Text style={styles.emptySub}>Essayez d'autres filtres ou revenez plus tard.</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  greetingText: { fontSize: 12, color: colors.green300, fontWeight: "600", letterSpacing: 0.3 },
  userNameText: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },

  notifBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  notifBadge: {
    position: "absolute", top: 8, right: 8,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.error,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.background,
  },
  notifBadgeText: { fontSize: 7, fontWeight: "800", color: "#fff" },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  searchIcon: { opacity: 0.8 },
  searchInput: { flex: 1, fontSize: 14, color: "#fff", fontWeight: "500" },

  filterBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBadge: {
    position: "absolute", top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.background,
  },
  filterBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },

  filterPanel: {
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
  },
  filterScroll: { flex: 1 },
  filterScrollContent: { paddingHorizontal: spacing.md, paddingTop: 14, paddingBottom: 16, gap: 8 },
  filterLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.35)", letterSpacing: 0.8 },
  chipsRow: { flexDirection: "row", gap: 7, paddingRight: 16 },
  chip: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  chipTextActive: { color: "#fff" },

  ratingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resetBtn: { fontSize: 12, color: colors.textLight, fontWeight: "600" },
  ratingBtns: { flexDirection: "row", gap: 8 },
  ratingChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  ratingChipActive: { backgroundColor: colors.star, borderColor: colors.star },
  ratingChipText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  ratingChipTextActive: { color: "#fff" },

  body: { flex: 1, backgroundColor: "#F2F4F3" },
  bodyContent: { padding: spacing.md, paddingBottom: 40, gap: 10 },

  statsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 2 },
  statPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#E8EDE8",
  },
  statDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  statText: { fontSize: 12, color: "#555" },
  statNum: { fontWeight: "700", color: colors.primary },
  activeTag: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.green100, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 1, borderColor: colors.green200,
  },
  activeTagText: { fontSize: 11, fontWeight: "600", color: colors.primary },

  sectionHeader: { marginBottom: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#111", letterSpacing: -0.3 },

  cardWrap: { marginBottom: 2 },
  card: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 14, flexDirection: "row", alignItems: "center", gap: 13,
    borderWidth: 1, borderColor: "#EEF0EF",
    shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  availDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2, borderColor: "#fff",
  },

  cardBody: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1 },
  badgesRow: { flexDirection: "row", gap: 4 },
  badgePremium: {
    backgroundColor: "#FFFBEB", borderRadius: 6,
    paddingVertical: 2, paddingHorizontal: 6,
    borderWidth: 1, borderColor: "#FCD34D",
  },
  badgePremiumText: { fontSize: 9, fontWeight: "700", color: "#B45309" },
  badgeVerified: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.green100,
    alignItems: "center", justifyContent: "center",
  },
  badgeVerifiedText: { fontSize: 10, fontWeight: "800", color: colors.primary },

  cardSub: { fontSize: 12, color: "#888" },
  cardQuartier: { color: "#666" },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 2 },

  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#FFFBEB", borderRadius: 8,
    paddingVertical: 3, paddingHorizontal: 7,
  },
  ratingVal: { fontSize: 11, fontWeight: "700", color: "#B45309" },
  ratingCount: { fontSize: 10, color: "#888" },
  pricePill: {
    backgroundColor: "#F0FAF6", borderRadius: 8,
    paddingVertical: 3, paddingHorizontal: 7,
  },
  priceText: { fontSize: 10, fontWeight: "600", color: colors.primaryDark },

  skeletonCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 14,
    flexDirection: "row", gap: 13,
    borderWidth: 1, borderColor: "#EEF0EF",
  },
  skeletonAvatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: "#E8E8E8" },
  skeletonBody: { flex: 1, justifyContent: "center" },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: "#E8E8E8", width: "80%" },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#333" },
  emptySub: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 20, paddingHorizontal: 30 },
});

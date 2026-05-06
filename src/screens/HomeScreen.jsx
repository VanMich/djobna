// src/screens/HomeScreen.js
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import { SERVICES } from "../constants/services";
import { useProviders } from "../hooks/useProviders";
import { colors } from "../theme";

export default function HomeScreen({ navigation }) {
  const [activeService, setActiveService] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const { providers, loading } = useProviders(activeService);
  const user = auth.currentUser;
  const firstName = user?.displayName?.split(" ")[0] || "vous";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour 👋" : hour < 18 ? "Bon après-midi 👋" : "Bonsoir 👋";

  const panelHeight = useRef(new Animated.Value(0)).current;
  const filterRotate = useRef(new Animated.Value(0)).current;
  const PANEL_H = 90;

  // ── Toggle filtre ─────────────────────────
  const toggleFilter = useCallback(() => {
    const opening = !filterOpen;

    if (opening) {
      setFilterOpen(true);

      // Ouverture → spring (effet naturel)
      Animated.parallel([
        Animated.spring(panelHeight, {
          toValue: PANEL_H,
          useNativeDriver: false,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(filterRotate, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fermeture → timing (pas de rebond)
      Animated.parallel([
        Animated.timing(panelHeight, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
          // easing par défaut = linéaire, pas de rebond
        }),
        Animated.timing(filterRotate, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Ferme l'état APRÈS la fin de l'animation
        setFilterOpen(false);
      });
    }
  }, [filterOpen, panelHeight, filterRotate]);

  const handleSelectService = useCallback(
    (serviceId) => {
      setActiveService(serviceId);

      // Fermeture → timing (pas de rebond)
      Animated.parallel([
        Animated.timing(panelHeight, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
        }),
        Animated.timing(filterRotate, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFilterOpen(false);
      });
    },
    [panelHeight, filterRotate],
  );

  const iconRotation = filterRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ════════════════════════════════════ */}
      {/* HEADER FIXE                         */}
      {/* ════════════════════════════════════ */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          {/* Ligne 1 : Salutation + Notif */}
          <View style={styles.topRow}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.userNameText}>{firstName}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
              <Ionicons name="notifications" size={20} color="#9FE1CB" />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Ligne 2 : Recherche + Bouton filtre */}
          <View style={styles.searchRow}>
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => navigation.navigate("Search")}
              activeOpacity={0.85}
            >
              <View style={styles.searchIconWrap}>
                <Ionicons name="search" size={15} color="#5DCAA5" />
              </View>
              <Text style={styles.searchPlaceholder}>
                Quel service cherchez-vous ?
              </Text>
            </TouchableOpacity>

            {/* Bouton filtre */}
            <TouchableOpacity
              style={[styles.filterBtn, filterOpen && styles.filterBtnActive]}
              onPress={toggleFilter}
              activeOpacity={0.85}
            >
              <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
                <Ionicons
                  name="options"
                  size={20}
                  color={filterOpen ? "#fff" : "#9FE1CB"}
                />
              </Animated.View>

              {/* Badge filtre actif */}
              {activeService && (
                <View
                  style={[
                    styles.filterBadge,
                    filterOpen && styles.filterBadgeOpen,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      filterOpen && styles.filterBadgeTextOpen,
                    ]}
                  >
                    1
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ════════════════════════════════════ */}
        {/* PANNEAU FILTRES ANIMÉ               */}
        {/* ════════════════════════════════════ */}
        <Animated.View style={[styles.filterPanel, { height: panelHeight }]}>
          <View style={styles.filterPanelInner}>
            <Text style={styles.filterPanelLabel}>CATÉGORIE DE SERVICE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {/* Chip "Tous" */}
              <TouchableOpacity
                style={[styles.chip, !activeService && styles.chipActive]}
                onPress={() => handleSelectService(null)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    !activeService && styles.chipTextActive,
                  ]}
                >
                  🌟 Tous
                </Text>
              </TouchableOpacity>

              {/* Un chip par service */}
              {SERVICES.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.chip,
                    activeService === service.id && styles.chipActive,
                  ]}
                  onPress={() => handleSelectService(service.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      activeService === service.id && styles.chipTextActive,
                    ]}
                  >
                    {service.icon} {service.label.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* ════════════════════════════════════ */}
      {/* CORPS                               */}
      {/* ════════════════════════════════════ */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ligne stats */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Ionicons name="ellipse" size={8} color={colors.primary} />
            <Text style={styles.statText}>
              <Text style={styles.statNum}>{providers.length} </Text>
              disponible{providers.length > 1 ? "s" : ""}
            </Text>
          </View>

          {/* Pill filtre actif */}
          {activeService && (
            <TouchableOpacity
              style={styles.activeFilterPill}
              onPress={() => handleSelectService(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.activeFilterText}>
                {SERVICES.find((s) => s.id === activeService)?.icon}{" "}
                {
                  SERVICES.find((s) => s.id === activeService)?.label.split(
                    " ",
                  )[0]
                }
              </Text>
              <Ionicons name="close-circle" size={13} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Titre section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeService
              ? SERVICES.find((s) => s.id === activeService)?.label
              : "Près de vous"}
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {/* Liste prestataires */}
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Chargement...</Text>
          </View>
        ) : providers.length === 0 ? (
          <EmptyState />
        ) : (
          providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onPress={() =>
                navigation.navigate("ProviderProfile", {
                  providerId: provider.id,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Carte prestataire ─────────────────────────────────────
function ProviderCard({ provider, onPress }) {
  const AVATAR_COLORS = {
    mechanic: "#1D9E75",
    electrician: "#3C3489",
    plumber: "#185FA5",
    barber: "#BA7517",
    painter: "#993C1D",
    housekeeper: "#0F6E56",
    caterer: "#6B3FA0",
  };

  const avatarColor = AVATAR_COLORS[provider.services?.[0]] || colors.primary;
  const initials = (provider.displayName || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const mainService = SERVICES.find((s) => s.id === provider.services?.[0]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Avatar + point disponible */}
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.availDot} />
      </View>

      {/* Infos */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {provider.displayName}
          </Text>
          {provider.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Pro</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardService}>
          {mainService?.icon} {mainService?.label}
          {"  ·  "}
          {provider.quartier || "Douala"}
        </Text>

        <View style={styles.cardBottomRow}>
          {provider.rating > 0 && (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={10} color="#B45309" />
              <Text style={styles.ratingVal}>{provider.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>
                ({provider.reviewCount || 0})
              </Text>
            </View>
          )}
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>
              {mainService?.id === "barber"
                ? "2 000–8 000 FCFA"
                : mainService?.id === "mechanic"
                  ? "5 000–20 000 FCFA"
                  : mainService?.id === "plumber"
                    ? "5 000–15 000 FCFA"
                    : mainService?.id === "electrician"
                      ? "8 000–30 000 FCFA"
                      : "5 000–25 000 FCFA"}
            </Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#DDD" />
    </TouchableOpacity>
  );
}

// ── État vide ─────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="search" size={44} color="#DDD" />
      <Text style={styles.emptyTitle}>Aucun prestataire disponible</Text>
      <Text style={styles.emptySub}>
        Essayez une autre catégorie ou revenez plus tard.
      </Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // ── Header ───────────────────────────────
  headerSafe: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  greetingBlock: { gap: 2 },
  greetingText: { fontSize: 13, color: "#5DCAA5", fontWeight: "500" },
  userNameText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },

  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E24B4A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  notifBadgeText: { fontSize: 7, fontWeight: "800", color: "#fff" },

  // Recherche + filtre
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  searchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "rgba(29,158,117,.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPlaceholder: { flex: 1, fontSize: 13, color: "#9FE1CB" },

  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeOpen: { backgroundColor: "#fff" },
  filterBadgeText: { fontSize: 8, fontWeight: "800", color: "#fff" },
  filterBadgeTextOpen: { color: colors.primary },

  // ── Panneau filtres ───────────────────────
  filterPanel: {
    backgroundColor: colors.background,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.06)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  filterPanelInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  filterPanelLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,.35)",
    letterSpacing: 0.6,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 7,
    paddingRight: 20,
  },
  chip: {
    flexShrink: 0,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.18)",
    backgroundColor: "rgba(255,255,255,.07)",
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  chipTextActive: { color: "#fff" },

  // ── Corps ─────────────────────────────────
  body: { flex: 1, backgroundColor: "#F4F6F5" },
  bodyContent: { padding: 14, paddingBottom: 30, gap: 10 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#E8EDE8",
  },
  statText: { fontSize: 11, color: "#666" },
  statNum: { fontWeight: "700", color: colors.primary },

  activeFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FAF6",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#9FE1CB",
  },
  activeFilterText: { fontSize: 11, fontWeight: "600", color: colors.primary },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  seeAll: { fontSize: 12, color: colors.primary, fontWeight: "600" },

  // ── Carte prestataire ─────────────────────
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderWidth: 1,
    borderColor: "#EEF0EF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardLeft: { position: "relative" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 17, fontWeight: "800", color: "#fff" },
  availDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardName: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1 },
  verifiedBadge: {
    backgroundColor: "#F0FAF6",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  verifiedText: { fontSize: 10, fontWeight: "700", color: colors.primary },
  cardService: { fontSize: 12, color: "#888" },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  ratingVal: { fontSize: 11, fontWeight: "700", color: "#B45309" },
  ratingCount: { fontSize: 10, color: "#888" },
  pricePill: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  priceText: { fontSize: 10, fontWeight: "600", color: "#555" },

  // Loader
  loaderWrap: { alignItems: "center", paddingTop: 50, gap: 12 },
  loaderText: { fontSize: 13, color: "#888" },

  // État vide
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  emptySub: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

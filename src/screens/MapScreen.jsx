// src/screens/MapScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { QUARTIERS_DOUALA, SERVICES } from "../constants/services";
import { useProviders } from "../hooks/useProviders";
import { colors, spacing } from "../theme";

const DOUALA_CENTER = {
  latitude: 4.0511,
  longitude: 9.7679,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MARKER_COLORS = {
  mechanic: "#1D9E75",
  electrician: "#3C3489",
  plumber: "#185FA5",
  barber: "#BA7517",
  painter: "#993C1D",
  default: "#1D9E75",
};

const RATING_OPTIONS = [0, 3, 4, 4.5];
const RATING_LABELS = ["Tous", "3+", "4+", "4.5+"];
const PANEL_H = 260;

function getRating(provider) {
  if (typeof provider.rating === "object") return provider.rating?.global ?? 0;
  return provider.rating ?? 0;
}

export default function MapScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // ── Filtres ────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeService, setActiveService] = useState(null);
  const [activeQuartier, setActiveQuartier] = useState(null);
  const [activeRating, setActiveRating] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = [activeService, activeQuartier, activeRating > 0].filter(Boolean).length;

  const { providers } = useProviders({
    service: activeService,
    quartier: activeQuartier,
    minRating: activeRating,
    searchQuery,
  });

  const mapRef = useRef(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const panelHeight = useRef(new Animated.Value(0)).current;
  const filterRotate = useRef(new Animated.Value(0)).current;

  // ── Géolocalisation ────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      mapRef.current?.animateToRegion(
        { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 },
        800,
      );
    })();
  }, []);

  // ── Filtres ────────────────────────────────────────────
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
    setSearchQuery("");
  }, []);

  const iconRotation = filterRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  // ── Fiche prestataire ──────────────────────────────────
  const showProviderCard = (provider) => {
    setSelectedProvider(provider);
    Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
  };

  const hideProviderCard = () => {
    Animated.timing(cardAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setSelectedProvider(null));
  };

  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [260, 0] });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ══════════ HEADER ══════════ */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingText}>Explorez 🗺️</Text>
              <Text style={styles.userNameText}>Prestataires près de vous</Text>
            </View>
            <View style={styles.countBadge}>
              <Ionicons name="ellipse" size={8} color={colors.primary} />
              <Text style={styles.countText}>{providers.length}</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <View style={styles.searchIconWrap}>
                <Ionicons name="search" size={15} color="#5DCAA5" />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un service…"
                placeholderTextColor="#9FE1CB"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color="#9FE1CB" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.filterBtn, filterOpen && styles.filterBtnActive]}
              onPress={toggleFilter}
              activeOpacity={0.85}
            >
              <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
                <Ionicons name="options" size={20} color={filterOpen ? "#fff" : "#9FE1CB"} />
              </Animated.View>
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, filterOpen && styles.filterBadgeOpen]}>
                  <Text style={[styles.filterBadgeText, filterOpen && styles.filterBadgeTextOpen]}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Panneau filtres ── */}
        <Animated.View style={[styles.filterPanel, { height: panelHeight }]}>
          <ScrollView
            style={styles.filterScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.filterScrollContent}
          >
            {/* Services */}
            <Text style={styles.filterLabel}>CATÉGORIE DE SERVICE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, !activeService && styles.chipActive]}
                onPress={() => setActiveService(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, !activeService && styles.chipTextActive]}>🌟 Tous</Text>
              </TouchableOpacity>
              {SERVICES.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.chip, activeService === svc.id && styles.chipActive]}
                  onPress={() => setActiveService(svc.id === activeService ? null : svc.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, activeService === svc.id && styles.chipTextActive]}>
                    {svc.icon} {svc.label.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quartiers */}
            <Text style={[styles.filterLabel, { marginTop: 12 }]}>QUARTIER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, !activeQuartier && styles.chipActive]}
                onPress={() => setActiveQuartier(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, !activeQuartier && styles.chipTextActive]}>Tous</Text>
              </TouchableOpacity>
              {QUARTIERS_DOUALA.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.chip, activeQuartier === q && styles.chipActive]}
                  onPress={() => setActiveQuartier(q === activeQuartier ? null : q)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, activeQuartier === q && styles.chipTextActive]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Note minimale */}
            <Text style={[styles.filterLabel, { marginTop: 12 }]}>NOTE MINIMALE</Text>
            <View style={styles.ratingRow}>
              {RATING_OPTIONS.map((opt, i) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.ratingChip, activeRating === opt && styles.ratingChipActive]}
                  onPress={() => setActiveRating(opt === activeRating ? 0 : opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ratingChipText, activeRating === opt && styles.ratingChipTextActive]}>
                    {i > 0 ? "⭐ " : ""}{RATING_LABELS[i]}
                  </Text>
                </TouchableOpacity>
              ))}
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.resetChip} onPress={resetFilters} activeOpacity={0.8}>
                  <Text style={styles.resetChipText}>✕ Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* ══════════ CARTE ══════════ */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DOUALA_CENTER}
        showsUserLocation
        showsMyLocationButton
        onPress={hideProviderCard}
      >
        {providers.map((provider) => {
          if (!provider.location) return null;
          const markerColor = MARKER_COLORS[provider.services?.[0]] || MARKER_COLORS.default;
          const svc = SERVICES.find((s) => s.id === provider.services?.[0]);
          const isPremium = provider.subscription?.plan === "premium";
          return (
            <Marker
              key={provider.id}
              coordinate={{ latitude: provider.location.latitude, longitude: provider.location.longitude }}
              onPress={() => showProviderCard(provider)}
            >
              <View>
                <View style={[styles.marker, { backgroundColor: markerColor }]}>
                  {isPremium && (
                    <View style={styles.markerPremiumBadge}>
                      <Text style={styles.markerPremiumText}>★</Text>
                    </View>
                  )}
                  <Text style={styles.markerEmoji}>{svc?.icon || "👤"}</Text>
                  <Text style={styles.markerName}>{provider.displayName?.split(" ")[0]}</Text>
                </View>
                <View style={[styles.markerTail, { borderTopColor: markerColor }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ══════════ FICHE PRESTATAIRE ══════════ */}
      {selectedProvider && (
        <Animated.View style={[styles.providerCard, { transform: [{ translateY: cardTranslateY }] }]}>
          {/* Fermer */}
          <TouchableOpacity style={styles.cardClose} onPress={hideProviderCard} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={18} color="#888" />
          </TouchableOpacity>

          {/* Contenu principal */}
          <View style={styles.cardTop}>
            <View style={{ position: "relative" }}>
              <View
                style={[
                  styles.cardAvatar,
                  { backgroundColor: MARKER_COLORS[selectedProvider.services?.[0]] || colors.primary },
                ]}
              >
                <Text style={styles.cardAvatarText}>
                  {selectedProvider.displayName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
              {selectedProvider.subscription?.plan === "premium" && (
                <View style={styles.cardPremiumBadge}>
                  <Text style={styles.cardPremiumText}>★</Text>
                </View>
              )}
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.cardNameRow}>
                <Text style={styles.cardName} numberOfLines={1}>{selectedProvider.displayName}</Text>
                {selectedProvider.verificationStatus === "approved" && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardService} numberOfLines={1}>
                {SERVICES.find((s) => s.id === selectedProvider.services?.[0])?.label || "Prestataire"}
              </Text>
              <View style={styles.cardMetaRow}>
                {getRating(selectedProvider) > 0 && (
                  <Text style={styles.cardMeta}>⭐ {getRating(selectedProvider).toFixed(1)}</Text>
                )}
                {selectedProvider.quartier ? (
                  <Text style={styles.cardMeta}>📍 {selectedProvider.quartier}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.cardBtnSecondary}
              onPress={() => {
                hideProviderCard();
                navigation.navigate("ProviderProfile", { providerId: selectedProvider.id });
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.cardBtnSecondaryText}>Voir le profil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardBtnPrimary}
              onPress={() => {
                hideProviderCard();
                navigation.navigate("ProviderProfile", {
                  providerId: selectedProvider.id,
                  openRequest: true,
                });
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={14} color="#fff" />
              <Text style={styles.cardBtnPrimaryText}>Solliciter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  userNameText: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  countText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBar: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: 13,
    paddingVertical: 10,
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
  searchInput: { flex: 1, fontSize: 13, color: "#fff" },
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
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
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

  filterPanel: {
    backgroundColor: colors.background,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.06)",
    elevation: 8,
  },
  filterScroll: { flex: 1 },
  filterScrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  filterLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,.35)", letterSpacing: 0.6, marginBottom: 8 },

  chipsRow: { flexDirection: "row", gap: 7, paddingRight: 20 },
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
  chipText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,.7)" },
  chipTextActive: { color: "#fff" },

  ratingRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  ratingChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.18)",
    backgroundColor: "rgba(255,255,255,.07)",
  },
  ratingChipActive: { backgroundColor: "#F59E0B", borderColor: "#F59E0B" },
  ratingChipText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,.7)" },
  ratingChipTextActive: { color: "#fff" },
  resetChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,.4)",
    backgroundColor: "rgba(255,100,100,.1)",
  },
  resetChipText: { fontSize: 12, fontWeight: "600", color: "#FF9999" },

  map: { flex: 1 },

  marker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    position: "relative",
  },
  markerEmoji: { fontSize: 13 },
  markerName: { fontSize: 10, fontWeight: "700", color: "#fff" },
  markerTail: {
    width: 0,
    height: 0,
    alignSelf: "center",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  markerPremiumBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 1,
  },
  markerPremiumText: { fontSize: 7, color: "#fff", fontWeight: "800" },

  // ── Fiche prestataire ──────────────────────────────────
  providerCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
    paddingBottom: 28,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  cardClose: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14, paddingRight: 36 },
  cardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: { fontSize: 20, fontWeight: "700", color: "#fff" },
  cardPremiumBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cardPremiumText: { fontSize: 9, color: "#fff", fontWeight: "800" },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 16, fontWeight: "700", color: colors.textDark, flex: 1 },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: { fontSize: 10, color: "#fff", fontWeight: "800" },
  cardService: { fontSize: 13, color: "#555", fontWeight: "500" },
  cardMetaRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#888" },

  cardActions: { flexDirection: "row", gap: 10 },
  cardBtnSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBtnSecondaryText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  cardBtnPrimary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardBtnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

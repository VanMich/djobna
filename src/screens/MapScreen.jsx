// src/screens/MapScreen.js
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
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SERVICES } from "../constants/services";
import { useProviders } from "../hooks/useProviders";
import { colors, spacing } from "../theme";

const DOUALA_CENTER = {
  latitude: 4.0511,
  longitude: 9.7679,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const { providers } = useProviders(activeFilter);
  const mapRef = useRef(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const panelHeight = useRef(new Animated.Value(0)).current;
  const filterRotate = useRef(new Animated.Value(0)).current;

  const PANEL_H = 90;

  // ── Géolocalisation ───────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        800,
      );
    })();
  }, []);

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
      // Fermeture → timing (sans rebond)
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
    }
  }, [filterOpen, panelHeight, filterRotate]);

  // ── Sélection filtre ──────────────────────
  const handleSelectFilter = useCallback(
    (serviceId) => {
      setActiveFilter(serviceId);

      // Fermeture → timing (sans rebond)
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

  // Interpolation rotation icône
  const iconRotation = filterRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  // ── Fiche prestataire ─────────────────────
  const showProviderCard = (provider) => {
    setSelectedProvider(provider);
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const hideProviderCard = () => {
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedProvider(null));
  };

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  // ── Couleurs markers ──────────────────────
  const markerColors = {
    mechanic: "#1D9E75",
    electrician: "#3C3489",
    plumber: "#185FA5",
    barber: "#BA7517",
    painter: "#993C1D",
    default: "#1D9E75",
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ════════════════════════════════════ */}
      {/* HEADER FIXE                         */}
      {/* ════════════════════════════════════ */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          {/* Ligne 1 : Titre + Badge compteur */}
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
                Rechercher un service…
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
              {activeFilter && (
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
                style={[styles.chip, !activeFilter && styles.chipActive]}
                onPress={() => handleSelectFilter(null)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    !activeFilter && styles.chipTextActive,
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
                    activeFilter === service.id && styles.chipActive,
                  ]}
                  onPress={() => handleSelectFilter(service.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      activeFilter === service.id && styles.chipTextActive,
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
      {/* CARTE                               */}
      {/* ════════════════════════════════════ */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DOUALA_CENTER}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={hideProviderCard}
      >
        {providers.map((provider) => {
          if (!provider.location) return null;
          const markerColor =
            markerColors[provider.services?.[0]] || markerColors.default;
          const svc = SERVICES.find((s) => s.id === provider.services?.[0]);

          return (
            <Marker
              key={provider.id}
              coordinate={{
                latitude: provider.location.latitude,
                longitude: provider.location.longitude,
              }}
              onPress={() => showProviderCard(provider)}
            >
              <View style={[styles.marker, { backgroundColor: markerColor }]}>
                <Text style={styles.markerEmoji}>{svc?.icon || "👤"}</Text>
                <Text style={styles.markerName}>
                  {provider.displayName?.split(" ")[0]}
                </Text>
              </View>
              <View
                style={[styles.markerTail, { borderTopColor: markerColor }]}
              />
            </Marker>
          );
        })}
      </MapView>

      {/* ════════════════════════════════════ */}
      {/* FICHE PRESTATAIRE ANIMÉE            */}
      {/* ════════════════════════════════════ */}
      {selectedProvider && (
        <Animated.View
          style={[
            styles.providerCard,
            { transform: [{ translateY: cardTranslateY }] },
          ]}
        >
          <View
            style={[
              styles.cardAvatar,
              {
                backgroundColor:
                  markerColors[selectedProvider.services?.[0]] ||
                  colors.primary,
              },
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

          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{selectedProvider.displayName}</Text>
            <Text style={styles.cardMeta}>
              {
                SERVICES.find((s) => s.id === selectedProvider.services?.[0])
                  ?.label
              }
              {selectedProvider.rating > 0 &&
                ` · ⭐ ${selectedProvider.rating.toFixed(1)}`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => {
              hideProviderCard();
              navigation.navigate("ProviderProfile", {
                providerId: selectedProvider.id,
              });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.cardBtnText}>Voir profil</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

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

  // Badge compteur
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

  // ── Panneau filtres animé ─────────────────
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

  // ── Carte ─────────────────────────────────
  map: { flex: 1 },

  // ── Markers ───────────────────────────────
  marker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
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

  // ── Fiche prestataire ─────────────────────
  providerCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  cardMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  cardBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});

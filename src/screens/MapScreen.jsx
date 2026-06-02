// src/screens/MapScreen.jsx
// ──────────────────────────────────────────────────────────────────
// MapScreen DS v2 — Style Yango/Airbnb
// Full-screen map, floating search + chips, recenter FAB,
// 2 bottom card states: standard (voir profil/solliciter)
//                       et mission en cours (suivi + chat/appel)
// ──────────────────────────────────────────────────────────────────

import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SERVICES } from "../constants/services";
import { useProviders } from "../hooks/useProviders";
import { supabase } from "../config/supabase";
import Icon from "../components/ui/Icon";
import SearchModal from "../components/search/SearchModal";
import { MissionProgress } from "../components/tracking/MissionTimeline";
import { colors, fonts, radius, shadows, spacing } from "../theme";

// ── Constants ───────────────────────────────────────────────────────
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
  carpenter: "#7D4F2A",
  tailor: "#C44D8A",
  housekeeper: "#0F6E56",
  caterer: "#6B3FA0",
  default: "#1D9E75",
};

function getRating(provider) {
  if (typeof provider.rating === "object") return provider.rating?.global ?? 0;
  return provider.rating ?? 0;
}

// ── Hook: active missions for current user ────────────────────────
function useActiveMissions() {
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    let active = true;

    async function fetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("requests")
        .select("id, provider_id, service, title, status, devis_accepted, scheduled_date, providers:provider_id(display_name, photo_url)")
        .eq("client_id", session.user.id)
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false });

      if (active && data) {
        setMissions(data.map((r) => ({
          id: r.id,
          providerId: r.provider_id,
          providerName: r.providers?.display_name || "Pro",
          service: r.service,
          title: r.title,
          status: r.status,
          devisAccepted: r.devis_accepted ?? false,
        })));
      }
    }

    fetch();

    // Realtime subscription
    let channel;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id || !active) return;
      channel = supabase
        .channel("map-missions")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `client_id=eq.${session.user.id}`,
        }, fetch)
        .subscribe();
    });

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return missions;
}

// ─────────────────────────────────────────────────────────────────────
export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showMissionCard, setShowMissionCard] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  // ── Filtres ────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeService, setActiveService] = useState(null);
  const [activeQuartier, setActiveQuartier] = useState(null);
  const [activeRating, setActiveRating] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const { providers } = useProviders({
    service: activeService,
    quartier: activeQuartier,
    minRating: activeRating,
    searchQuery,
  });

  // Active missions
  const activeMissions = useActiveMissions();
  const missionProviderIds = useMemo(
    () => new Set(activeMissions.map((m) => m.providerId)),
    [activeMissions],
  );

  const mapRef = useRef(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const missionCardAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Pulsing animation for mission markers ─────────────
  useEffect(() => {
    if (missionProviderIds.size === 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [missionProviderIds.size, pulseAnim]);

  // ── Geolocation ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        800,
      );
    })();
  }, []);

  // ── Recenter ───────────────────────────────────────────
  const recenter = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateToRegion(
      {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600,
    );
  }, []);

  // ── Provider card (standard) ───────────────────────────
  const showProviderCard = useCallback((provider) => {
    // Check if this provider has an active mission
    const mission = activeMissions.find((m) => m.providerId === provider.id);
    if (mission) {
      setSelectedMission({ ...mission, provider });
      setShowMissionCard(true);
      setSelectedProvider(null);
      Animated.spring(missionCardAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
    } else {
      setSelectedProvider(provider);
      setShowMissionCard(false);
      setSelectedMission(null);
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
    }
  }, [activeMissions, cardAnim, missionCardAnim]);

  const hideProviderCard = useCallback(() => {
    Animated.timing(cardAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setSelectedProvider(null));
  }, [cardAnim]);

  const hideMissionCard = useCallback(() => {
    Animated.timing(missionCardAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => { setShowMissionCard(false); setSelectedMission(null); });
  }, [missionCardAnim]);

  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [280, 0] });
  const missionTranslateY = missionCardAnim.interpolate({ inputRange: [0, 1], outputRange: [360, 0] });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent />

      {/* ══════════ FULL-SCREEN MAP ══════════ */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={DOUALA_CENTER}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => {
          if (selectedProvider) hideProviderCard();
          if (showMissionCard) hideMissionCard();
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />
        {providers.map((provider) => {
          if (!provider.location?.latitude || !provider.location?.longitude) return null;
          const markerColor = MARKER_COLORS[provider.services?.[0]] || MARKER_COLORS.default;
          const svc = SERVICES.find((s) => s.id === provider.services?.[0]);
          const isPremium = provider.subscription?.plan === "premium";
          const hasMission = missionProviderIds.has(provider.id);
          // Fade other markers when viewing a mission
          const isFaded = showMissionCard && !hasMission;

          return (
            <Marker
              key={provider.id}
              coordinate={{
                latitude: provider.location.latitude,
                longitude: provider.location.longitude,
              }}
              onPress={() => showProviderCard(provider)}
              tracksViewChanges={false}
            >
              <Animated.View
                style={[
                  { opacity: isFaded ? 0.4 : 1 },
                  hasMission ? { transform: [{ scale: pulseAnim }] } : undefined,
                ]}
              >
                <View style={[styles.marker, { backgroundColor: markerColor }]}>
                  {isPremium && (
                    <View style={styles.markerPremiumBadge}>
                      <Icon name="crown" size={8} color={colors.textInverse} weight="fill" />
                    </View>
                  )}
                  {hasMission && (
                    <View style={styles.markerMissionBadge}>
                      <Icon name="timer" size={9} color={colors.textInverse} weight="fill" />
                    </View>
                  )}
                  <Icon name={svc?.icon || "wrench"} size={16} color={colors.textInverse} weight="fill" />
                  <Text style={styles.markerName}>{provider.displayName?.split(" ")[0]}</Text>
                </View>
                <View style={[styles.markerTail, { borderTopColor: markerColor }]} />
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>

      {/* ══════════ FLOATING SEARCH + CHIPS ══════════ */}
      <View style={[styles.floatingSearch, { top: insets.top + 12 }]}>
        {/* Search card (faux bouton → ouvre la modale) */}
        <TouchableOpacity style={styles.searchCard} onPress={() => setSearchOpen(true)} activeOpacity={0.8}>
          <Icon name="search" size={18} color={colors.ink300} />
          <Text style={styles.searchPlaceholder}>
            {searchQuery || "Rechercher un pro..."}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={16} color={colors.ink300} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Full-width chips — services */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity
            style={[styles.chip, !activeService && styles.chipActive]}
            onPress={() => setActiveService(null)}
            activeOpacity={0.8}
          >
            <Icon name="sparkle" size={14} color={!activeService ? colors.textInverse : colors.ink500} weight="fill" />
            <Text style={[styles.chipText, !activeService && styles.chipTextActive]}>Tous</Text>
          </TouchableOpacity>
          {SERVICES.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={[styles.chip, activeService === svc.id && styles.chipActive]}
              onPress={() => setActiveService(svc.id === activeService ? null : svc.id)}
              activeOpacity={0.8}
            >
              <Icon
                name={svc.icon}
                size={14}
                color={activeService === svc.id ? colors.textInverse : colors.ink500}
                weight="duotone"
              />
              <Text style={[styles.chipText, activeService === svc.id && styles.chipTextActive]}>
                {svc.label.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </View>

      {/* ══════════ RECENTER BTN ══════════ */}
      <TouchableOpacity
        style={[styles.recenterBtn, { bottom: (selectedProvider || showMissionCard) ? 230 : 36 }]}
        onPress={recenter}
        activeOpacity={0.85}
      >
        <Icon name="crosshair" size={20} color={colors.ink700} />
      </TouchableOpacity>

      {/* ══════════ Provider count badge ══════════ */}
      <View style={[styles.countBadge, { bottom: (selectedProvider || showMissionCard) ? 230 : 36 }]}>
        <View style={styles.countDot} />
        <Text style={styles.countText}>{providers.length} pros</Text>
      </View>

      {/* ══════════ BOTTOM CARD — STANDARD (no mission) ══════════ */}
      {selectedProvider && (
        <Animated.View style={[styles.bottomCard, { transform: [{ translateY: cardTranslateY }] }]}>
          <View style={styles.cardHandle} />

          <View style={styles.cardHeader}>
            <View style={styles.providerRow}>
              {/* Avatar */}
              <View
                style={[
                  styles.providerAvatar,
                  { backgroundColor: MARKER_COLORS[selectedProvider.services?.[0]] || colors.primary },
                ]}
              >
                <Text style={styles.providerAvatarText}>
                  {selectedProvider.displayName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
                {selectedProvider.subscription?.plan === "premium" && (
                  <View style={styles.avatarPremiumBadge}>
                    <Icon name="crown" size={9} color={colors.textInverse} weight="fill" />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.providerInfo}>
                <View style={styles.providerNameRow}>
                  <Text style={styles.providerName} numberOfLines={1}>{selectedProvider.displayName}</Text>
                  {selectedProvider.verificationStatus === "approved" && (
                    <View style={styles.verifiedBadge}>
                      <Icon name="check" size={10} color={colors.primary} />
                    </View>
                  )}
                </View>
                <Text style={styles.providerService} numberOfLines={1}>
                  {SERVICES.find((s) => s.id === selectedProvider.services?.[0])?.label || "Pro"}
                  {selectedProvider.quartier ? `  ·  ${selectedProvider.quartier}` : ""}
                </Text>
                <View style={styles.providerMeta}>
                  {getRating(selectedProvider) > 0 && (
                    <View style={styles.metaItem}>
                      <Icon name="star" size={12} color={colors.mango} weight="fill" />
                      <Text style={styles.metaText}>
                        {getRating(selectedProvider).toFixed(1)}
                        {selectedProvider.reviewCount > 0 ? ` (${selectedProvider.reviewCount})` : ""}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Close */}
            <TouchableOpacity style={styles.cardClose} onPress={hideProviderCard} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name="x" size={14} color={colors.ink500} />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => {
                hideProviderCard();
                navigation.navigate("ProviderProfile", { providerId: selectedProvider.id });
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>Voir le profil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => {
                hideProviderCard();
                navigation.navigate("ProviderProfile", {
                  providerId: selectedProvider.id,
                  openRequest: true,
                });
              }}
              activeOpacity={0.85}
            >
              <Icon name="lightning" size={15} color={colors.textInverse} weight="fill" />
              <Text style={styles.btnPrimaryText}>Solliciter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ══════════ BOTTOM CARD — MISSION IN PROGRESS ══════════ */}
      {showMissionCard && selectedMission && (
        <Animated.View style={[styles.missionCard, { transform: [{ translateY: missionTranslateY }] }]}>
          <View style={styles.cardHandle} />

          {/* Provider info row */}
          <View style={styles.missionProviderRow}>
            <View
              style={[
                styles.missionAvatar,
                { backgroundColor: MARKER_COLORS[selectedMission.service] || colors.primary },
              ]}
            >
              <Text style={styles.missionAvatarText}>
                {selectedMission.providerName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.missionInfo}>
              <Text style={styles.missionName} numberOfLines={1}>{selectedMission.providerName}</Text>
              <Text style={styles.missionServiceLabel} numberOfLines={1}>
                {SERVICES.find((s) => s.id === selectedMission.service)?.label || "Pro"}
                {selectedMission.provider?.quartier ? `  ·  ${selectedMission.provider.quartier}` : ""}
                {getRating(selectedMission.provider || {}) > 0 ? `  ·  ${getRating(selectedMission.provider).toFixed(1)}` : ""}
              </Text>
            </View>
            <TouchableOpacity style={styles.cardClose} onPress={hideMissionCard} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name="x" size={14} color={colors.ink500} />
            </TouchableOpacity>
          </View>

          {/* Vraie progression de la mission (pas de GPS) */}
          <MissionProgress status={selectedMission.status} devisAccepted={selectedMission.devisAccepted} />

          {/* Actions: Suivre + Message */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => {
                hideMissionCard();
                navigation.navigate("Tracking", { requestId: selectedMission.id, providerName: selectedMission.providerName });
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>Suivre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => {
                hideMissionCard();
                navigation.navigate("Chat", { requestId: selectedMission.id });
              }}
              activeOpacity={0.85}
            >
              <Icon name="chat-circle" size={15} color={colors.textInverse} weight="fill" />
              <Text style={styles.btnPrimaryText}>Message</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ══════════ SEARCH MODAL ══════════ */}
      <SearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProvider={(provider) => {
          setSearchOpen(false);
          // Center map on provider + show card
          if (provider.location?.latitude) {
            mapRef.current?.animateToRegion({
              latitude: provider.location.latitude,
              longitude: provider.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 600);
          }
          navigation.navigate("ProviderProfile", { providerId: provider.id });
        }}
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

// ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // ── Floating Search ────────────────────────────────────
  floatingSearch: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
    gap: 10,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: spacing.md,
    shadowColor: "#0D1F1A",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.ink300,
  },

  // ── Chips ─────────────────────────────────────────────
  chipsScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#0D1F1A",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.ink700 },
  chipTextActive: { color: colors.textInverse },

  // ── Map Markers ────────────────────────────────────────
  marker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    ...shadows.md,
    position: "relative",
  },
  markerName: { fontSize: 11, fontFamily: fonts.bold, color: colors.textInverse },
  markerTail: {
    width: 0,
    height: 0,
    alignSelf: "center",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  markerPremiumBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.mango,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.card,
    zIndex: 1,
  },
  markerMissionBadge: {
    position: "absolute",
    top: -5,
    left: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.card,
    zIndex: 1,
  },

  // ── Recenter + Count ───────────────────────────────────
  recenterBtn: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.ink100,
    shadowColor: "#0D1F1A",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    zIndex: 30,
  },
  countBadge: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.ink100,
    shadowColor: "#0D1F1A",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    zIndex: 30,
  },
  countDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  countText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink700 },

  // ── Bottom Card — Standard ─────────────────────────────
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.s5,
    paddingTop: 14,
    paddingBottom: 34,
    gap: 14,
    ...shadows.lg,
    zIndex: 50,
  },
  cardHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink100,
    alignSelf: "center",
    marginBottom: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  providerAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  providerAvatarText: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.textInverse },
  avatarPremiumBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.mango,
    borderWidth: 2.5,
    borderColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  providerInfo: { flex: 1, gap: 2 },
  providerNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  providerName: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink900, flex: 1 },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  providerService: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500 },
  providerMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.ink500 },

  // ── Actions ────────────────────────────────────────────
  actionsRow: { flexDirection: "row", gap: 10 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary },
  btnPrimary: {
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
  btnPrimaryText: { fontSize: 13, fontFamily: fonts.bold, color: colors.textInverse },

  // ── Bottom Card — Mission ──────────────────────────────
  missionCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.s5,
    paddingTop: 14,
    paddingBottom: 34,
    gap: 12,
    ...shadows.lg,
    zIndex: 50,
  },
  // ── Mission Provider Row ───────────────────────────────
  missionProviderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  missionAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  missionAvatarText: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.textInverse },
  missionInfo: { flex: 1 },
  missionName: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink900 },
  missionServiceLabel: { fontSize: 11, fontFamily: fonts.medium, color: colors.ink500 },
});

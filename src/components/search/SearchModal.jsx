// src/components/search/SearchModal.jsx
// Modale de recherche full-screen (bottom sheet) — utilisée par HomeScreen et MapScreen.
// Affiche : champ avec focus auto, recherches récentes,
//           grille services populaires, résultats live, suggestion quartiers.

import React, { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVICES, PRICE_RANGES, QUARTIERS_DOUALA } from "../../constants/services";
import { useProviders } from "../../hooks/useProviders";
import { normalizeText } from "../../utils/text";
import { Avatar, StatusDot } from "../ui";
import Icon from "../ui/Icon";
import { colors, fonts, radius, shadows, spacing } from "../../theme";

const { height: SCREEN_H } = Dimensions.get("window");
const STORAGE_KEY = "djobna_recent_searches";
const MAX_RECENT = 5;

// ─── Couleurs d'icônes par service ──────────────────────────────
const SERVICE_COLORS = {
  plumber:     { bg: "#E4F4ED", fg: "#1D9E75" },
  electrician: { bg: "#FFE7CC", fg: "#8A4A18" },
  painter:     { bg: "#E3EEFD", fg: "#3B82F6" },
  barber:      { bg: "#F5EEFE", fg: "#6B3FA0" },
  carpenter:   { bg: "#F5EDE4", fg: "#7D4F2A" },
  aircon:      { bg: "#E8F4FF", fg: "#0284C7" },
  tailor:      { bg: "#FCE4F0", fg: "#C44D8A" },
  housekeeper: { bg: "#E4F4ED", fg: "#1D9E75" },
  mechanic:    { bg: "#E4F4ED", fg: "#0F6E56" },
  caterer:     { bg: "#F5EEFE", fg: "#6B3FA0" },
  locksmith:   { bg: "#FFE7CC", fg: "#F2A65A" },
  mover:       { bg: "#E3EEFD", fg: "#3B82F6" },
  security:    { bg: "#E4F4ED", fg: "#0F6E56" },
  gardener:    { bg: "#E4F4ED", fg: "#1D9E75" },
  welder:      { bg: "#FCE4E4", fg: "#E54848" },
  tiler:       { bg: "#E8F4FF", fg: "#0284C7" },
};

const POPULAR_SERVICES = ["plumber", "electrician", "painter", "barber", "carpenter", "aircon", "tailor", "housekeeper"];

// ─── Utilitaires ────────────────────────────────────────────────
function getRating(provider) {
  if (typeof provider.rating === "object") return provider.rating?.global ?? 0;
  return provider.rating ?? 0;
}

function getInitials(name) {
  return (name || "XX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════
export default function SearchModal({ visible, onClose, onSelectProvider, onSelectService, onSelectQuartier }) {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  // Découplage frappe / rendu lourd : le TextInput reste piloté par `query`
  // (instantané, le clavier ne saute pas), mais tout le bloc résultats consomme
  // une valeur DIFFÉRÉE. React 19 commit d'abord la frappe (urgent, champ seul),
  // puis recalcule les résultats dans un rendu concurrent non bloquant.
  // → plus de gros swap de sous-arbre pendant la frappe = plus de blur du clavier.
  const deferredQuery = useDeferredValue(query);

  // Requête normalisée (sans accents, minuscule, trimmée) — base de tous les matchs.
  const nq = normalizeText(deferredQuery);
  const hasQuery = nq.length >= 2;

  // ── Résultats live ──
  const { providers, loading } = useProviders({ searchQuery: deferredQuery });
  // [] tant qu'il n'y a pas de requête : le bloc résultats reste monté mais vide
  // (pas d'avatars chargés pour rien) — voir le toggle display:none plus bas.
  const filteredProviders = hasQuery ? providers.slice(0, 4) : [];

  // ── Services correspondants (label FR + synonymes, accents ignorés) ──
  // .filter (et non .find) : on peut proposer plusieurs métiers pertinents.
  const matchingServices = hasQuery
    ? SERVICES.filter((s) =>
        normalizeText([s.label, ...(s.keywords || [])].join(" ")).includes(nq),
      ).slice(0, 3)
    : [];
  const matchingService = matchingServices[0] || null; // utilisé par "Voir tous les résultats"

  // ── Quartiers correspondants (accents ignorés) ──
  const matchingQuartiers = hasQuery
    ? QUARTIERS_DOUALA.filter((q) => normalizeText(q).includes(nq)).slice(0, 3)
    : [];

  // ── Load recent searches ──
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setRecentSearches(JSON.parse(stored));
      } catch {}
    })();
  }, [visible]);

  // ── Save search ──
  const saveSearch = useCallback(async (term, sub) => {
    try {
      const entry = { term, sub, ts: Date.now() };
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let list = stored ? JSON.parse(stored) : [];
      list = [entry, ...list.filter((r) => r.term !== term)].slice(0, MAX_RECENT);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setRecentSearches(list);
    } catch {}
  }, []);

  // ── Animate in/out ──
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SCREEN_H);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        inputRef.current?.focus();
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ── Handlers ──
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setQuery("");
    onClose();
  }, [onClose]);

  const handleSelectProvider = useCallback(
    (provider) => {
      saveSearch(provider.displayName, SERVICES.find((s) => s.id === provider.services?.[0])?.label || "Pro");
      handleClose();
      onSelectProvider?.(provider);
    },
    [onSelectProvider, handleClose, saveSearch],
  );

  const handleSelectService = useCallback(
    (serviceId) => {
      const svc = SERVICES.find((s) => s.id === serviceId);
      if (svc) saveSearch(svc.label, "Service");
      handleClose();
      onSelectService?.(serviceId);
    },
    [onSelectService, handleClose, saveSearch],
  );

  const handleSelectQuartier = useCallback(
    (quartier) => {
      saveSearch(quartier, "Quartier");
      handleClose();
      onSelectQuartier?.(quartier);
    },
    [onSelectQuartier, handleClose, saveSearch],
  );

  const handleRecentTap = useCallback(
    (recent) => {
      setQuery(recent.term);
    },
    [],
  );

  // ── Touche "Rechercher" du clavier ──
  // Valide le résultat le plus pertinent : service correspondant en priorité,
  // sinon le premier pro, sinon on ferme juste le clavier.
  const handleSubmit = useCallback(() => {
    if (matchingServices[0]) handleSelectService(matchingServices[0].id);
    else if (filteredProviders[0]) handleSelectProvider(filteredProviders[0]);
    else Keyboard.dismiss();
  }, [matchingServices, filteredProviders, handleSelectService, handleSelectProvider]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Scrim */}
      <TouchableOpacity style={s.scrim} activeOpacity={1} onPress={handleClose} />

      {/* Modal sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Header : close + search field */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={handleClose} activeOpacity={0.8}>
            <Icon name="x" size={18} color={colors.ink700} />
          </TouchableOpacity>

          <View style={[s.searchField, hasQuery && s.searchFieldActive]}>
            <Icon name="search" size={18} color={hasQuery ? colors.primary : colors.ink300} />
            <TextInput
              ref={inputRef}
              style={s.searchInput}
              placeholder="Quel service ou pro cherches-tu ?"
              placeholderTextColor={colors.ink300}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              onSubmitEditing={handleSubmit}
            />
            {query.length > 0 && (
              <TouchableOpacity
                style={s.clearBtn}
                onPress={() => setQuery("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={12} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Body */}
        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══ ÉTAT VIDE (pas de query) ═══
              Toujours monté, masqué via display:none quand on tape.
              IMPORTANT : ne PAS démonter ce bloc — sur Android, démonter un
              gros sous-arbre voisin pendant que le champ est focus coupe la
              connexion clavier (IME) et le clavier se referme. */}
          <View style={[s.stateWrap, hasQuery && s.hidden]}>
            {/* Recent searches */}
              {recentSearches.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Recherches récentes</Text>
                  {recentSearches.map((r, i) => (
                    <TouchableOpacity key={i} style={s.recentItem} onPress={() => handleRecentTap(r)} activeOpacity={0.7}>
                      <View style={s.recentIcon}>
                        <Icon name="clock" size={18} color={colors.ink500} />
                      </View>
                      <View style={s.recentInfo}>
                        <Text style={s.recentTitle}>{r.term}</Text>
                        {r.sub ? <Text style={s.recentSub}>{r.sub}</Text> : null}
                      </View>
                      <Icon name="arrow-up-left" size={16} color={colors.ink300} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Popular services grid */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>Services populaires</Text>
                <View style={s.servicesGrid}>
                  {POPULAR_SERVICES.map((id) => {
                    const svc = SERVICES.find((sv) => sv.id === id);
                    const col = SERVICE_COLORS[id] || SERVICE_COLORS.plumber;
                    if (!svc) return null;
                    return (
                      <TouchableOpacity
                        key={id}
                        style={s.serviceItem}
                        onPress={() => handleSelectService(id)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.serviceIcon, { backgroundColor: col.bg }]}>
                          <Icon name={svc.icon} size={22} color={col.fg} />
                        </View>
                        <Text style={s.serviceName} numberOfLines={1}>{svc.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Nearby quartiers */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>Quartiers proches</Text>
                {QUARTIERS_DOUALA.slice(0, 3).map((q) => (
                  <TouchableOpacity key={q} style={s.quartierItem} onPress={() => handleSelectQuartier(q)} activeOpacity={0.7}>
                    <View style={s.quartierIcon}>
                      <Icon name="map-pin" size={16} color={colors.primary} />
                    </View>
                    <View style={s.quartierInfo}>
                      <Text style={s.quartierName}>{q}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
          </View>

          {/* ═══ ÉTAT AVEC RÉSULTATS ═══
              Également toujours monté, masqué tant qu'il n'y a pas de requête. */}
          <View style={[s.stateWrap, !hasQuery && s.hidden]}>
              {/* Matching services (peut en proposer plusieurs) */}
              {matchingServices.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>{matchingServices.length > 1 ? "Services" : "Service"}</Text>
                  {matchingServices.map((svc) => {
                    const col = SERVICE_COLORS[svc.id] || SERVICE_COLORS.plumber;
                    return (
                      <TouchableOpacity
                        key={svc.id}
                        style={s.serviceSuggestion}
                        onPress={() => handleSelectService(svc.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.serviceSugIcon, { backgroundColor: col.bg }]}>
                          <Icon name={svc.icon} size={20} color={col.fg} />
                        </View>
                        <View style={s.serviceSugInfo}>
                          <Text style={s.serviceSugName}>{svc.label}</Text>
                          <Text style={s.serviceSugMeta}>
                            {PRICE_RANGES[svc.id] || PRICE_RANGES.default}
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={16} color={colors.ink300} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Provider results */}
              {filteredProviders.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Pros disponibles</Text>
                  {filteredProviders.map((p) => {
                    const rat = getRating(p);
                    const svc = SERVICES.find((sv) => sv.id === p.services?.[0]);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={s.resultItem}
                        onPress={() => handleSelectProvider(p)}
                        activeOpacity={0.7}
                      >
                        <Avatar name={p.displayName} photoURL={p.photoURL} size={44} service={p.services?.[0]} />
                        <View style={s.resultInfo}>
                          <Text style={s.resultName} numberOfLines={1}>{p.displayName}</Text>
                          <View style={s.resultMeta}>
                            <Text style={s.resultService}>{svc?.label || "Pro"}</Text>
                            {rat > 0 && (
                              <>
                                <Text style={s.resultDot}>·</Text>
                                <View style={s.resultRating}>
                                  <Icon name="star" size={11} color={colors.star || colors.mango} />
                                  <Text style={s.resultRatingText}>{rat.toFixed(1)}</Text>
                                </View>
                              </>
                            )}
                            {p.quartier ? (
                              <>
                                <Text style={s.resultDot}>·</Text>
                                <Text style={s.resultService}>{p.quartier}</Text>
                              </>
                            ) : null}
                          </View>
                        </View>
                        {p.availability && (
                          <View style={s.onlineBadge}>
                            <Text style={s.onlineBadgeText}>En ligne</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Matching quartiers */}
              {matchingQuartiers.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Chercher dans un quartier</Text>
                  {matchingQuartiers.map((q) => (
                    <TouchableOpacity key={q} style={s.quartierItem} onPress={() => handleSelectQuartier(q)} activeOpacity={0.7}>
                      <View style={s.quartierIcon}>
                        <Icon name="map-pin" size={16} color={colors.primary} />
                      </View>
                      <View style={s.quartierInfo}>
                        <Text style={s.quartierName}>
                          {matchingService ? `${matchingService.label} à ${q}` : q}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* See all CTA */}
              {filteredProviders.length > 0 && (
                <TouchableOpacity
                  style={s.seeAllBtn}
                  onPress={() => {
                    if (matchingService) handleSelectService(matchingService.id);
                    else handleClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="search" size={16} color={colors.primaryDark} />
                  <Text style={s.seeAllText}>
                    Voir tous les résultats
                  </Text>
                </TouchableOpacity>
              )}

              {/* Chargement : on n'affiche PAS "Aucun résultat" tant que les pros
                  ne sont pas chargés (évite le faux négatif au 1er fetch). */}
              {hasQuery && loading && filteredProviders.length === 0 && (
                <View style={s.loadingState}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}

              {/* Aucun résultat — seulement une fois le chargement terminé */}
              {hasQuery && !loading && matchingServices.length === 0 && filteredProviders.length === 0 && matchingQuartiers.length === 0 && (
                <View style={s.emptyState}>
                  <View style={s.emptyIcon}>
                    <Icon name="search" size={28} color={colors.ink300} />
                  </View>
                  <Text style={s.emptyTitle}>Aucun résultat</Text>
                  <Text style={s.emptySub}>Essaie un autre terme ou parcours les services populaires.</Text>
                </View>
              )}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink200 || colors.ink300,
    alignSelf: "center",
    marginTop: 10,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.ink50,
    borderWidth: 1,
    borderColor: colors.ink100,
    alignItems: "center",
    justifyContent: "center",
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.ink50,
    borderWidth: 1.5,
    borderColor: colors.ink100,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchFieldActive: {
    // Surlignage de bordure uniquement. Pas d'elevation/ombre dynamique ici :
    // modifier l'elevation du conteneur d'un TextInput focus peut perturber
    // sa couche native sur Android (et donc le clavier).
    borderColor: colors.primary,
    backgroundColor: colors.ink50,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.ink900,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink300,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Body ──
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40, gap: 24 },
  // Conteneurs d'état (vide / résultats) : toujours montés, espacement interne 24.
  stateWrap: { gap: 24 },
  // display:none retire du layout sans démonter → l'IME Android n'est pas coupé.
  hidden: { display: "none" },

  // ── Sections ──
  section: { gap: 0 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink500,
    textTransform: "uppercase",
    letterSpacing: 0.08 * 11,
    marginBottom: 10,
  },

  // ── Recent searches ──
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink50,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: { flex: 1, gap: 2 },
  recentTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink900 },
  recentSub: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500 },

  // ── Services grid ──
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  serviceItem: {
    width: "25%",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.ink700,
    textAlign: "center",
  },

  // ── Quartiers ──
  quartierItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink50,
  },
  quartierIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  quartierInfo: { flex: 1 },
  quartierName: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink900 },

  // ── Service suggestion row ──
  serviceSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  serviceSugIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceSugInfo: { flex: 1, gap: 2 },
  serviceSugName: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink900 },
  serviceSugMeta: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500 },

  // ── Provider result ──
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink50,
  },
  resultInfo: { flex: 1, gap: 3 },
  resultName: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink900 },
  resultMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultService: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500 },
  resultDot: { fontSize: 12, color: colors.ink300 },
  resultRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  resultRatingText: { fontSize: 12, fontFamily: fonts.bold, color: colors.mango },
  onlineBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  onlineBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // ── See all CTA ──
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  // ── Loading ──
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  // ── Empty ──
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink700 },
  emptySub: { fontSize: 12, fontFamily: fonts.medium, color: colors.ink500, textAlign: "center", lineHeight: 18 },
});

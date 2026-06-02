// src/screens/ProviderProfileOwnScreen.jsx
//
// Profil propre du prestataire (§14).
// Sections : services, réalisations, compte, notifications, aide.
// Le badge KYC (§14.4) s'affiche tant que le compte n'est pas vérifié.

import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import EditProfileSheet from "../components/providerOwnProfile/EditProfileSheet";
import PortfolioSection from "../components/providerOwnProfile/PortfolioSection";
import ProviderOwnHeader from "../components/providerOwnProfile/ProviderOwnHeader";
import MenuItem from "../components/clientProfile/MenuItem";
import MenuSection from "../components/clientProfile/MenuSection";
import Icon from "../components/ui/Icon";
import { SERVICES } from "../constants/services";
import { useProviderOwnProfile } from "../hooks/useProviderOwnProfile";
import { useRoleSwitch } from "../hooks/useRoleSwitch";
import { SkeletonProfileOwn } from "../components/ui";
import { colors, spacing, fonts } from "../theme";

// ─── Badge de statut de vérification KYC (§14.4) ─────────────────────────────
// Affiché en haut du contenu scrollable tant que le compte n'est pas "verified".
// 3 états : non soumis (null/undefined) / en cours (pending) / refusé (rejected).
function KycBanner({ status }) {
  if (status === "approved") return null;

  const config = {
    pending: {
      icon: "hourglass", label: "Vérification en cours…",
      sub: "Tes documents sont en cours d'examen par notre équipe.",
      color: "#BA7517", bg: "#FFF8E8", border: "#F0D49A",
    },
    rejected: {
      icon: "x-circle", label: "Documents refusés",
      sub: "Soumets à nouveau tes pièces justificatives.",
      color: colors.error, bg: colors.errorLight, border: colors.errorBorder,
    },
  }[status] || {
    icon: "identification-card", label: "Identité non vérifiée",
    sub: "La vérification augmente ta visibilité sur la carte.",
    color: colors.ink300, bg: colors.ink50, border: colors.ink100,
  };

  return (
    <View style={[kycStyles.banner, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Icon name={config.icon} size={22} color={config.color} weight="duotone" />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[kycStyles.label, { color: config.color }]}>{config.label}</Text>
        <Text style={kycStyles.sub}>{config.sub}</Text>
      </View>
    </View>
  );
}

const kycStyles = StyleSheet.create({
  banner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, padding: 12,
    marginHorizontal: 12, marginTop: 10,
    borderWidth: 1,
  },
  icon:  { fontSize: 22 },
  label: { fontSize: 13, fontFamily: fonts.bold },
  sub:   { fontSize: 11, color: colors.ink500, lineHeight: 16 },
});

export default function ProviderProfileOwnScreen({ navigation }) {
  const {
    profile,
    provider,
    loading,
    updateProfile,
    updateProfilePhoto,
    addPortfolioPhoto,
    removePortfolioPhoto,
    updatePhotoCaption,
    logout,
  } = useProviderOwnProfile();

  const { switchRole, loading: roleLoading } = useRoleSwitch();
  const [editVisible, setEditVisible] = useState(false);

  const roleScale = useRef(new Animated.Value(1)).current;
  const onRolePressIn = useCallback(() => {
    Animated.spring(roleScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }, [roleScale]);
  const onRolePressOut = useCallback(() => {
    Animated.spring(roleScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [roleScale]);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifRequests, setNotifRequests] = useState(true);

  // Charger les préférences notifications sauvegardées
  useEffect(() => {
    AsyncStorage.getItem("notif_prefs_provider").then((raw) => {
      if (!raw) return;
      try {
        const prefs = JSON.parse(raw);
        if (prefs.messages !== undefined) setNotifMessages(prefs.messages);
        if (prefs.requests !== undefined) setNotifRequests(prefs.requests);
      } catch {}
    });
  }, []);

  // Sauvegarder à chaque changement
  useEffect(() => {
    AsyncStorage.setItem("notif_prefs_provider", JSON.stringify({
      messages: notifMessages,
      requests: notifRequests,
    }));
  }, [notifMessages, notifRequests]);

  const handleSwitchToClient = useCallback(async () => {
    const result = await switchRole("client");
    if (result?.success) {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "MainApp" }] })
      );
    }
  }, [switchRole, navigation]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Se déconnecter ?",
      "Tu devras te reconnecter avec ton numéro de téléphone.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: "Phone" }] })
            );
          },
        },
      ],
    );
  }, [logout, navigation]);

  const monthRevenue = provider?.monthRevenue || 0;
  const goal = 150000;
  const percent = Math.min(Math.round((monthRevenue / goal) * 100), 100);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Barre fixe (titre + settings) — toujours visible ── */}
      <SafeAreaView style={styles.topBarSafe}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Mon profil</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setEditVisible(true)}
            activeOpacity={0.8}
          >
            <Icon name="settings" size={20} color={colors.ink700} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <SkeletonProfileOwn statCount={4} />
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header (avatar + infos + stats) — scrolle avec le contenu */}
        <ProviderOwnHeader
          profile={profile}
          provider={provider}
          onEditPhoto={updateProfilePhoto}
        />
        {/* ── Statut de vérification KYC (§14.4) ── */}
        <KycBanner status={provider?.verificationStatus} />

        {/* ── Bascule vers le mode Client ── */}
        <Animated.View style={{ transform: [{ scale: roleScale }] }}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={handleSwitchToClient}
            onPressIn={onRolePressIn}
            onPressOut={onRolePressOut}
            activeOpacity={1}
            disabled={roleLoading}
          >
            <View style={styles.roleCardIconWrap}>
              <Icon name="user-switch" size={24} color={colors.primary} weight="duotone" />
            </View>
            <View style={styles.roleCardText}>
              <Text style={styles.roleCardTitle}>Passer en mode Client</Text>
              <Text style={styles.roleCardSub}>
                {roleLoading ? "Changement de mode en cours…" : "Chercher des pros et faire des demandes"}
              </Text>
            </View>
            {roleLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={styles.roleCardArrow}>›</Text>
            }
          </TouchableOpacity>
        </Animated.View>

        <MenuSection title="Mes services">
          <View style={styles.servicesGrid}>
            {(provider?.services || []).map((id, index) => {
              const svc = SERVICES.find((s) => s.id === id);
              const pricing = provider?.servicePricing?.[id];
              if (!svc) return null;
              return (
                <View key={id} style={styles.serviceCard}>
                  <View style={styles.serviceCardLeft}>
                    <Text style={styles.serviceNum}>{index + 1}</Text>
                  </View>
                  <View style={styles.serviceIconWrap}>
                    <Icon name={svc.icon} size={20} color={colors.primary} weight="duotone" />
                  </View>
                  <View style={styles.serviceCardInfo}>
                    <Text style={styles.serviceLabel}>
                      {pricing?.customLabel || svc.label}
                    </Text>
                    {pricing ? (
                      <Text style={styles.servicePrice}>
                        {(pricing.minPrice || 0).toLocaleString("fr-FR")} –{" "}
                        {(pricing.maxPrice || 0).toLocaleString("fr-FR")} FCFA
                        {pricing.unit ? ` / ${pricing.unit}` : ""}
                      </Text>
                    ) : (
                      <Text style={styles.servicePriceEmpty}>Tarif non renseigné</Text>
                    )}
                  </View>
                </View>
              );
            })}
            {(provider?.services || []).length === 0 && (
              <Text style={styles.servicesEmpty}>Aucun service renseigné.</Text>
            )}
          </View>
        </MenuSection>

        <MenuSection title="Mes réalisations">
          <PortfolioSection
            portfolio={provider?.portfolio}
            onAdd={addPortfolioPhoto}
            onRemove={removePortfolioPhoto}
            onUpdateCaption={updatePhotoCaption}
          />
        </MenuSection>

        <MenuSection title="Mon compte">
          <MenuItem
            icon="pencil-simple"
            iconBg={colors.primarySoft}
            iconColor={colors.primary}
            label="Modifier mon profil"
            sublabel="Bio, quartier, nom"
            onPress={() => setEditVisible(true)}
          />
          <MenuItem
            icon="star"
            iconBg={colors.mangoSoft}
            iconColor={colors.mango}
            label="Mes avis reçus"
            sublabel={`${provider?.reviewCount || 0} avis · Note ${
              (typeof provider?.rating === "object"
                ? provider?.rating?.global
                : provider?.rating
              )?.toFixed(1) ?? "-"
            }/5`}
            // Ouvre le profil public du prestataire sur l'onglet "Avis"
            onPress={() =>
              navigation.navigate("ProviderProfile", {
                providerId: profile?.id,
                initialTab: "reviews",
              })
            }
          />
          <MenuItem
            icon="currency-dollar"
            iconBg={colors.skySoft}
            iconColor={colors.sky}
            label="Mes tarifs"
            sublabel="Fourchettes par prestation"
            onPress={() => setEditVisible(true)}
          />
          <MenuItem
            icon="map-pin"
            iconBg={colors.purpleSoft}
            iconColor={colors.purple}
            label="Zones de couverture"
            sublabel={`${(provider?.zones || []).join(", ") || "Non défini"}`}
            // Ouvre la feuille d'édition — section zones d'intervention
            onPress={() => setEditVisible(true)}
          />
        </MenuSection>

        <TouchableOpacity style={styles.revenueCard} activeOpacity={0.8} onPress={() => navigation.navigate("Earnings")}>
          <View style={styles.revenueTop}>
            <View>
              <MenuItem
                icon="chart-bar"
                iconBg={colors.primarySoft}
                iconColor={colors.primary}
                label="Revenus du mois"
                sublabel={`${monthRevenue.toLocaleString(
                  "fr-FR",
                )} FCFA · Objectif ${goal.toLocaleString("fr-FR")} FCFA`}
                showArrow={false}
              />
            </View>
            <View style={styles.revenueRight}>
              <MenuItem icon="" label={`${percent}%`} showArrow={false} />
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </TouchableOpacity>

        <MenuSection title="Notifications">
          <MenuItem
            icon="chat-circle"
            iconBg={colors.purpleSoft}
            iconColor={colors.purple}
            label="Messages clients"
            sublabel="Nouveaux messages"
            showArrow={false}
            rightComponent={
              <Switch
                value={notifMessages}
                onValueChange={setNotifMessages}
                trackColor={{ false: colors.ink100, true: colors.primary }}
                thumbColor={colors.textInverse}
                ios_backgroundColor={colors.ink100}
              />
            }
          />
          <MenuItem
            icon="wrench"
            iconBg={colors.primarySoft}
            iconColor={colors.primary}
            label="Nouvelles demandes"
            sublabel="Alertes en temps réel"
            showArrow={false}
            rightComponent={
              <Switch
                value={notifRequests}
                onValueChange={setNotifRequests}
                trackColor={{ false: colors.ink100, true: colors.primary }}
                thumbColor={colors.textInverse}
                ios_backgroundColor={colors.ink100}
              />
            }
          />
        </MenuSection>

        <MenuSection title="Aide & Support">
          <MenuItem
            icon="question"
            iconBg={colors.skySoft}
            iconColor="#3B82F6"
            label="Centre d'aide"
            sublabel="FAQ et tutoriels"
            onPress={() =>
              Alert.alert("Aide", "Centre d'aide Djobna - bientôt disponible.")
            }
          />
          <MenuItem
            icon="chat-circle-dots"
            iconBg={colors.primarySoft}
            iconColor={colors.primary}
            label="Nous contacter"
            sublabel="WhatsApp · Email"
            onPress={() =>
              Alert.alert("Contact", "Contacte-nous sur WhatsApp.")
            }
          />
          <MenuItem
            icon="info"
            iconBg="#F5F5F5"
            iconColor={colors.ink500}
            label="À propos"
            sublabel="Djobna v1.0.0 - Fait au Cameroun"
            onPress={() =>
              Alert.alert("Djobna", "Version 1.0.0\nFait au Cameroun")
            }
          />
        </MenuSection>

        <View style={styles.logoutWrap}>
          <MenuItem
            icon="sign-out"
            iconBg={colors.errorLight}
            iconColor={colors.error}
            label="Se déconnecter"
            isDestructive
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
      )}

      <EditProfileSheet
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        profile={profile}
        provider={provider}
        onSave={updateProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBarSafe: { backgroundColor: colors.background, zIndex: 10 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: fonts.extraBold,
    color: colors.ink900,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.headerBg,
  },
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 30 },

  servicesGrid: { paddingHorizontal: 12, paddingBottom: 14, gap: 10 },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FFFE",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0F5EE",
  },
  serviceCardLeft: {
    width: 22,
    alignItems: "center",
  },
  serviceNum: {
    fontSize: 12,
    fontFamily: fonts.extraBold,
    color: colors.primary,
    opacity: 0.5,
  },
  serviceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E8F8F2",
    alignItems: "center",
    justifyContent: "center",
  },
  // serviceIcon style removed — now uses Phosphor Icon component
  serviceCardInfo: { flex: 1, gap: 3 },
  serviceLabel: { fontSize: 14, fontFamily: fonts.bold, color: colors.textDark },
  servicePrice: { fontSize: 12, color: colors.primary, fontFamily: fonts.semiBold },
  servicePriceEmpty: { fontSize: 12, color: "#BBB", fontStyle: "italic" },
  servicesEmpty: { fontSize: 12, color: colors.ink300, paddingHorizontal: 14, paddingBottom: 14 },

  revenueCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  revenueTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueRight: { paddingRight: 14 },
  progressBg: {
    height: 5,
    backgroundColor: colors.ink50,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  logoutWrap: {
    backgroundColor: "#FFF0EE",
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FDDAD6",
  },
  roleCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.card, marginHorizontal: 12, marginTop: 12,
    borderRadius: 16, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  roleCardIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center",
  },
  roleCardText: { flex: 1, gap: 2 },
  roleCardTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.textDark },
  roleCardSub: { fontSize: 12, color: colors.textGray },
  roleCardArrow: { fontSize: 22, color: colors.textGray },
});

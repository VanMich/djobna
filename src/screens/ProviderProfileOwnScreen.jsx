// src/screens/ProviderProfileOwnScreen.jsx
//
// Profil propre du prestataire (§14).
// Sections : services, réalisations, compte, notifications, aide.
// Le badge KYC (§14.4) s'affiche tant que le compte n'est pas vérifié.

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import EditProfileSheet from "../components/providerOwnProfile/EditProfileSheet";
import PortfolioSection from "../components/providerOwnProfile/PortfolioSection";
import ProviderOwnHeader from "../components/providerOwnProfile/ProviderOwnHeader";
import MenuItem from "../components/clientProfile/MenuItem";
import MenuSection from "../components/clientProfile/MenuSection";
import { SERVICES } from "../constants/services";
import { useProviderOwnProfile } from "../hooks/useProviderOwnProfile";
import { useRoleSwitch } from "../hooks/useRoleSwitch";
import { colors, spacing } from "../theme";

// ─── Badge de statut de vérification KYC (§14.4) ─────────────────────────────
// Affiché en haut du contenu scrollable tant que le compte n'est pas "verified".
// 3 états : non soumis (null/undefined) / en cours (pending) / refusé (rejected).
function KycBanner({ status }) {
  if (status === "verified") return null;

  const config = {
    pending: {
      icon: "⏳", label: "Vérification en cours…",
      sub: "Vos documents sont en cours d'examen par notre équipe.",
      color: "#BA7517", bg: "#FFF8E8", border: "#F0D49A",
    },
    rejected: {
      icon: "❌", label: "Documents refusés",
      sub: "Soumettez à nouveau vos pièces justificatives.",
      color: "#E24B4A", bg: "#FFF0EE", border: "#FDDAD6",
    },
  }[status] || {
    icon: "📋", label: "Identité non vérifiée",
    sub: "La vérification augmente votre visibilité sur la carte.",
    color: "#AAB0B7", bg: "#F5F5F5", border: "#E8E8E8",
  };

  return (
    <View style={[kycStyles.banner, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={kycStyles.icon}>{config.icon}</Text>
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
  label: { fontSize: 13, fontWeight: "700" },
  sub:   { fontSize: 11, color: "#888", lineHeight: 16 },
});

export default function ProviderProfileOwnScreen({ navigation }) {
  const {
    profile,
    provider,
    loading,
    updateProfile,
    addPortfolioPhoto,
    removePortfolioPhoto,
    updatePhotoCaption,   // modifier la légende d'une photo (§14.2)
    logout,
  } = useProviderOwnProfile();

  const { switchRole, loading: roleLoading } = useRoleSwitch();
  const [editVisible, setEditVisible] = useState(false);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifRequests, setNotifRequests] = useState(true);

  const handleSwitchToClient = useCallback(async () => {
    await switchRole("client");
    // AppNavigator écoute en temps réel : la tab bar bascule automatiquement
  }, [switchRole]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Se déconnecter ?",
      "Vous devrez vous reconnecter avec votre numéro de téléphone.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.replace("Phone");
          },
        },
      ],
    );
  }, [logout, navigation]);

  const monthRevenue = provider?.monthRevenue || 0;
  const goal = 150000;
  const percent = Math.min(Math.round((monthRevenue / goal) * 100), 100);

  if (loading) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ProviderOwnHeader
        profile={profile}
        provider={provider}
        onSettings={() => setEditVisible(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Statut de vérification KYC (§14.4) ── */}
        <KycBanner status={provider?.verificationStatus} />

        {/* ── Bascule vers le mode Client ── */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={handleSwitchToClient}
          activeOpacity={0.85}
          disabled={roleLoading}
        >
          <Text style={styles.roleCardIcon}>🙋</Text>
          <View style={styles.roleCardText}>
            <Text style={styles.roleCardTitle}>Passer en mode Client</Text>
            <Text style={styles.roleCardSub}>Chercher des prestataires et faire des demandes</Text>
          </View>
          <Text style={styles.roleCardArrow}>›</Text>
        </TouchableOpacity>

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
                    <Text style={styles.serviceIcon}>{svc.icon}</Text>
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
            icon="✏️"
            iconBg="#F0FAF6"
            label="Modifier mon profil"
            sublabel="Bio, quartier, nom"
            onPress={() => setEditVisible(true)}
          />
          <MenuItem
            icon="⭐"
            iconBg="#FFFBEB"
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
            icon="💰"
            iconBg="#E8F4FF"
            label="Mes tarifs"
            sublabel="Fourchettes par prestation"
            // Ouvre la feuille d'édition du profil — section tarifs en bas du modal
            onPress={() => setEditVisible(true)}
          />
          <MenuItem
            icon="📍"
            iconBg="#F5EEFE"
            label="Zones de couverture"
            sublabel={`${(provider?.zones || []).join(", ") || "Non défini"}`}
            // Ouvre la feuille d'édition — section zones d'intervention
            onPress={() => setEditVisible(true)}
          />
        </MenuSection>

        <View style={styles.revenueCard}>
          <View style={styles.revenueTop}>
            <View>
              <MenuItem
                icon="📊"
                iconBg="#F0FAF6"
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
        </View>

        <MenuSection title="Notifications">
          <MenuItem
            icon="💬"
            iconBg="#F5EEFE"
            label="Messages clients"
            sublabel="Nouveaux messages"
            showArrow={false}
            rightComponent={
              <Switch
                value={notifMessages}
                onValueChange={setNotifMessages}
                trackColor={{ false: "#E8E8E8", true: colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor="#E8E8E8"
              />
            }
          />
          <MenuItem
            icon="🔧"
            iconBg="#F0FAF6"
            label="Nouvelles demandes"
            sublabel="Alertes en temps réel"
            showArrow={false}
            rightComponent={
              <Switch
                value={notifRequests}
                onValueChange={setNotifRequests}
                trackColor={{ false: "#E8E8E8", true: colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor="#E8E8E8"
              />
            }
          />
        </MenuSection>

        <MenuSection title="Aide & Support">
          <MenuItem
            icon="?"
            iconBg="#E8F4FF"
            label="Centre d'aide"
            sublabel="FAQ et tutoriels"
            onPress={() =>
              Alert.alert("Aide", "Centre d'aide Djobna - bientôt disponible.")
            }
          />
          <MenuItem
            icon="💬"
            iconBg="#F0FAF6"
            label="Nous contacter"
            sublabel="WhatsApp · Email"
            onPress={() =>
              Alert.alert("Contact", "Contactez-nous sur WhatsApp.")
            }
          />
          <MenuItem
            icon="ℹ️"
            iconBg="#F5F5F5"
            label="À propos"
            sublabel="Djobna v1.0.0 - Fait avec coeur au Cameroun"
            onPress={() =>
              Alert.alert("Djobna", "Version 1.0.0\nFait avec coeur au Cameroun")
            }
          />
        </MenuSection>

        <View style={styles.logoutWrap}>
          <MenuItem
            icon="🚪"
            iconBg="#FFF0EE"
            label="Se déconnecter"
            isDestructive
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

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
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  scroll: { flex: 1, backgroundColor: "#F4F6F5" },
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
    fontWeight: "800",
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
  serviceIcon: { fontSize: 20 },
  serviceCardInfo: { flex: 1, gap: 3 },
  serviceLabel: { fontSize: 14, fontWeight: "700", color: colors.textDark },
  servicePrice: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  servicePriceEmpty: { fontSize: 12, color: "#BBB", fontStyle: "italic" },
  servicesEmpty: { fontSize: 12, color: "#AAB0B7", paddingHorizontal: 14, paddingBottom: 14 },

  revenueCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF0EF",
  },
  revenueTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueRight: { paddingRight: 14 },
  progressBg: {
    height: 5,
    backgroundColor: "#F0F0F0",
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
    backgroundColor: "#fff", marginHorizontal: 12, marginTop: 12,
    borderRadius: 16, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  roleCardIcon: { fontSize: 28 },
  roleCardText: { flex: 1, gap: 2 },
  roleCardTitle: { fontSize: 14, fontWeight: "700", color: colors.textDark },
  roleCardSub: { fontSize: 12, color: colors.textGray },
  roleCardArrow: { fontSize: 22, color: colors.textGray },
});

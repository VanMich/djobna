// src/screens/ProviderProfileOwnScreen.jsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
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
import { colors } from "../theme";

export default function ProviderProfileOwnScreen({ navigation }) {
  const {
    profile,
    provider,
    loading,
    updateProfile,
    addPortfolioPhoto,
    removePortfolioPhoto,
    logout,
  } = useProviderOwnProfile();

  const [editVisible, setEditVisible] = useState(false);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifRequests, setNotifRequests] = useState(true);

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
        <MenuSection title="Mes spécialités">
          <View style={styles.tagsWrap}>
            {(provider?.services || []).map((id) => {
              const svc = SERVICES.find((s) => s.id === id);
              return svc ? (
                <View key={id} style={styles.tag}>
                  <MenuItem
                    icon={svc.icon}
                    iconBg="#F0FAF6"
                    label={svc.label}
                    showArrow={false}
                  />
                </View>
              ) : null;
            })}
          </View>
        </MenuSection>

        <MenuSection title="Mes réalisations">
          <PortfolioSection
            portfolio={provider?.portfolio}
            onAdd={addPortfolioPhoto}
            onRemove={removePortfolioPhoto}
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
              provider?.rating?.toFixed(1) || "-"
            }/5`}
            onPress={() =>
              Alert.alert("Bientôt", "Historique des avis à venir.")
            }
          />
          <MenuItem
            icon="💰"
            iconBg="#E8F4FF"
            label="Mes tarifs"
            sublabel="Fourchettes par prestation"
            onPress={() =>
              Alert.alert("Bientôt", "Gestion des tarifs à venir.")
            }
          />
          <MenuItem
            icon="📍"
            iconBg="#F5EEFE"
            label="Zones de couverture"
            sublabel={`${(provider?.zones || []).join(", ") || "Non défini"}`}
            onPress={() => Alert.alert("Bientôt", "Gestion des zones à venir.")}
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

  tagsWrap: { flexDirection: "row", flexWrap: "wrap" },
  tag: { width: "100%" },

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
});

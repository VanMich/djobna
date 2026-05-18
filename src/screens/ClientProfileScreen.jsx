// src/screens/ClientProfileScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useClientProfile } from "../hooks/useClientProfile";
import { useRoleSwitch } from "../hooks/useRoleSwitch";
import ClientProfileHeader from "../components/clientProfile/ClientProfileHeader";
import FavoritesSection from "../components/clientProfile/FavoritesSection";
import MenuSection from "../components/clientProfile/MenuSection";
import MenuItem from "../components/clientProfile/MenuItem";
import { colors, spacing, radius } from "../theme";

export default function ClientProfileScreen({ navigation }) {
  const {
    profile,
    favorites,
    history,
    stats,
    loading,
    removeFavorite,
    logout,
  } = useClientProfile();

  const { providerStatus, switchRole, loading: roleLoading } = useRoleSwitch();

  const handleProviderButton = useCallback(async () => {
    if (providerStatus === null) {
      // Pas encore de compte prestataire → lancer la création
      navigation.navigate("ProviderSetup");
    } else if (providerStatus === "approved") {
      // Compte validé → basculer en mode prestataire
      await switchRole("provider");
      // AppNavigator écoute en temps réel : la tab bar bascule automatiquement
    } else if (providerStatus === "pending") {
      navigation.navigate("VerificationPending");
    } else if (providerStatus === "rejected") {
      Alert.alert(
        "Dossier rejeté",
        "Votre dossier a été rejeté. Retournez sur l'écran de vérification pour soumettre à nouveau vos documents.",
        [{ text: "OK" }]
      );
    }
  }, [providerStatus, navigation, switchRole]);

  // États des toggles notifications
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifReviews, setNotifReviews] = useState(false);

  // ── Déconnexion ───────────────────────────
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
            // signOut() vide auth.currentUser
            // SplashScreen détecte et redirige vers Phone
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Phone" }],
              }),
            );
          },
        },
      ],
    );
  }, [logout, navigation]);

  // ── Modifier le profil ────────────────────
  const handleEditProfile = useCallback(() => {
    // À développer → écran de modification du profil
    Alert.alert(
      "Bientôt disponible",
      "La modification du profil sera disponible prochainement.",
    );
  }, []);

  // ── Supprimer le compte ───────────────────
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Supprimer mon compte ?",
      "Cette action est irréversible. Toutes vos données seront supprimées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: () => {
            // TODO: supprimer le compte Firebase Auth + Firestore
            Alert.alert(
              "À venir",
              "Contactez le support pour supprimer votre compte.",
            );
          },
        },
      ],
    );
  }, []);

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

      {/* Header */}
      <ClientProfileHeader
        profile={profile}
        stats={stats}
        onEditPhoto={handleEditProfile}
        onSettings={() => {}}
        // onSettings scroll vers la section Paramètres
        // On peut aussi naviguer vers un écran dédié
      />

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Bascule de rôle ── */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            providerStatus === "approved" && styles.roleCardActive,
            providerStatus === "pending" && styles.roleCardPending,
            providerStatus === "rejected" && styles.roleCardRejected,
          ]}
          onPress={handleProviderButton}
          activeOpacity={0.85}
          disabled={roleLoading || providerStatus === undefined}
        >
          <Text style={styles.roleCardIcon}>
            {providerStatus === null ? "🔧" :
             providerStatus === "pending" ? "⏳" :
             providerStatus === "approved" ? "✅" : "❌"}
          </Text>
          <View style={styles.roleCardText}>
            <Text style={styles.roleCardTitle}>
              {providerStatus === null ? "Devenir prestataire" :
               providerStatus === "pending" ? "Vérification en cours..." :
               providerStatus === "approved" ? "Passer en mode Prestataire" :
               "Dossier rejeté — Réessayer"}
            </Text>
            <Text style={styles.roleCardSub}>
              {providerStatus === null ? "Proposez vos services sur Djobna" :
               providerStatus === "pending" ? "Votre dossier est en cours d'examen" :
               providerStatus === "approved" ? "Votre compte prestataire est validé" :
               "Cliquez pour soumettre à nouveau"}
            </Text>
          </View>
          <Text style={styles.roleCardArrow}>›</Text>
        </TouchableOpacity>

        {/* ── Favoris ── */}
        <MenuSection title="Mes prestataires favoris">
          <FavoritesSection
            favorites={favorites}
            onPress={(providerId) =>
              navigation.navigate("ProviderProfile", { providerId })
            }
            onRemove={removeFavorite}
          />
        </MenuSection>

        {/* ── Mon compte ── */}
        <MenuSection title="Mon compte">
          <MenuItem
            icon="✏️"
            iconBg="#F0FAF6"
            label="Modifier mon profil"
            sublabel="Nom, quartier, photo"
            onPress={handleEditProfile}
          />
          <MenuItem
            icon="📋"
            iconBg="#E8F4FF"
            label="Historique des demandes"
            sublabel={`${history.length} demande${history.length > 1 ? "s" : ""} au total`}
            onPress={() =>
              Alert.alert("Bientôt", "Historique des demandes à venir.")
            }
          />
          <MenuItem
            icon="⭐"
            iconBg="#FFFBEB"
            label="Mes avis"
            sublabel={`${stats.reviewsGiven || 0} avis donnés`}
            onPress={() =>
              Alert.alert("Bientôt", "Historique des avis à venir.")
            }
          />
        </MenuSection>

        {/* ── Notifications ── */}
        <MenuSection title="Notifications">
          <MenuItem
            icon="💬"
            iconBg="#F5EEFE"
            label="Messages"
            sublabel="Nouveaux messages chat"
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
            label="Offres prestataires"
            sublabel="Nouvelles disponibilités"
            showArrow={false}
            rightComponent={
              <Switch
                value={notifOffers}
                onValueChange={setNotifOffers}
                trackColor={{ false: "#E8E8E8", true: colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor="#E8E8E8"
              />
            }
          />
          <MenuItem
            icon="⭐"
            iconBg="#FFFBEB"
            label="Rappels d'avis"
            sublabel="Après une prestation"
            showArrow={false}
            rightComponent={
              <Switch
                value={notifReviews}
                onValueChange={setNotifReviews}
                trackColor={{ false: "#E8E8E8", true: colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor="#E8E8E8"
              />
            }
          />
        </MenuSection>

        {/* ── Aide & Support ── */}
        <MenuSection title="Aide & Support">
          <MenuItem
            icon="❓"
            iconBg="#E8F4FF"
            label="Centre d'aide"
            sublabel="FAQ et tutoriels"
            onPress={() =>
              Alert.alert("Aide", "Centre d'aide Djobna — bientôt disponible.")
            }
          />
          <MenuItem
            icon="💬"
            iconBg="#F0FAF6"
            label="Nous contacter"
            sublabel="WhatsApp · Email"
            onPress={() =>
              Alert.alert(
                "Contact",
                "Contactez-nous sur WhatsApp : +237 6XX XXX XXX",
              )
            }
          />
          <MenuItem
            icon="ℹ️"
            iconBg="#F5F5F5"
            label="À propos"
            sublabel="Djobna v1.0.0 — Fait avec ❤️ au Cameroun"
            onPress={() =>
              Alert.alert("Djobna", "Version 1.0.0\nFait avec ❤️ au Cameroun")
            }
          />
        </MenuSection>

        {/* ── Confidentialité ── */}
        <MenuSection title="Confidentialité">
          <MenuItem
            icon="🔒"
            iconBg="#FFF0EE"
            label="Mes données"
            sublabel="Gérer, exporter, supprimer"
            onPress={() =>
              Alert.alert(
                "Données",
                "Gestion des données personnelles — bientôt disponible.",
              )
            }
          />
          <MenuItem
            icon="🗑️"
            iconBg="#FFF0EE"
            label="Supprimer mon compte"
            sublabel="Action irréversible"
            isDestructive
            onPress={handleDeleteAccount}
          />
        </MenuSection>

        {/* ── Bouton déconnexion ── */}
        <MenuItem
          icon="🚪"
          iconBg="#FFF0EE"
          label="Se déconnecter"
          isDestructive
          onPress={handleLogout}
        />
      </ScrollView>
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
  roleCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", marginHorizontal: 12, marginTop: 12,
    borderRadius: 16, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: "#F0FAF6" },
  roleCardPending: { borderColor: "#F5A623", backgroundColor: "#FFFBF0" },
  roleCardRejected: { borderColor: "#E24B4A", backgroundColor: "#FFF0EE" },
  roleCardIcon: { fontSize: 28 },
  roleCardText: { flex: 1, gap: 2 },
  roleCardTitle: { fontSize: 14, fontWeight: "700", color: colors.textDark },
  roleCardSub: { fontSize: 12, color: colors.textGray },
  roleCardArrow: { fontSize: 22, color: colors.textGray },
});

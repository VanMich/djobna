// src/screens/ClientProfileScreen.js
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useClientProfile } from "../hooks/useClientProfile";
import { useRoleSwitch } from "../hooks/useRoleSwitch";
import ClientProfileHeader from "../components/clientProfile/ClientProfileHeader";
import FavoritesSection from "../components/clientProfile/FavoritesSection";
import MenuSection from "../components/clientProfile/MenuSection";
import MenuItem from "../components/clientProfile/MenuItem";
import Icon from "../components/ui/Icon";
import { SkeletonProfileOwn } from "../components/ui";
import { colors, spacing, radius } from "../theme";

export default function ClientProfileScreen({ navigation }) {
  const {
    profile,
    favorites,
    history,
    stats,
    loading,
    removeFavorite,
    updateProfilePhoto,
    logout,
  } = useClientProfile();

  const { providerStatus, switchRole, loading: roleLoading } = useRoleSwitch();

  const roleScale = useRef(new Animated.Value(1)).current;
  const onRolePressIn = useCallback(() => {
    Animated.spring(roleScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }, [roleScale]);
  const onRolePressOut = useCallback(() => {
    Animated.spring(roleScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [roleScale]);

  const handleProviderButton = useCallback(async () => {
    if (providerStatus === null) {
      // Pas encore de compte prestataire → lancer la création
      navigation.navigate("ProviderSetup");
    } else if (providerStatus === "approved") {
      const result = await switchRole("provider");
      if (result?.success) {
        // Réinitialise la stack — AppNavigator relit active_role depuis la DB
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: "MainApp" }] })
        );
      }
    } else if (providerStatus === "pending") {
      navigation.navigate("VerificationPending");
    } else if (providerStatus === "rejected") {
      Alert.alert(
        "Dossier rejeté",
        "Votre dossier a été rejeté. Vous pouvez soumettre à nouveau vos documents.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Soumettre à nouveau", onPress: () => navigation.navigate("ProviderSetup") },
        ]
      );
    }
  }, [providerStatus, navigation, switchRole]);

  // États des toggles notifications (persistés via AsyncStorage)
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifReviews, setNotifReviews] = useState(false);

  // Charger les préférences sauvegardées
  useEffect(() => {
    AsyncStorage.getItem("notif_prefs").then((raw) => {
      if (!raw) return;
      try {
        const prefs = JSON.parse(raw);
        if (prefs.messages !== undefined) setNotifMessages(prefs.messages);
        if (prefs.offers !== undefined) setNotifOffers(prefs.offers);
        if (prefs.reviews !== undefined) setNotifReviews(prefs.reviews);
      } catch {}
    });
  }, []);

  // Sauvegarder à chaque changement
  useEffect(() => {
    AsyncStorage.setItem("notif_prefs", JSON.stringify({
      messages: notifMessages,
      offers: notifOffers,
      reviews: notifReviews,
    }));
  }, [notifMessages, notifOffers, notifReviews]);

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

  // ── Modifier la photo de profil ──────────
  const handleEditProfile = useCallback(async () => {
    await updateProfilePhoto();
  }, [updateProfilePhoto]);

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
      <View style={styles.root}>
        <StatusBar style="light" />
        <SkeletonProfileOwn statCount={3} />
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
        <Animated.View style={{ transform: [{ scale: roleScale }] }}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              providerStatus === "approved" && styles.roleCardActive,
              providerStatus === "pending" && styles.roleCardPending,
              providerStatus === "rejected" && styles.roleCardRejected,
            ]}
            onPress={handleProviderButton}
            onPressIn={onRolePressIn}
            onPressOut={onRolePressOut}
            activeOpacity={1}
            disabled={roleLoading || providerStatus === undefined}
          >
            <View style={styles.roleCardIconWrap}>
              <Icon
                name={providerStatus === null ? "wrench" :
                      providerStatus === "pending" ? "hourglass" :
                      providerStatus === "approved" ? "check-circle" : "x-circle"}
                size={24}
                color={providerStatus === null ? colors.primary :
                       providerStatus === "pending" ? "#F5A623" :
                       providerStatus === "approved" ? colors.primary : "#E24B4A"}
                weight="duotone"
              />
            </View>
            <View style={styles.roleCardText}>
              <Text style={styles.roleCardTitle}>
                {providerStatus === null ? "Devenir prestataire" :
                 providerStatus === "pending" ? "Vérification en cours..." :
                 providerStatus === "approved" ? "Passer en mode Prestataire" :
                 "Dossier rejeté — Réessayer"}
              </Text>
              <Text style={styles.roleCardSub}>
                {roleLoading ? "Changement de mode en cours…" :
                 providerStatus === null ? "Proposez vos services sur Djobna" :
                 providerStatus === "pending" ? "Votre dossier est en cours d'examen" :
                 providerStatus === "approved" ? "Votre compte prestataire est validé" :
                 "Cliquez pour soumettre à nouveau"}
              </Text>
            </View>
            {roleLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={styles.roleCardArrow}>›</Text>
            }
          </TouchableOpacity>
        </Animated.View>

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
            icon="pencil-simple"
            iconBg="#F0FAF6"
            iconColor={colors.primary}
            label="Modifier mon profil"
            sublabel="Nom, quartier, photo"
            onPress={handleEditProfile}
          />
          <MenuItem
            icon="file-text"
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
            label="Mes demandes"
            sublabel="Suivre vos demandes en cours"
            onPress={() => navigation.navigate("MyRequests")}
          />
          <MenuItem
            icon="clipboard-text"
            iconBg="#E8F4FF"
            iconColor="#0EA5E9"
            label="Historique des demandes"
            sublabel={`${history.length} demande${history.length > 1 ? "s" : ""} au total`}
            onPress={() => navigation.navigate("MissionHistory")}
          />
          <MenuItem
            icon="star"
            iconBg="#FFFBEB"
            iconColor="#F59E0B"
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
            icon="chat-circle"
            iconBg="#F5EEFE"
            iconColor="#8B5CF6"
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
            icon="wrench"
            iconBg="#F0FAF6"
            iconColor={colors.primary}
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
            icon="star"
            iconBg="#FFFBEB"
            iconColor="#F59E0B"
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
            icon="question"
            iconBg="#E8F4FF"
            iconColor="#3B82F6"
            label="Centre d'aide"
            sublabel="FAQ et tutoriels"
            onPress={() =>
              Alert.alert("Aide", "Centre d'aide Djobna — bientôt disponible.")
            }
          />
          <MenuItem
            icon="chat-circle-dots"
            iconBg="#F0FAF6"
            iconColor={colors.primary}
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
            icon="info"
            iconBg="#F5F5F5"
            iconColor="#888"
            label="À propos"
            sublabel="Djobna v1.0.0 — Fait au Cameroun"
            onPress={() =>
              Alert.alert("Djobna", "Version 1.0.0\nFait au Cameroun")
            }
          />
        </MenuSection>

        {/* ── Confidentialité ── */}
        <MenuSection title="Confidentialité">
          <MenuItem
            icon="lock"
            iconBg="#FFF0EE"
            iconColor="#E24B4A"
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
            icon="trash"
            iconBg="#FFF0EE"
            iconColor="#E24B4A"
            label="Supprimer mon compte"
            sublabel="Action irréversible"
            isDestructive
            onPress={handleDeleteAccount}
          />
        </MenuSection>

        {/* ── Bouton déconnexion ── */}
        <MenuItem
          icon="sign-out"
          iconBg="#FFF0EE"
          iconColor="#E24B4A"
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
    backgroundColor: colors.headerBg,
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
  roleCardIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#F0FAF6", alignItems: "center", justifyContent: "center",
  },
  roleCardText: { flex: 1, gap: 2 },
  roleCardTitle: { fontSize: 14, fontWeight: "700", color: colors.textDark },
  roleCardSub: { fontSize: 12, color: colors.textGray },
  roleCardArrow: { fontSize: 22, color: colors.textGray },
});

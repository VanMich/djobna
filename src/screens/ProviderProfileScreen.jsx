// src/screens/ProviderProfileScreen.jsx
// Affiche le profil public d'un prestataire (vue client).
//
// Remplace Firebase :
//   getDoc(doc(db,'providers',id)) + getDoc(doc(db,'users',id))
//   → supabase.from('providers').select('*, users!inner(*)').eq('id',id).single()
//   (une seule requête avec JOIN au lieu de deux)
//
//   auth.currentUser + getDoc(doc(db,'users',uid))
//   → supabase.auth.getUser() + supabase.from('users').select().eq('id',uid)
//
//   user.uid → user.id | displayName → display_name | quartier → quartier (inchangé)

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import PortfolioTab from "../components/providerProfile/PortfolioTab";
import ProfileHeader from "../components/providerProfile/ProfileHeader";
import ProfileTab from "../components/providerProfile/ProfileTab";
import ProfileTabs from "../components/providerProfile/ProfileTabs";
import ReviewsTab from "../components/providerProfile/ReviewsTab";
import ServiceRequestModal from "../components/providerProfile/ServiceRequestModal";
import RatingModal from "../components/reviews/RatingModal";
import { useReviews } from "../hooks/useReviews";
import { supabase } from "../config/supabase";
import { colors } from "../theme";

export default function ProviderProfileScreen({ navigation, route }) {
  // initialTab permet d'ouvrir directement l'onglet "reviews" (ex : depuis "Mes avis reçus")
  const { providerId, openRequest, initialTab } = route.params || {};
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || "profile");

  // ── Avis et notation (§15) ────────────────────────────────────────────────
  const { reviews, checkCanReview, submitReview, replyToReview } = useReviews(providerId);
  const [canReview,          setCanReview]          = useState(false);
  const [reviewRequestId,    setReviewRequestId]    = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingLoading,      setRatingLoading]      = useState(false);
  const [currentUserId,      setCurrentUserId]      = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  const scrollRef = useRef(null);

  // Récupère l'uid du client connecté + vérifie s'il peut noter ce prestataire
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id;
      if (!uid || !providerId) return;
      setCurrentUserId(uid);
      const { canReview: ok, requestId } = await checkCanReview(uid);
      setCanReview(ok);
      setReviewRequestId(requestId || null);
    });
  }, [providerId, checkCanReview]);

  // Soumet l'avis du client après validation du RatingModal
  const handleSubmitReview = useCallback(async (ratingData) => {
    if (!currentUserId || !reviewRequestId) return;
    setRatingLoading(true);

    const { data: userData } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", currentUserId)
      .single();

    const result = await submitReview({
      ...ratingData,
      requestId:  reviewRequestId,
      clientId:   currentUserId,
      authorName: userData?.display_name || "Client",
    });

    setRatingLoading(false);

    if (result.success) {
      setCanReview(false);        // masque le bouton "Laisser un avis"
      setRatingModalVisible(false);
      Alert.alert("Merci !", "Votre avis a été publié.");
    } else {
      Alert.alert("Erreur", "Impossible de publier l'avis. Réessayez.");
    }
  }, [currentUserId, reviewRequestId, submitReview]);

  useEffect(() => {
    if (!providerId) { setLoading(false); return; }

    let active = true;

    (async () => {
      try {
        // Une seule requête avec JOIN — remplace les deux getDoc (providers + users)
        const { data, error } = await supabase
          .from("providers")
          .select(`
            *,
            users!inner ( display_name, photo_url, phone_number, ville, quartier, pays )
          `)
          .eq("id", providerId)
          .single();

        if (!active) return;
        if (error || !data) { setLoading(false); return; }

        // Aplatir les données JOIN + mapper snake_case → camelCase
        setProvider({
          id: providerId,
          displayName: data.users.display_name,     // display_name → displayName
          photoURL: data.users.photo_url,
          phoneNumber: data.users.phone_number,
          ville: data.users.ville,
          quartier: data.users.quartier,
          bio: data.bio,
          services: data.services || [],
          servicePricing: data.service_pricing || {}, // service_pricing → servicePricing
          interventionZones: data.intervention_zones || [],
          yearsOfExperience: data.years_of_experience || 0,
          languages: data.languages || [],
          availability: data.availability,
          rating: {
            global: data.rating_global || 0,
            punctuality: data.rating_punctuality || 0,
            quality: data.rating_quality || 0,
            communication: data.rating_communication || 0,
            valueForMoney: data.rating_value_for_money || 0,
          },
          reviewCount: data.review_count || 0,
          verificationStatus: data.verification_status,
          portfolio: data.portfolio || [],
        });
      } catch (err) {
        console.error("Erreur chargement profil:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [providerId]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleToggleFav = useCallback(() => setIsFav((prev) => !prev), []);

  const handleShare = useCallback(async () => {
    if (!provider) return;
    try {
      await Share.share({ message: `Découvrez ${provider.displayName} sur Djobna !` });
    } catch (err) {
      console.error(err);
    }
  }, [provider]);

  const handleMore = useCallback(() => {
    Alert.alert("Options", "", [
      { text: "Signaler ce prestataire", style: "destructive" },
      { text: "Copier le lien du profil" },
      { text: "Annuler", style: "cancel" },
    ]);
  }, []);

  const handleContact = useCallback(() => {
    if (!providerId) return;
    navigation.navigate("Chat", {
      providerId,
      providerName: provider?.displayName,
      providerServices: provider?.services,
    });
  }, [navigation, providerId, provider]);

  const handleSolliciter = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("display_name, quartier")
        .eq("id", user.id)
        .single();

      if (!userData?.display_name || !userData?.quartier) {
        Alert.alert(
          "Profil incomplet",
          "Complétez votre profil (nom et quartier) avant de solliciter un prestataire.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Compléter mon profil", onPress: () => navigation.navigate("ProfileSetup") },
          ],
        );
        return;
      }
      setRequestModalVisible(true);
    } catch (err) {
      console.error("Erreur vérification profil:", err);
    }
  }, [navigation]);

  // Ouvre la modale si on arrive depuis la carte (openRequest: true)
  useEffect(() => {
    if (openRequest && provider) handleSolliciter();
  }, [openRequest, provider]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <Text style={styles.emptyTitle}>Profil introuvable</Text>
        <Text style={styles.emptyText}>Ce prestataire n'est plus disponible.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.headerSafe}>
        <ProfileHeader
          provider={provider}
          isFav={isFav}
          onBack={handleBack}
          onToggleFav={handleToggleFav}
          onShare={handleShare}
          onMore={handleMore}
          onContact={handleContact}
          onSolliciter={handleSolliciter}
        />
      </SafeAreaView>

      <ProfileTabs
        activeTab={activeTab}
        reviewCount={provider?.reviewCount}
        onTabChange={handleTabChange}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "profile" && <ProfileTab provider={provider} />}
        {activeTab === "portfolio" && <PortfolioTab provider={provider} />}
        {activeTab === "reviews" && (
          <ReviewsTab
            provider={provider}
            reviews={reviews}
            canReview={canReview}
            onRate={() => setRatingModalVisible(true)}
            isOwnProfile={currentUserId === providerId}
            replyToReview={replyToReview}
          />
        )}
      </ScrollView>

      {/* ── Modal de notation (§15.2) ── */}
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleSubmitReview}
        providerName={provider?.displayName}
        loading={ratingLoading}
      />

      <ServiceRequestModal
        visible={requestModalVisible}
        onClose={() => setRequestModalVisible(false)}
        provider={provider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.background, zIndex: 20, elevation: 20 },
  loader: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.background, gap: 8, paddingHorizontal: 24,
  },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptyText: { color: colors.textLight, fontSize: 13, textAlign: "center" },
  scroll: { flex: 1, backgroundColor: "#F4F6F5" },
  scrollContent: { paddingBottom: 30 },
});

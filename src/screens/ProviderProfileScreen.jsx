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
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "../components/ui/Icon";

import PortfolioTab from "../components/providerProfile/PortfolioTab";
import ProfileHeader from "../components/providerProfile/ProfileHeader";
import ProfileTab from "../components/providerProfile/ProfileTab";
import ProfileTabs from "../components/providerProfile/ProfileTabs";
import ReviewsTab from "../components/providerProfile/ReviewsTab";
import ServiceRequestModal from "../components/providerProfile/ServiceRequestModal";
import RatingModal from "../components/reviews/RatingModal";
import { useReviews } from "../hooks/useReviews";
import { supabase } from "../config/supabase";
import { SkeletonProfilePublic } from "../components/ui";
import { colors, fonts } from "../theme";

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
  const openRequestTriggered = useRef(false);

  const scrollRef = useRef(null);

  // Récupère l'uid du client connecté + vérifie s'il peut noter + charge l'état favori
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id;
      if (!uid || !providerId) return;
      setCurrentUserId(uid);
      const { canReview: ok, requestId } = await checkCanReview(uid);
      setCanReview(ok);
      setReviewRequestId(requestId || null);

      // Charge l'état favori depuis la DB
      const { data: clientData } = await supabase
        .from("clients")
        .select("favorite_providers")
        .eq("id", uid)
        .maybeSingle();
      if (clientData?.favorite_providers) {
        setIsFav(clientData.favorite_providers.includes(providerId));
      }
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
      Alert.alert("Merci !", "Ton avis a été publié.");
    } else {
      Alert.alert("Erreur", "Impossible de publier l'avis. Réessaye.");
    }
  }, [currentUserId, reviewRequestId, submitReview]);

  useEffect(() => {
    if (!providerId) { setLoading(false); return; }

    let active = true;

    (async () => {
      try {
        // Requête via la vue publique (sans données financières/sensibles)
        const { data, error } = await supabase
          .from("public_providers")
          .select("*")
          .eq("id", providerId)
          .single();

        if (!active) return;
        if (error || !data) { setLoading(false); return; }

        // Mapper snake_case → camelCase
        setProvider({
          id: providerId,
          displayName: data.display_name || "",
          photoURL: data.photo_url || null,
          ville: data.ville,
          quartier: data.quartier,
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
          completedJobs: data.completed_jobs || 0,
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

  const handleToggleFav = useCallback(async () => {
    if (!currentUserId || !providerId) return;
    const newVal = !isFav;
    setIsFav(newVal);
    try {
      const { data: clientData } = await supabase
        .from("clients")
        .select("favorite_providers")
        .eq("id", currentUserId)
        .maybeSingle();
      const current = clientData?.favorite_providers || [];
      const updated = newVal
        ? [...current, providerId]
        : current.filter((id) => id !== providerId);
      await supabase.from("clients").update({
        favorite_providers: updated,
        updated_at: new Date().toISOString(),
      }).eq("id", currentUserId);
    } catch (err) {
      console.error("Erreur toggle favori:", err);
      setIsFav(!newVal); // rollback
    }
  }, [currentUserId, providerId, isFav]);

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
      { text: "Signaler ce pro", style: "destructive" },
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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("display_name, quartier")
        .eq("id", user.id)
        .single();

      if (!userData?.display_name || !userData?.quartier) {
        Alert.alert(
          "Profil incomplet",
          "Complète ton profil (nom et quartier) avant de contacter un pro.",
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

  // Ouvre la modale une seule fois si on arrive depuis la carte (openRequest: true)
  useEffect(() => {
    if (openRequest && provider && !openRequestTriggered.current) {
      openRequestTriggered.current = true;
      handleSolliciter();
    }
  }, [openRequest, provider, handleSolliciter]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  if (!loading && !provider) {
    return (
      <View style={styles.loader}>
        <StatusBar style="dark" />
        <Text style={styles.emptyTitle}>Profil introuvable</Text>
        <Text style={styles.emptyText}>Ce pro n'est plus disponible.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Barre fixe (back + actions) — toujours visible ── */}
      <SafeAreaView style={styles.topBarSafe}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <Icon name="arrow-back" size={18} color={colors.ink700} />
          </TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={[styles.iconBtn, isFav && styles.iconBtnFavActive]}
              onPress={handleToggleFav}
              activeOpacity={0.8}
            >
              <Icon
                name={isFav ? "heart" : "heart-outline"}
                size={18}
                color={isFav ? colors.mango : colors.ink500}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare} activeOpacity={0.8}>
              <Icon name="share-social-outline" size={18} color={colors.ink700} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleMore} activeOpacity={0.8}>
              <Icon name="ellipsis-vertical" size={18} color={colors.ink700} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <SkeletonProfilePublic />
      ) : (
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header body (avatar + infos + CTA + stats) */}
        <ProfileHeader
          provider={provider}
          onContact={handleContact}
          onSolliciter={handleSolliciter}
        />

        {/* Tabs — devient sticky quand on scrolle */}
        <ProfileTabs
          activeTab={activeTab}
          reviewCount={provider?.reviewCount}
          onTabChange={handleTabChange}
        />

        {/* Contenu de l'onglet actif */}
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
      )}

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
  topBarSafe: { backgroundColor: colors.background, zIndex: 20, elevation: 20 },
  topBar: {
    height: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnFavActive: {
    backgroundColor: colors.mangoSoft,
  },
  loader: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.background, gap: 8, paddingHorizontal: 24,
  },
  emptyTitle: { color: colors.ink900, fontSize: 18, fontFamily: fonts.extraBold },
  emptyText: { color: colors.ink500, fontSize: 13, textAlign: "center" },
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 30 },
});

// src/screens/ProviderProfileScreen.jsx
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
import { doc, getDoc } from "firebase/firestore";

import PortfolioTab from "../components/providerProfile/PortfolioTab";
import ProfileHeader from "../components/providerProfile/ProfileHeader";
import ProfileTab from "../components/providerProfile/ProfileTab";
import ProfileTabs from "../components/providerProfile/ProfileTabs";
import ReviewsTab from "../components/providerProfile/ReviewsTab";
import { db } from "../config/firebase";
import { colors } from "../theme";

export default function ProviderProfileScreen({ navigation, route }) {
  const { providerId } = route.params || {};
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isFav, setIsFav] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!providerId) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    (async () => {
      try {
        const [providerSnap, userSnap] = await Promise.all([
          getDoc(doc(db, "providers", providerId)),
          getDoc(doc(db, "users", providerId)),
        ]);

        if (active && providerSnap.exists() && userSnap.exists()) {
          setProvider({
            id: providerId,
            ...userSnap.data(),
            ...providerSnap.data(),
          });
        }
      } catch (err) {
        console.error("Erreur chargement profil:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [providerId]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleToggleFav = useCallback(() => setIsFav((prev) => !prev), []);

  const handleShare = useCallback(async () => {
    if (!provider) return;

    try {
      await Share.share({
        message: `Découvrez ${provider.displayName} sur Djobna !`,
      });
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
        <Text style={styles.emptyText}>
          Ce prestataire n'est plus disponible.
        </Text>
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
        {activeTab === "reviews" && <ReviewsTab provider={provider} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: {
    backgroundColor: colors.background,
    zIndex: 20,
    elevation: 20,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptyText: { color: colors.textLight, fontSize: 13, textAlign: "center" },
  scroll: { flex: 1, backgroundColor: "#F4F6F5" },
  scrollContent: { paddingBottom: 30 },
});

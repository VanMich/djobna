// src/screens/ProviderProfileScreen.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  SafeAreaView,
  Share,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { colors } from "../theme";

import ProfileHeader from "../components/providerProfile/ProfileHeader";
import ProfileTabs from "../components/providerProfile/ProfileTabs";
import ProfileTab from "../components/providerProfile/ProfileTab";
import PortfolioTab from "../components/providerProfile/PortfolioTab";
import ReviewsTab from "../components/providerProfile/ReviewsTab";

const STATS_BAR_H = 46;
const TOPBAR_H = 52;
const PADDING_FULL = 44;
const PADDING_MINI = 14;

export default function ProviderProfileScreen({ navigation, route }) {
  const { providerId } = route.params;
  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isFav, setIsFav] = useState(false);

  // Valeurs animées
  const topBarOpacity = useRef(new Animated.Value(1)).current;
  const topBarTranslateY = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(1)).current;
  const statsMaxHeight = useRef(new Animated.Value(STATS_BAR_H)).current;
  const headerPaddingTop = useRef(new Animated.Value(PADDING_FULL)).current;
  const isHidden = useRef(false);
  const lastScrollY = useRef(0);

  // Chargement des données
  useEffect(() => {
    (async () => {
      try {
        const [provSnap, userSnap] = await Promise.all([
          getDoc(doc(db, "providers", providerId)),
          getDoc(doc(db, "users", providerId)),
        ]);
        if (provSnap.exists() && userSnap.exists()) {
          setProvider({
            id: providerId,
            ...userSnap.data(),
            ...provSnap.data(),
          });
        }
      } catch (err) {
        console.error("Erreur chargement profil:", err);
      }
    })();
  }, [providerId]);

  // Cacher les éléments du header
  const hideElements = useCallback(() => {
    if (isHidden.current) return;
    isHidden.current = true;
    Animated.parallel([
      Animated.timing(topBarOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(topBarTranslateY, {
        toValue: -8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(statsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(statsMaxHeight, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(headerPaddingTop, {
        toValue: PADDING_MINI,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    topBarOpacity,
    topBarTranslateY,
    statsOpacity,
    statsMaxHeight,
    headerPaddingTop,
  ]);

  // Montrer les éléments du header
  const showElements = useCallback(() => {
    if (!isHidden.current) return;
    isHidden.current = false;
    Animated.parallel([
      Animated.timing(topBarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(topBarTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(statsMaxHeight, {
        toValue: STATS_BAR_H,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(headerPaddingTop, {
        toValue: PADDING_FULL,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    topBarOpacity,
    topBarTranslateY,
    statsOpacity,
    statsMaxHeight,
    headerPaddingTop,
  ]);

  // Gestion du scroll
  const handleScroll = useCallback(
    (e) => {
      const currentY = e.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;
      if (diff > 3 && currentY > 10) hideElements();
      if (diff < -3) showElements();
      lastScrollY.current = currentY;
    },
    [hideElements, showElements],
  );

  // Actions
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleToggleFav = useCallback(() => setIsFav((prev) => !prev), []);
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Découvrez ${provider?.displayName} sur Djobna !`,
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
    navigation.navigate("Chat", {
      providerId,
      providerName: provider?.displayName,
    });
  }, [navigation, providerId, provider]);
  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      showElements();
    },
    [showElements],
  );

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
          topBarOpacity={topBarOpacity}
          topBarTranslateY={topBarTranslateY}
          statsOpacity={statsOpacity}
          statsMaxHeight={statsMaxHeight}
          headerPaddingTop={headerPaddingTop}
        />
      </SafeAreaView>
      <ProfileTabs
        activeTab={activeTab}
        reviewCount={provider?.reviewCount}
        onTabChange={handleTabChange}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
  headerSafe: { backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: "#F4F6F5" },
  scrollContent: { paddingBottom: 30 },
});

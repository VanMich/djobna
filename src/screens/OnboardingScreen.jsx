// src/screens/OnboardingScreen.jsx
// Slides d'accueil affichées une seule fois au premier lancement.
// 3 slides illustrées → bouton "Commencer" → PhoneScreen.

import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "../components/ui/Icon";
import { colors, fonts, spacing, radius } from "../theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "search",
    title: "Trouve le bon pro",
    subtitle: "Plombier, électricien, ménage… Des pros vérifiés près de chez toi, disponibles maintenant.",
    color: "#FFFFFF",
    bg: "rgba(255,255,255,0.15)",
  },
  {
    id: "2",
    icon: "message-circle",
    title: "Contacte & négocie",
    subtitle: "Décris ta tâche, reçois un devis, échange en direct. Tout se passe dans l'app.",
    color: "#FFFFFF",
    bg: "rgba(255,255,255,0.15)",
  },
  {
    id: "3",
    icon: "shield-check",
    title: "Paie en toute confiance",
    subtitle: "Paiement Mobile Money sécurisé. Tu ne paies qu'une fois satisfait du travail.",
    color: "#FFFFFF",
    bg: "rgba(255,255,255,0.15)",
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  }, [currentIndex]);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem("onboarding_done", "true");
    navigation.replace("Phone");
  }, [navigation]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem("onboarding_done", "true");
    navigation.replace("Phone");
  }, [navigation]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: "clamp" });
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: "clamp" });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconCircle, { backgroundColor: item.bg, transform: [{ scale }], opacity }]}>
          <Icon name={item.icon} size={56} color={item.color} strokeWidth={1.5} />
        </Animated.View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    );
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Bottom: dots + button */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: "clamp" });
            const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: "clamp" });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: "#FFFFFF" }]}
              />
            );
          })}
        </View>

        {/* CTA button */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.ctaText}>
            {isLast ? "Commencer" : "Suivant"}
          </Text>
          <Icon name="arrow-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1F1A",
  },
  skipBtn: {
    position: "absolute",
    top: 56,
    right: spacing.lg,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  skipText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: "rgba(255,255,255,0.7)",
  },
  flatList: { flex: 1 },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    gap: 24,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
  },
  ctaText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});

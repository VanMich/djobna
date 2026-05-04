// src/screens/SplashScreen.js
import { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export default function SplashScreen({ navigation }) {
  // navigation est passé automatiquement par React Navigation
  // Il contient navigation.navigate(), navigation.goBack(), etc.

  const fadeAnim = new Animated.Value(0);
  // Animated.Value(0) = une valeur animable qui commence à 0 (invisible)

  useEffect(() => {
    // useEffect se lance UNE FOIS au montage du composant (tableau vide [])

    // 1. Animation de fondu
    Animated.timing(fadeAnim, {
      toValue: 1, // Va de 0 → 1 (invisible → visible)
      duration: 800, // En 800ms
      useNativeDriver: true, // Important : utilise le GPU pour fluidité
    }).start();

    // 2. Après 2.5s, vérifier si l'utilisateur est déjà connecté
    const timer = setTimeout(async () => {
      // TODO: vérifier le token stocké avec AsyncStorage
      // const token = await AsyncStorage.getItem('userToken');
      // if (token) { navigation.replace('Home'); }
      // else { navigation.replace('Phone'); }

      // Pour l'instant on va toujours vers Phone :
      navigation.replace("Phone");
      // replace() = remplace l'écran actuel (pas de retour possible)
    }, 2500);

    return () => clearTimeout(timer); // Nettoyage si composant démonté
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Dj</Text>
        </View>
        <Text style={styles.appName}>Djobna</Text>
        <Text style={styles.tagline}>
          Trouvez le bon prestataire{"\n"}près de chez vous, maintenant.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // StyleSheet.create() est comme du CSS mais en objet JS
  // Avantage : React Native l'optimise en mémoire
  container: {
    flex: 1, // flex:1 = prend tout l'espace disponible
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { alignItems: "center", gap: 16 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
});

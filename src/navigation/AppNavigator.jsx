import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../config/firebase";
import { colors } from "../theme";
import ClientTabNavigator from "./ClientTabNavigator";
import ProviderTabNavigator from "./ProviderTabNavigator";

function isProviderRole(role) {
  return role === "provider" || role === "both";
}

export default function AppNavigator({ navigation }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        navigation.replace("Phone");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setLoading(false);
          navigation.replace("ProfileSetup");
          return;
        }

        setRole(snap.data().role || "client");
      } catch (err) {
        console.error("Erreur chargement role navigation:", err);
        setRole("client");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return isProviderRole(role) ? <ProviderTabNavigator /> : <ClientTabNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: "600",
  },
});

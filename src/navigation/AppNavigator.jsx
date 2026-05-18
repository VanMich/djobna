// src/navigation/AppNavigator.jsx
//
// Remplace Firebase :
//   onAuthStateChanged(auth, user => {...})  → supabase.auth.onAuthStateChange()
//   onSnapshot(doc(db,'users',user.uid))    → fetch initial + Realtime channel UPDATE
//   unsubscribeAuth()                       → subscription.unsubscribe()
//   unsubscribeDocRef.current()             → supabase.removeChannel(roleChannelRef.current)
//   snap.data().activeRole                  → payload.new.active_role

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { supabase } from "../config/supabase";
import { colors } from "../theme";
import ClientTabNavigator from "./ClientTabNavigator";
import ProviderTabNavigator from "./ProviderTabNavigator";

export default function AppNavigator({ navigation }) {
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const roleChannelRef = useRef(null); // remplace unsubscribeDocRef

  useEffect(() => {
    // Remplace onAuthStateChanged(auth, user => {...})
    // Supabase donne session?.user au lieu de user directement
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Nettoie l'abonnement Realtime précédent si l'utilisateur change
        // Remplace unsubscribeDocRef.current()
        if (roleChannelRef.current) {
          supabase.removeChannel(roleChannelRef.current);
          roleChannelRef.current = null;
        }

        const user = session?.user; // session?.user remplace user directement

        if (!user) {
          setLoading(false);
          navigation.replace("Phone");
          return;
        }

        // Lecture initiale de active_role + role — remplace snap.data().activeRole
        // maybeSingle() : pas d'erreur si le profil n'existe pas encore
        const { data } = await supabase
          .from("users")
          .select("active_role, role")
          .eq("id", user.id)
          .maybeSingle();

        if (!data) {
          setLoading(false);
          navigation.replace("ProfileSetup");
          return;
        }

        let resolvedRole = data.active_role || "client";

        // Guard : si active_role est "provider", vérifier que la vérification est approuvée.
        // Empêche l'accès au dashboard prestataire si le dossier n'est pas encore validé.
        if (resolvedRole === "provider") {
          const { data: providerData } = await supabase
            .from("providers")
            .select("verification_status")
            .eq("id", user.id)
            .maybeSingle();

          if (!providerData || providerData.verification_status !== "approved") {
            resolvedRole = "client";
            // Corrige l'incohérence en base
            await supabase
              .from("users")
              .update({ active_role: "client" })
              .eq("id", user.id);
          }
        }

        setActiveRole(resolvedRole);
        setLoading(false);

        // Realtime : écoute les changements de rôle pour basculer l'UI sans redémarrer
        // Remplace onSnapshot(doc(db,'users',user.uid), snap => setActiveRole(snap.data().activeRole))
        const channel = supabase
          .channel(`nav-role-${user.id}`)
          .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${user.id}`,
          }, (payload) => {
            const newRole = payload.new?.active_role;
            if (newRole) setActiveRole(newRole);
          })
          .subscribe();

        roleChannelRef.current = channel;
      }
    );

    return () => {
      subscription.unsubscribe(); // remplace unsubscribeAuth()
      if (roleChannelRef.current) {
        supabase.removeChannel(roleChannelRef.current);
      }
    };
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return activeRole === "provider" ? <ProviderTabNavigator /> : <ClientTabNavigator />;
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

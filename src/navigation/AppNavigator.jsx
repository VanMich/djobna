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
import { useNotifications } from "../hooks/useNotifications";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { colors } from "../theme";
import ClientTabNavigator from "./ClientTabNavigator";
import ProviderTabNavigator from "./ProviderTabNavigator";

export default function AppNavigator({ navigation }) {
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const roleChannelRef = useRef(null);

  useNotifications();
  const unreadCount = useUnreadCount();

  useEffect(() => {
    // Remplace onAuthStateChanged(auth, user => {...})
    // Supabase donne session?.user au lieu de user directement
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignorer les events qui ne changent pas l'état d'auth
        // TOKEN_REFRESHED est un rafraîchissement automatique, pas un changement de session
        if (event === "TOKEN_REFRESHED") return;

        // Nettoie l'abonnement Realtime précédent si l'utilisateur change
        if (roleChannelRef.current) {
          supabase.removeChannel(roleChannelRef.current);
          roleChannelRef.current = null;
        }

        const user = session?.user;

        if (!user) {
          // Seulement rediriger si c'est un vrai sign out, pas un glitch
          if (event === "SIGNED_OUT") {
            setLoading(false);
            navigation.replace("Phone");
          }
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
          .channel(`nav-role-${user.id}-${Date.now()}`)
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

  return activeRole === "provider"
    ? <ProviderTabNavigator unreadCount={unreadCount} />
    : <ClientTabNavigator unreadCount={unreadCount} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.headerBg,
    gap: 12,
  },
  loadingText: {
    color: colors.headerSubtext,
    fontSize: 13,
    fontWeight: "600",
  },
});

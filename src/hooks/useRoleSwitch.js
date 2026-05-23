// src/hooks/useRoleSwitch.js
// Gère le statut du compte prestataire et la bascule de rôle (client ↔ prestataire).
// Utilisé dans ClientProfileScreen et ProviderProfileOwnScreen.
//
// Remplace Firebase :
//   auth.currentUser              → supabase.auth.getUser()  (async)
//   getDoc(doc(db,'providers',uid)) → supabase.from('providers').select().eq('id', uid)
//   updateDoc(doc(db,'users',uid))  → supabase.from('users').update().eq('id', uid)
//   activeRole                    → active_role  (snake_case PostgreSQL)
//   verificationStatus            → verification_status

import { useEffect, useRef, useState } from "react";
import { supabase } from "../config/supabase";

export function useRoleSwitch() {
  const [providerStatus, setProviderStatus] = useState(undefined); // undefined = chargement
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id;
      if (!uid) { setProviderStatus(null); return; }

      const fetchStatus = () =>
        supabase
          .from("providers")
          .select("verification_status")
          .eq("id", uid)
          .maybeSingle()
          .then(({ data: provider }) => {
            if (active) setProviderStatus(provider?.verification_status ?? null);
          })
          .catch(() => { if (active) setProviderStatus(null); });

      fetchStatus();

      // Realtime : met à jour la carte de rôle dès que l'admin approuve ou rejette
      channelRef.current = supabase
        .channel(`role-switch-${uid}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "providers",
          filter: `id=eq.${uid}`,
        }, (payload) => {
          const newStatus = payload.new?.verification_status;
          if (active && newStatus !== undefined) setProviderStatus(newStatus);
        })
        .subscribe();
    });

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Met à jour active_role dans la table users.
  // AppNavigator écoute ce champ en Realtime et bascule automatiquement la tab bar.
  // Remplace updateDoc(doc(db, 'users', uid), { activeRole: role })
  const switchRole = async (role) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return { success: false };

      const { error } = await supabase
        .from("users")
        .update({
          active_role: role,             // activeRole → active_role
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Erreur bascule de rôle:", err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { providerStatus, switchRole, loading };
}

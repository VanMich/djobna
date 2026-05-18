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

import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";

export function useRoleSwitch() {
  const [providerStatus, setProviderStatus] = useState(undefined); // undefined = chargement
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // getUser() est async sous Supabase — on ne peut plus faire auth.currentUser directement
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (!uid) { setProviderStatus(null); return; }

      // Vérifie si l'utilisateur a un profil prestataire
      // maybeSingle() = pas d'erreur si aucun résultat (remplace snap.exists())
      supabase
        .from("providers")
        .select("verification_status") // verification_status = verificationStatus en snake_case
        .eq("id", uid)
        .maybeSingle()
        .then(({ data: provider }) => {
          setProviderStatus(provider?.verification_status ?? null);
        })
        .catch(() => setProviderStatus(null));
    });
  }, []);

  // Met à jour active_role dans la table users.
  // AppNavigator écoute ce champ en Realtime et bascule automatiquement la tab bar.
  // Remplace updateDoc(doc(db, 'users', uid), { activeRole: role })
  const switchRole = async (role) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

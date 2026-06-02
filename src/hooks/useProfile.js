// src/hooks/useProfile.js
// Création du profil utilisateur après la première connexion OTP.
// Appelé dans ProfileSetupScreen.jsx juste après la vérification du code SMS.
//
// Ce hook écrit dans deux tables Supabase :
//   - users   : profil de base commun à tous les utilisateurs
//   - clients : données spécifiques au rôle client
//
// Remplace Firebase :
//   setDoc(doc(db, 'users', uid), {...})   → supabase.from('users').insert({...})
//   setDoc(doc(db, 'clients', uid), {...}) → supabase.from('clients').insert({...})
//   serverTimestamp()                      → new Date().toISOString()
//   user.phoneNumber                       → user.phone  (champ Supabase Auth)
//   camelCase Firestore                    → snake_case PostgreSQL

import { useState } from "react";
import { supabase } from "../config/supabase";

// Upload une URI locale vers Supabase Storage et retourne l'URL publique
async function uploadAvatar(userId, uri) {
  const ext = uri.split('.').pop() || 'jpg';
  const fileName = `${userId}.${ext}`;
  const filePath = `${userId}/avatar.jpg`;
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: `image/${ext}`,
  });
  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, formData, { upsert: true, contentType: `image/${ext}` });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;
}

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // profileData : { displayName, ville, quartier, pays, photoUri? }
  const createProfile = async ({ displayName, ville, quartier, pays, photoUri }) => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer l'utilisateur connecté — équivalent de auth.currentUser de Firebase
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Utilisateur non connecté");

      let photo_url = null;
      if (photoUri) {
        photo_url = await uploadAvatar(user.id, photoUri);
      }

      const now = new Date().toISOString(); // remplace serverTimestamp() de Firestore

      // Écriture dans la table users (remplace setDoc sur /users/{uid})
      // upsert = insert si inexistant, update si déjà présent
      const { error: userError } = await supabase.from("users").upsert({
        id: user.id,                 // clé primaire = id Supabase Auth
        display_name: displayName,   // camelCase → snake_case
        photo_url,
        role: "client",
        active_role: "client",       // activeRole → active_role
        ville,
        quartier,
        pays,
        created_at: now,
        updated_at: now,
      });
      if (userError) throw userError;

      // Téléphone stocké dans la table privée (lisible par le propriétaire seul)
      const { error: privError } = await supabase.from("user_private").upsert({
        id: user.id,
        phone_number: user.phone,    // user.phone sous Supabase (= user.phoneNumber Firebase)
        updated_at: now,
      });
      if (privError) throw privError;

      // Écriture dans la table clients (remplace setDoc sur /clients/{uid})
      const { error: clientError } = await supabase.from("clients").upsert({
        id: user.id,
        favorite_providers: [],      // favoriteProviders → favorite_providers
        booking_history: [],         // bookingHistory → booking_history
        profile_complete: true,      // profileComplete → profile_complete
        created_at: now,
        updated_at: now,
      });
      if (clientError) throw clientError;

      return { success: true };
    } catch (err) {
      console.error("Erreur création profil:", err);
      setError("Impossible de créer le profil. Réessayez.");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createProfile, loading, error };
}

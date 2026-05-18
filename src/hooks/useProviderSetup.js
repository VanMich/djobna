// src/hooks/useProviderSetup.js
// Soumet le dossier d'inscription prestataire (profil + documents KYC).
// Appelé dans ProviderSetupScreen.jsx à la dernière étape du formulaire.
//
// Ce hook écrit dans trois tables Supabase :
//   - providers    : profil prestataire complet
//   - verification : documents KYC (CNI, selfie)
//   - users        : mise à jour role → "both"
//
// Remplace Firebase :
//   auth.currentUser          → supabase.auth.getUser()
//   setDoc(doc(db,'providers')) → supabase.from('providers').upsert()
//   setDoc(doc(db,'verification')) → supabase.from('verification').upsert()
//   updateDoc(doc(db,'users'))  → supabase.from('users').update()
//   serverTimestamp()           → new Date().toISOString()
//   camelCase Firestore         → snake_case PostgreSQL

import { useState } from "react";
import { supabase } from "../config/supabase";

// Upload vers bucket 'avatars' (public) — retourne l'URL publique
async function uploadAvatar(userId, uri) {
  const blob = await fetch(uri).then((r) => r.blob());
  const { error } = await supabase.storage
    .from("avatars")
    .upload(`${userId}/avatar.jpg`, blob, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(`${userId}/avatar.jpg`).data.publicUrl;
}

// Upload vers bucket 'document' (privé) — retourne le chemin pour URL signée côté admin
async function uploadKycDoc(userId, uri, filename) {
  const blob = await fetch(uri).then((r) => r.blob());
  const path = `${userId}/${filename}`;
  const { error } = await supabase.storage
    .from("documents")
    .upload(path, blob, { upsert: true });
  if (error) throw error;
  return path;
}

export function useProviderSetup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // data: { displayName, photoUri, ville, quartier, pays, interventionZones,
  //         services: [{ type, customLabel, minPrice, maxPrice, unit }],
  //         bio, yearsOfExperience, languages, cniRecto, cniVerso, selfie }
  const submitProviderProfile = async (data) => {
    setLoading(true);
    setError(null);

    try {
      // Récupère l'utilisateur connecté — remplace auth.currentUser
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Upload photo de profil → bucket avatars (public)
      const photo_url = data.photoUri
        ? await uploadAvatar(user.id, data.photoUri)
        : null;

      // Upload documents KYC → bucket document (privé) — stocke le chemin
      const [cni_recto, cni_verso, selfie_with_cni] = await Promise.all([
        data.cniRecto ? uploadKycDoc(user.id, data.cniRecto, "cni_recto.jpg") : Promise.resolve(null),
        data.cniVerso ? uploadKycDoc(user.id, data.cniVerso, "cni_verso.jpg") : Promise.resolve(null),
        data.selfie   ? uploadKycDoc(user.id, data.selfie,   "selfie.jpg")    : Promise.resolve(null),
      ]);

      // services = tableau de strings pour les recherches array-contains
      const serviceIds = data.services.map((s) => s.type);

      // service_pricing = objet indexé par type pour l'affichage des tarifs
      // servicePricing (camelCase Firestore) → service_pricing (snake_case PostgreSQL)
      const service_pricing = Object.fromEntries(
        data.services.map((s) => [
          s.type,
          {
            customLabel: s.customLabel,
            minPrice: s.minPrice,
            maxPrice: s.maxPrice,
            unit: s.unit,
          },
        ])
      );

      const now = new Date().toISOString();

      // Écriture du profil prestataire — remplace setDoc(doc(db,'providers', uid))
      const { error: providerError } = await supabase.from("providers").upsert({
        id: user.id,
        display_name: data.displayName,
        photo_url,
        ville: data.ville,
        quartier: data.quartier,
        pays: data.pays,
        intervention_zones: data.interventionZones, // interventionZones → intervention_zones
        services: serviceIds,
        service_pricing,                      // servicePricing → service_pricing
        bio: data.bio,
        years_of_experience: Number(data.yearsOfExperience) || 0, // yearsOfExperience → years_of_experience
        languages: data.languages,
        availability: false,
        location: { latitude: null, longitude: null },
        review_count: 0,
        verification_status: "pending",
        subscription_plan: "classic",
        wallet_balance: 0,                    // walletBalance → wallet_balance
        portfolio: [],
        created_at: now,
        updated_at: now,
      });
      if (providerError) throw providerError;

      // Écriture des documents KYC — remplace setDoc(doc(db,'verification', uid))
      const { error: verifError } = await supabase.from("verification").upsert({
        id: user.id,
        cni_recto,
        cni_verso,
        selfie_with_cni,
        submitted_at: now,
        reviewed_at: null,
        status: "pending",
        rejection_reason: null,               // rejectionReason → rejection_reason
      });
      if (verifError) throw verifError;

      // Mise à jour du profil utilisateur + rôle → "both"
      // On synchronise display_name, photo_url, ville, quartier, pays dans users
      // car tous les écrans lisent ces champs depuis users (JOIN users!inner)
      const { error: userError } = await supabase
        .from("users")
        .update({
          role: "both",
          display_name: data.displayName,
          photo_url,
          ville: data.ville,
          quartier: data.quartier,
          pays: data.pays,
          updated_at: now,
        })
        .eq("id", user.id);
      if (userError) throw userError;

      return { success: true };
    } catch (err) {
      console.error("Erreur création profil prestataire:", err);
      setError("Impossible de soumettre le dossier. Réessayez.");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { submitProviderProfile, loading, error };
}

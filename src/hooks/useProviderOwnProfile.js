// src/hooks/useProviderOwnProfile.js
// Charge et écoute en temps réel le profil du prestataire connecté.
// Utilisé dans ProviderProfileOwnScreen.jsx.
//
// Remplace Firebase :
//   auth.currentUser                 → supabase.auth.getUser() (async)
//   onSnapshot(doc(db,'users',uid))  → fetch initial + Realtime channel users
//   onSnapshot(doc(db,'providers',uid)) → fetch initial + Realtime channel providers
//   updateDoc(doc(db,'providers',uid)) → supabase.from('providers').update()
//   arrayUnion(uri)                  → fetch + push + update (PostgreSQL arrays)
//   arrayRemove(uri)                 → fetch + filter + update
//   signOut(auth)                    → supabase.auth.signOut()
//   user.uid                         → user.id

import { useCallback, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../config/supabase";

export function useProviderOwnProfile() {
  const [userId, setUserId] = useState(null);  // null = encore en chargement
  const [profile, setProfile] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  // Récupère l'uid au montage — remplace auth.currentUser (synchrone Firebase)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? "");  // "" = non connecté, null = chargement en cours
    });
  }, []);

  // Charge profil + prestataire et s'abonne aux changements Realtime
  useEffect(() => {
    if (userId === null) return; // encore en chargement
    if (!userId) { setLoading(false); return; }

    setLoading(true);

    // Fonction réutilisée à l'init et à chaque notification Realtime
    const fetchData = async () => {
      const [{ data: userData }, { data: providerData }, { data: privData }] = await Promise.all([
        supabase.from("users").select("*").eq("id", userId).single(),
        supabase.from("providers").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_private").select("phone_number").eq("id", userId).maybeSingle(),
      ]);

      if (userData) {
        // Mapping snake_case → camelCase pour ne pas casser les composants existants
        setProfile({
          id: userId,
          displayName: userData.display_name,
          photoURL: userData.photo_url,
          phoneNumber: privData?.phone_number,
          role: userData.role,
          activeRole: userData.active_role,
          ville: userData.ville,
          quartier: userData.quartier,
          pays: userData.pays,
        });
      }

      if (providerData) {
        setProvider({
          id: userId,
          bio: providerData.bio,
          services: providerData.services || [],
          servicePricing: providerData.service_pricing || {},      // service_pricing → servicePricing
          zones: providerData.intervention_zones || [],            // intervention_zones → zones (nom utilisé dans le screen)
          interventionZones: providerData.intervention_zones || [],
          yearsOfExperience: providerData.years_of_experience || 0,
          languages: providerData.languages || [],
          availability: providerData.availability,
          rating: {
            global: providerData.rating_global || 0,
            punctuality: providerData.rating_punctuality || 0,
            quality: providerData.rating_quality || 0,
            communication: providerData.rating_communication || 0,
            valueForMoney: providerData.rating_value_for_money || 0,
          },
          reviewCount: providerData.review_count || 0,
          monthRevenue: providerData.month_revenue || 0,           // month_revenue → monthRevenue
          todayCount: providerData.today_count || 0,
          verificationStatus: providerData.verification_status,
          portfolio: providerData.portfolio || [],
          walletBalance: providerData.wallet_balance || 0,
        });
      } else {
        setProvider(null);
      }

      setLoading(false);
    };

    fetchData();

    // Realtime : écoute modifications table users (profil de base)
    // Remplace onSnapshot(doc(db, 'users', uid), cb)
    const userChannel = supabase
      .channel(`own-user-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "users",
        filter: `id=eq.${userId}`,
      }, () => fetchData())
      .subscribe();

    // Realtime : écoute modifications table providers
    // Remplace onSnapshot(doc(db, 'providers', uid), cb)
    const providerChannel = supabase
      .channel(`own-provider-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "providers",
        filter: `id=eq.${userId}`,
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(providerChannel);
    };
  }, [userId]);

  // Met à jour le profil (utilisateur + prestataire)
  // Remplace updateDoc(doc(db,'users',uid)) + updateDoc(doc(db,'providers',uid))
  const updateProfile = useCallback(async (data) => {
    if (!userId) return { success: false };
    const now = new Date().toISOString();

    try {
      if (data.displayName || data.quartier) {
        await supabase.from("users").update({
          ...(data.displayName && { display_name: data.displayName }),
          ...(data.quartier && { quartier: data.quartier }),
          updated_at: now,
        }).eq("id", userId);
      }

      await supabase.from("providers").update({
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.services !== undefined && { services: data.services }),
        ...(data.zones !== undefined && { intervention_zones: data.zones }),
        ...(data.hourlyRate !== undefined && { service_pricing: data.hourlyRate }),
        // Nouveaux champs §14 — languages + tarifs par service
        ...(data.languages !== undefined && { languages: data.languages }),
        ...(data.servicePricing !== undefined && { service_pricing: data.servicePricing }),
        updated_at: now,
      }).eq("id", userId);

      return { success: true };
    } catch (err) {
      console.error("Erreur mise à jour profil:", err);
      return { success: false };
    }
  }, [userId]);

  // Upload et mise à jour de la photo de profil (bucket "avatars")
  const updateProfilePhoto = useCallback(async () => {
    if (!userId) return { success: false };
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return { success: false };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (result.canceled) return { success: false };

    try {
      const localUri = result.assets[0].uri;
      const blob = await fetch(localUri).then((r) => r.blob());
      const storagePath = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(storagePath, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(storagePath).data.publicUrl;
      await supabase.from("users").update({
        photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);
      return { success: true };
    } catch (err) {
      console.error("Erreur upload photo profil:", err);
      return { success: false };
    }
  }, [userId]);

  // Ajoute une photo au portfolio : sélection galerie → upload Storage → stocke l'URL publique
  const addPortfolioPhoto = useCallback(async () => {
    if (!userId) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;

    // Upload vers Supabase Storage bucket 'portfolio'
    const filename = `${Date.now()}.jpg`;
    const storagePath = `${userId}/${filename}`;
    const blob = await fetch(localUri).then((r) => r.blob());
    const { error: uploadError } = await supabase.storage
      .from("portfolio")
      .upload(storagePath, blob);
    if (uploadError) {
      console.error("Erreur upload portfolio:", uploadError);
      return;
    }
    const publicUrl = supabase.storage.from("portfolio").getPublicUrl(storagePath).data.publicUrl;

    const { data } = await supabase
      .from("providers")
      .select("portfolio")
      .eq("id", userId)
      .single();

    const newPortfolio = [...(data?.portfolio || []), { uri: publicUrl, caption: "" }];

    await supabase.from("providers").update({
      portfolio: newPortfolio,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }, [userId]);

  // Supprime une photo du portfolio (DB + Storage)
  const removePortfolioPhoto = useCallback(async (uri) => {
    if (!userId) return;

    // Extrait le chemin storage depuis l'URL publique
    // Format : https://xxx.supabase.co/storage/v1/object/public/portfolio/userId/filename.jpg
    const storagePath = uri.split("/portfolio/")[1];
    if (storagePath) {
      await supabase.storage.from("portfolio").remove([storagePath]);
    }

    const { data } = await supabase
      .from("providers")
      .select("portfolio")
      .eq("id", userId)
      .single();

    const newPortfolio = (data?.portfolio || []).filter((p) => p.uri !== uri);

    await supabase.from("providers").update({
      portfolio: newPortfolio,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }, [userId]);

  // Met à jour la légende d'une photo du portfolio (§14.2)
  const updatePhotoCaption = useCallback(async (uri, caption) => {
    if (!userId) return;

    const { data } = await supabase
      .from("providers")
      .select("portfolio")
      .eq("id", userId)
      .single();

    // Remplace la légende de la photo ciblée, laisse les autres intactes
    const newPortfolio = (data?.portfolio || []).map((p) =>
      p.uri === uri ? { ...p, caption } : p,
    );

    await supabase.from("providers").update({
      portfolio: newPortfolio,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }, [userId]);

  // Ajoute une zone d'intervention — remplace arrayUnion(zone)
  const addZone = useCallback(async (zone) => {
    if (!userId || !zone) return;

    const { data } = await supabase
      .from("providers")
      .select("intervention_zones")
      .eq("id", userId)
      .single();

    const current = data?.intervention_zones || [];
    if (current.includes(zone)) return; // déjà présente

    await supabase.from("providers").update({
      intervention_zones: [...current, zone],
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }, [userId]);

  // Supprime une zone d'intervention — remplace arrayRemove(zone)
  const removeZone = useCallback(async (zone) => {
    if (!userId) return;

    const { data } = await supabase
      .from("providers")
      .select("intervention_zones")
      .eq("id", userId)
      .single();

    await supabase.from("providers").update({
      intervention_zones: (data?.intervention_zones || []).filter((z) => z !== zone),
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }, [userId]);

  // Déconnexion — remplace signOut(auth)
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erreur déconnexion:", err);
    }
  }, []);

  return {
    profile,
    provider,
    loading,
    updateProfile,
    updateProfilePhoto,
    addPortfolioPhoto,
    removePortfolioPhoto,
    updatePhotoCaption,
    addZone,
    removeZone,
    logout,
  };
}

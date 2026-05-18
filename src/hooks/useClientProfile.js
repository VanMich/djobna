// src/hooks/useClientProfile.js
// Charge et écoute en temps réel le profil client, ses favoris et son historique.
// Utilisé dans ClientProfileScreen.jsx.
//
// Remplace Firebase :
//   auth.currentUser                     → supabase.auth.getUser() (async)
//   onSnapshot(doc(db,'users',uid))      → fetch initial + Supabase Realtime channel users
//   onSnapshot(query(collection,'requests')) → fetch initial + Realtime channel requests
//   getDoc(db,'clients',uid)             → supabase.from('clients').select()
//   getDoc(db,'users' / 'providers', id) → supabase join providers+users en une requête
//   arrayRemove(providerId)              → fetch → filter → update (PostgreSQL n'a pas arrayRemove)
//   signOut(auth)                        → supabase.auth.signOut()
//   user.uid                             → user.id
//   camelCase                            → snake_case

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../config/supabase";

const initialStats = {
  missionsCount: 0,
  favoritesCount: 0,
  reviewsGiven: 0,
};

export function useClientProfile() {
  const [userId, setUserId] = useState(null);  // uid de l'utilisateur connecté
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);

  // Récupération de l'uid dès le montage — remplace auth.currentUser (synchrone Firebase)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // PROFIL + FAVORIS — chargement initial + Realtime
  // Remplace onSnapshot(doc(db, 'users', uid), async snap => {...})
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userId === null) return; // encore en chargement

    if (!userId) {
      setProfile(null);
      setFavorites([]);
      setStats(initialStats);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    // Fonction interne : charge le profil + les favoris
    const fetchProfileAndFavorites = async () => {
      try {
        // Lecture du profil utilisateur — remplace getDoc(doc(db,'users',uid))
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!active) return;
        if (userError || !userData) {
          setProfile(null);
          setFavorites([]);
          setStats((prev) => ({ ...prev, favoritesCount: 0 }));
          setLoading(false);
          return;
        }

        // Adapter les noms de champs snake_case → camelCase pour le reste de l'app
        setProfile({
          id: userData.id,
          displayName: userData.display_name,
          photoURL: userData.photo_url,
          phoneNumber: userData.phone_number,
          role: userData.role,
          activeRole: userData.active_role,
          ville: userData.ville,
          quartier: userData.quartier,
          pays: userData.pays,
        });

        // Lecture des données client — remplace getDoc(doc(db,'clients',uid))
        const { data: clientData } = await supabase
          .from("clients")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!active) return;
        if (!clientData) {
          setFavorites([]);
          setStats((prev) => ({ ...prev, favoritesCount: 0 }));
          setLoading(false);
          return;
        }

        const favIds = clientData.favorite_providers || [];

        if (favIds.length === 0) {
          setFavorites([]);
          setStats((prev) => ({ ...prev, favoritesCount: 0 }));
          setLoading(false);
          return;
        }

        // Récupère les profils des prestataires favoris en une seule requête avec JOIN
        // Remplace le Promise.all de getDoc(users) + getDoc(providers) par favori
        const { data: favProviders } = await supabase
          .from("providers")
          .select(`
            *,
            users!inner ( display_name, photo_url, phone_number )
          `)
          .in("id", favIds);

        if (!active) return;

        // Aplatir les données imbriquées (users est un objet dans le résultat du join)
        const enriched = (favProviders || []).map((p) => ({
          id: p.id,
          displayName: p.users.display_name,
          photoURL: p.users.photo_url,
          phoneNumber: p.users.phone_number,
          services: p.services,
          ville: p.ville,
          quartier: p.quartier,
          rating: p.rating,
          verificationStatus: p.verification_status,
        }));

        setFavorites(enriched);
        setStats((prev) => ({ ...prev, favoritesCount: favIds.length }));
      } catch (err) {
        console.error("Erreur chargement profil client:", err);
        setFavorites([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfileAndFavorites();

    // Realtime : écoute les modifications du profil utilisateur
    // Remplace onSnapshot(doc(db, 'users', uid), cb)
    const profileChannel = supabase
      .channel(`client-profile-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "users",
        filter: `id=eq.${userId}`,
      }, () => {
        // Re-fetch à chaque modification du profil
        if (active) fetchProfileAndFavorites();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(profileChannel);
    };
  }, [userId]);

  // ─────────────────────────────────────────────────────────────
  // HISTORIQUE DES DEMANDES — chargement initial + Realtime
  // Remplace onSnapshot(query(collection(db,'requests'), where('clientId','==',uid)))
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const fetchRequests = async () => {
      // Remplace la query Firestore avec where("clientId", "==", uid)
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("client_id", userId)           // clientId → client_id
        .order("created_at", { ascending: false }); // tri côté DB (plus efficace)

      if (error) {
        console.error("Erreur chargement historique client:", error);
        setHistory([]);
        setStats((prev) => ({ ...prev, missionsCount: 0 }));
        return;
      }

      setHistory(data || []);
      setStats((prev) => ({
        ...prev,
        missionsCount: (data || []).filter((d) => d.status === "done").length,
      }));
    };

    fetchRequests();

    // Realtime : écoute les nouvelles demandes et changements de statut
    // Remplace onSnapshot(requestsQuery, snap => {...})
    const requestsChannel = supabase
      .channel(`client-requests-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "requests",
        filter: `client_id=eq.${userId}`,
      }, () => fetchRequests())
      .subscribe();

    return () => supabase.removeChannel(requestsChannel);
  }, [userId]);

  // Supprime un prestataire des favoris
  // Remplace arrayRemove(providerId) de Firestore
  // PostgreSQL n'a pas d'équivalent direct → on fetch, filtre, update
  const removeFavorite = useCallback(
    async (providerId) => {
      if (!userId) return;
      try {
        const { data: clientData } = await supabase
          .from("clients")
          .select("favorite_providers")
          .eq("id", userId)
          .single();

        const newFavorites = (clientData?.favorite_providers || []).filter(
          (id) => id !== providerId
        );

        await supabase
          .from("clients")
          .update({
            favorite_providers: newFavorites,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } catch (err) {
        console.error("Erreur suppression favori:", err);
      }
    },
    [userId]
  );

  // Déconnexion — remplace signOut(auth) de Firebase
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erreur déconnexion:", err);
    }
  }, []);

  return { profile, favorites, history, stats, loading, removeFavorite, logout };
}

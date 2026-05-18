// src/hooks/useProviders.js
// Charge la liste des prestataires disponibles et approuvés avec écoute en temps réel.
// filters: { service, quartier, minRating, searchQuery }
//
// Remplace Firebase :
//   onSnapshot(query(collection(db,'providers'), where('availability','==',true)))
//   → fetch initial + Supabase Realtime channel sur la table providers
//
// Avantage Supabase :
//   - Le filtre verificationStatus === "approved" est maintenant côté serveur (.eq)
//   - Les données users (displayName, photoURL) récupérées en JOIN en une seule requête
//   - Les données sont mappées en camelCase pour ne pas casser les screens existants

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../config/supabase";

// Mappe une ligne provider (snake_case PostgreSQL) vers camelCase pour les screens
function mapProvider(p) {
  return {
    id: p.id,
    // Champs venus du JOIN avec la table users
    displayName: p.users?.display_name || "",
    photoURL: p.users?.photo_url || null,
    // Champs de la table providers
    bio: p.bio,
    services: p.services || [],
    servicePricing: p.service_pricing || {},   // service_pricing → servicePricing
    ville: p.ville,
    quartier: p.quartier,
    pays: p.pays,
    interventionZones: p.intervention_zones || [], // intervention_zones → interventionZones
    yearsOfExperience: p.years_of_experience || 0,
    languages: p.languages || [],
    availability: p.availability,
    location: p.location || null,
    subscription: { plan: p.subscription_plan || "classic" },
    rating: {
      global: p.rating_global || 0,
      punctuality: p.rating_punctuality || 0,
      quality: p.rating_quality || 0,
      communication: p.rating_communication || 0,
      valueForMoney: p.rating_value_for_money || 0,
    },
    reviewCount: p.review_count || 0,
    verificationStatus: p.verification_status,
    portfolio: p.portfolio || [],
    walletBalance: p.wallet_balance || 0,
  };
}

export function useProviders(filters = {}) {
  const { service, quartier, minRating = 0, searchQuery = "" } = filters;
  const [rawProviders, setRawProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Compteur pour générer un nom de canal unique à chaque montage et éviter la
  // collision "cannot add callbacks after subscribe()" lors des navigations tab.
  const mountCount = useRef(0);

  useEffect(() => {
    setLoading(true);
    let active = true;

    const fetchProviders = async () => {
      const { data, error } = await supabase
        .from("providers")
        .select(`
          *,
          users!inner ( display_name, photo_url )
        `)
        .eq("availability", true)
        .eq("verification_status", "approved");

      if (!active) return;
      if (error) {
        console.error("Erreur chargement prestataires:", error);
        setLoading(false);
        return;
      }

      setRawProviders((data || []).map(mapProvider));
      setLoading(false);
    };

    fetchProviders();

    // Nom unique par montage : évite que removeChannel (async) laisse le canal
    // en état "subscribed" quand l'effet se réexécute (tab navigation ou Strict Mode).
    const channelName = `providers-available-${++mountCount.current}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "providers",
      }, () => {
        if (active) fetchProviders();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtrage côté client : service, quartier, note, recherche textuelle
  // Logique identique à l'original — les noms de champs sont déjà en camelCase via mapProvider
  const providers = useMemo(() => {
    let result = rawProviders;

    if (service) {
      result = result.filter((p) => p.services?.includes(service));
    }

    if (quartier) {
      result = result.filter(
        (p) => p.quartier === quartier || p.interventionZones?.includes(quartier)
      );
    }

    if (minRating > 0) {
      result = result.filter((p) => (p.rating?.global ?? 0) >= minRating);
    }

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const name = (p.displayName || "").toLowerCase();
        const bio = (p.bio || "").toLowerCase();
        const services = (p.services || []).join(" ").toLowerCase();
        return name.includes(term) || bio.includes(term) || services.includes(term);
      });
    }

    return result;
  }, [rawProviders, service, quartier, minRating, searchQuery]);

  return { providers, loading };
}

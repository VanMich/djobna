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

import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../config/supabase";

// Mappe une ligne provider (snake_case PostgreSQL) vers camelCase pour les screens
function mapProvider(p) {
  return {
    id: p.id,
    // Champs directement dans providers (pas de JOIN users)
    displayName: p.display_name || "",
    photoURL: p.photo_url || null,
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
    subscription: { plan: "classic" }, // subscription_plan n'est plus dans la vue publique
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
    // walletBalance supprimé — donnée privée non exposée dans la vue publique
  };
}

export function useProviders(filters = {}) {
  const { service, quartier, minRating = 0, searchQuery = "" } = filters;
  const [rawProviders, setRawProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef(false);

  // Fetch au montage + à chaque fois que l'écran reprend le focus (onglets)
  useFocusEffect(
    useCallback(() => {
      activeRef.current = true;
      setLoading(true);

      supabase
        .from("public_providers")
        .select("*")
        .eq("availability", true)
        .eq("verification_status", "approved")
        .then(({ data, error }) => {
          if (!activeRef.current) return;
          if (error) {
            console.error("Erreur chargement prestataires:", error);
          } else {
            setRawProviders((data || []).map(mapProvider));
          }
          setLoading(false);
        });

      return () => { activeRef.current = false; };
    }, []),
  );

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

// src/hooks/useProviders.js
// Hook pour récupérer les prestataires disponibles en temps réel
// Utilisé dans HomeScreen.js et MapScreen.js

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../config/firebase";

export function useProviders(filterService = null) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    // Construire la requête Firestore
    // onSnapshot = écoute les changements en TEMPS RÉEL
    // → la liste se met à jour automatiquement sans recharger
    let q;

    if (filterService) {
      // Filtre par service
      q = query(
        collection(db, "providers"),
        where("isAvailable", "==", true),
        where("services", "array-contains", filterService),
      );
    } else {
      // Tous les prestataires disponibles
      q = query(collection(db, "providers"), where("isAvailable", "==", true));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProviders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement prestataires:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    // Nettoyer l'écoute quand le composant est démonté
    return () => unsubscribe();
  }, [filterService]);

  return { providers, loading, error };
}

/**
 * // src/hooks/useProviders.js — VERSION TEST
// Remplacer par cette version temporaire
// ⚠️ Remettre la vraie version quand Firebase est prêt

export function useProviders(filterService = null) {

  const MOCK_PROVIDERS = [
    {
      id: 'mock1',
      displayName: 'Paul Nguema',
      quartier: 'Akwa',
      services: ['mechanic'],
      isAvailable: true,
      rating: 4.8,
      reviewCount: 32,
      completedJobs: 87,
      isVerified: true,
      bio: 'Mécanicien professionnel à Douala.',
      portfolio: [],
      zones: ['Akwa', 'Bonanjo', 'Deido'],
      location: { latitude: 4.0511, longitude: 9.7679 },
    },
    {
      id: 'mock2',
      displayName: 'Fatima Kamga',
      quartier: 'Bonapriso',
      services: ['barber'],
      isAvailable: true,
      rating: 4.9,
      reviewCount: 58,
      completedJobs: 124,
      isVerified: true,
      bio: 'Coiffeuse professionnelle, déplacement possible.',
      portfolio: [],
      zones: ['Bonapriso', 'Bali', 'Makepe'],
      location: { latitude: 4.0620, longitude: 9.7750 },
    },
    {
      id: 'mock3',
      displayName: 'André Mbock',
      quartier: 'Deido',
      services: ['electrician'],
      isAvailable: true,
      rating: 4.6,
      reviewCount: 19,
      completedJobs: 45,
      isVerified: false,
      bio: 'Électricien certifié, 5 ans d\'expérience.',
      portfolio: [],
      zones: ['Deido', 'Ndokoti', 'Bepanda'],
      location: { latitude: 4.0450, longitude: 9.7600 },
    },
    {
      id: 'mock4',
      displayName: 'Jean Fotso',
      quartier: 'Bali',
      services: ['plumber'],
      isAvailable: true,
      rating: 4.5,
      reviewCount: 24,
      completedJobs: 61,
      isVerified: true,
      bio: 'Plombier qualifié, intervention en 1h.',
      portfolio: [],
      zones: ['Bali', 'Akwa', 'Bonanjo'],
      location: { latitude: 4.0580, longitude: 9.7820 },
    },
  ];

  // Appliquer le filtre si nécessaire
  const filtered = filterService
    ? MOCK_PROVIDERS.filter(p => p.services.includes(filterService))
    : MOCK_PROVIDERS;

  return {
    providers: filtered,
    loading: false,
    error: null,
  };
}
 */

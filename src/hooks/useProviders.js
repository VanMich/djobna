// src/hooks/useProviders.js
// Hook pour récupérer les prestataires disponibles en temps réel
// Utilisé dans HomeScreen.js et MapScreen.js

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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

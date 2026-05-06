// src/hooks/useProviders.js
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../config/firebase";

export function useProviders(filterService = null) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Construire la requête Firestore
    let q = query(
      collection(db, "providers"),
      where("isAvailable", "==", true),
      // On ne récupère que les prestataires disponibles
    );

    // Si un filtre de service est actif :
    if (filterService) {
      q = query(
        collection(db, "providers"),
        where("isAvailable", "==", true),
        where("services", "array-contains", filterService),
        // array-contains vérifie si le tableau 'services'
        // contient la valeur filterService
      );
    }

    // onSnapshot = écoute les changements en TEMPS RÉEL
    // Chaque fois qu'un prestataire change son statut →
    // la liste se met à jour automatiquement sans recharger
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = [];
      for (const doc of snapshot.docs) {
        // Récupérer aussi les infos du profil utilisateur
        data.push({
          id: doc.id,
          ...doc.data(),
        });
      }
      setProviders(data);
      setLoading(false);
    });

    // Nettoyage : stopper l'écoute quand le composant est démonté
    // Très important pour éviter les fuites mémoire
    return () => unsubscribe();
  }, [filterService]);

  return { providers, loading };
}

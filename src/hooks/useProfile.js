// src/hooks/useProfile.js
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../config/firebase";

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────
  // Créer le profil utilisateur dans Firestore
  // ─────────────────────────────────────────
  const createProfile = async (profileData) => {
    // profileData = {
    //   displayName: string,
    //   quartier: string,
    //   photoURL?: string,
    //   role: 'client' | 'provider' | 'both',
    //   services?: string[]  (si provider)
    // }

    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté");

      // 1. Créer le document dans la collection 'users'
      // ───────────────────────────────────────────────
      const userRef = doc(db, "users", user.uid);
      // doc() crée une référence vers un document
      // Syntaxe : doc(db, 'nom_collection', 'id_document')

      await setDoc(userRef, {
        phoneNumber: user.phoneNumber,
        displayName: profileData.displayName,
        photoURL: profileData.photoURL || null,
        role: profileData.role,
        quartier: profileData.quartier,
        createdAt: serverTimestamp(),
        // serverTimestamp() = timestamp côté serveur (évite les décalages d'horloge)
        updatedAt: serverTimestamp(),
      });

      // 2. Si role = "provider" ou "both" → créer le doc provider
      // ──────────────────────────────────────────────────────────
      if (profileData.role === "provider" || profileData.role === "both") {
        const providerRef = doc(db, "providers", user.uid);
        await setDoc(providerRef, {
          services: profileData.services || [],
          isAvailable: false,
          // Par défaut, le prestataire est hors ligne
          // Il devra activer sa disponibilité manuellement

          rating: 0,
          reviewCount: 0,
          completedJobs: 0,
          isPremium: false,
          isVerified: false,

          location: null,
          // GeoPoint sera ajouté quand le prestataire activera sa géolocalisation
          // GeoPoint(lat, lng) permet les requêtes géospatiales Firestore

          hourlyRate: null,
          bio: null,
          portfolio: [],
          // portfolio = tableau d'URLs de photos de travaux réalisés

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // 3. Si role = "client" ou "both" → créer le doc client
      // ──────────────────────────────────────────────────────
      if (profileData.role === "client" || profileData.role === "both") {
        const clientRef = doc(db, "clients", user.uid);
        await setDoc(clientRef, {
          favoriteProviders: [],
          bookingHistory: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

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

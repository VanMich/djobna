// src/hooks/useProfile.js
// Hook pour créer et gérer les profils dans Firestore
// Utilisé dans ProfileSetupScreen.js

import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../config/firebase";

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────
  // Créer le profil utilisateur dans Firestore
  // profileData : { displayName, quartier, photoURL, role, services? }
  // ─────────────────────────────────────────
  const createProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté");

      // 1. Document commun dans users/
      await setDoc(doc(db, "users", user.uid), {
        phoneNumber: user.phoneNumber,
        displayName: profileData.displayName,
        photoURL: profileData.photoURL || null,
        role: profileData.role,
        quartier: profileData.quartier,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Document prestataire dans providers/
      if (profileData.role === "provider" || profileData.role === "both") {
        await setDoc(doc(db, "providers", user.uid), {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL || null,
          quartier: profileData.quartier,
          services: profileData.services || [],
          isAvailable: false,
          rating: 0,
          reviewCount: 0,
          completedJobs: 0,
          isPremium: false,
          isVerified: false,
          location: null,
          bio: null,
          portfolio: [],
          zones: [profileData.quartier],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // 3. Document client dans clients/
      if (profileData.role === "client" || profileData.role === "both") {
        await setDoc(doc(db, "clients", user.uid), {
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

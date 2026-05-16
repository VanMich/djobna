// src/hooks/useProviderOwnProfile.js
import { useCallback, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";

import { auth, db } from "../config/firebase";

export function useProviderOwnProfile() {
  const [profile, setProfile] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const unsubUser = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
      },
      (err) => {
        console.error("Erreur écoute profil utilisateur:", err);
      },
    );

    const unsubProvider = onSnapshot(
      doc(db, "providers", user.uid),
      (snap) => {
        setProvider(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur écoute profil prestataire:", err);
        setLoading(false);
      },
    );

    return () => {
      unsubUser();
      unsubProvider();
    };
  }, [user?.uid]);

  const updateProfile = useCallback(
    async (data) => {
      if (!user) return { success: false };

      try {
        if (data.displayName || data.quartier || data.bio !== undefined) {
          await updateDoc(doc(db, "users", user.uid), {
            ...(data.displayName && { displayName: data.displayName }),
            ...(data.quartier && { quartier: data.quartier }),
            updatedAt: serverTimestamp(),
          });
        }

        await updateDoc(doc(db, "providers", user.uid), {
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.services !== undefined && { services: data.services }),
          ...(data.zones !== undefined && { zones: data.zones }),
          ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
          updatedAt: serverTimestamp(),
        });

        return { success: true };
      } catch (err) {
        console.error("Erreur mise à jour profil:", err);
        return { success: false };
      }
    },
    [user],
  );

  const addPortfolioPhoto = useCallback(async () => {
    if (!user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      await updateDoc(doc(db, "providers", user.uid), {
        portfolio: arrayUnion(uri),
        updatedAt: serverTimestamp(),
      });
    }
  }, [user]);

  const removePortfolioPhoto = useCallback(
    async (uri) => {
      if (!user) return;

      await updateDoc(doc(db, "providers", user.uid), {
        portfolio: arrayRemove(uri),
        updatedAt: serverTimestamp(),
      });
    },
    [user],
  );

  const addZone = useCallback(
    async (zone) => {
      if (!user || !zone) return;

      await updateDoc(doc(db, "providers", user.uid), {
        zones: arrayUnion(zone),
        updatedAt: serverTimestamp(),
      });
    },
    [user],
  );

  const removeZone = useCallback(
    async (zone) => {
      if (!user) return;

      await updateDoc(doc(db, "providers", user.uid), {
        zones: arrayRemove(zone),
        updatedAt: serverTimestamp(),
      });
    },
    [user],
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erreur déconnexion:", err);
    }
  }, []);

  return {
    profile,
    provider,
    loading,
    updateProfile,
    addPortfolioPhoto,
    removePortfolioPhoto,
    addZone,
    removeZone,
    logout,
  };
}

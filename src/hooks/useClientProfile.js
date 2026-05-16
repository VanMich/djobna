// src/hooks/useClientProfile.js
import { useCallback, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

const initialStats = {
  missionsCount: 0,
  favoritesCount: 0,
  reviewsGiven: 0,
};

export function useClientProfile() {
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setFavorites([]);
      setHistory([]);
      setStats(initialStats);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      async (snap) => {
        if (!active) return;

        if (!snap.exists()) {
          setProfile(null);
          setFavorites([]);
          setStats((prev) => ({ ...prev, favoritesCount: 0 }));
          setLoading(false);
          return;
        }

        setProfile({ id: snap.id, ...snap.data() });

        try {
          const clientSnap = await getDoc(doc(db, "clients", user.uid));
          if (!active) return;

          if (!clientSnap.exists()) {
            setFavorites([]);
            setStats((prev) => ({ ...prev, favoritesCount: 0 }));
            setLoading(false);
            return;
          }

          const favIds = clientSnap.data().favoriteProviders || [];
          const favProfiles = await Promise.all(
            favIds.map(async (id) => {
              try {
                const [userSnap, providerSnap] = await Promise.all([
                  getDoc(doc(db, "users", id)),
                  getDoc(doc(db, "providers", id)),
                ]);

                if (!userSnap.exists()) return null;

                return {
                  id,
                  ...userSnap.data(),
                  ...(providerSnap.exists() ? providerSnap.data() : {}),
                };
              } catch (err) {
                console.error("Erreur chargement favori:", err);
                return null;
              }
            }),
          );

          if (!active) return;

          setFavorites(favProfiles.filter(Boolean));
          setStats((prev) => ({
            ...prev,
            favoritesCount: favIds.length,
          }));
        } catch (err) {
          console.error("Erreur chargement profil client:", err);
          setFavorites([]);
          setStats((prev) => ({ ...prev, favoritesCount: 0 }));
        } finally {
          if (active) setLoading(false);
        }
      },
      (err) => {
        console.error("Erreur écoute profil client:", err);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const requestsQuery = query(
      collection(db, "requests"),
      where("clientId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
          const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
          return bTime - aTime;
        });

        setHistory(data);
        setStats((prev) => ({
          ...prev,
          missionsCount: data.filter((d) => d.status === "done").length,
        }));
      },
      (err) => {
        console.error("Erreur écoute historique client:", err);
        setHistory([]);
        setStats((prev) => ({ ...prev, missionsCount: 0 }));
      },
    );

    return () => unsubscribe();
  }, [user]);

  const removeFavorite = useCallback(
    async (providerId) => {
      if (!user) return;

      try {
        await updateDoc(doc(db, "clients", user.uid), {
          favoriteProviders: arrayRemove(providerId),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Erreur suppression favori:", err);
      }
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
    favorites,
    history,
    stats,
    loading,
    removeFavorite,
    logout,
  };
}

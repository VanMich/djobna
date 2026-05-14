// src/hooks/useProviderDashboard.js
// Hook central du dashboard prestataire
// Gère : disponibilité, demandes, missions en cours, stats

import { useState, useEffect, useCallback } from "react";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import * as Location from "expo-location";
import { db, auth } from "../config/firebase";

export function useProviderDashboard() {
  const [provider, setProvider] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [requests, setRequests] = useState([]);
  const [missions, setMissions] = useState([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    rating: 0,
    monthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  // ── Charger le profil prestataire ─────────
  useEffect(() => {
    if (!user) return;

    const provRef = doc(db, "providers", user.uid);
    const unsubscribe = onSnapshot(provRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProvider({ id: snap.id, ...data });
        setIsAvailable(data.isAvailable || false);
        setStats({
          todayCount: data.todayCount || 0,
          rating: data.rating || 0,
          monthRevenue: data.monthRevenue || 0,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ── Écouter les demandes entrantes ─────────
  // Une "demande" = un document dans la collection 'requests'
  // avec status: 'pending' et providerId: user.uid
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "requests"),
      where("providerId", "==", user.uid),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Trier par date décroissante (plus récent en premier)
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRequests(data);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ── Écouter les missions en cours ──────────
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "requests"),
      where("providerId", "==", user.uid),
      where("status", "in", ["accepted", "in_progress"]),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMissions(data);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ── Toggle disponibilité ───────────────────
  const toggleAvailability = useCallback(
    async (newValue) => {
      if (!user) return;

      try {
        const updateData = {
          isAvailable: newValue,
          updatedAt: serverTimestamp(),
        };

        // Si le prestataire se rend disponible → récupérer sa position GPS
        if (newValue) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            // Stocker la position dans Firestore
            // GeoPoint n'existe pas directement en JS Firebase SDK
            // On stocke latitude/longitude séparément
            updateData.location = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
          }
        } else {
          // Si hors ligne → effacer la position
          updateData.location = null;
        }

        await updateDoc(doc(db, "providers", user.uid), updateData);
        setIsAvailable(newValue);
      } catch (err) {
        console.error("Erreur toggle disponibilité:", err);
      }
    },
    [user?.uid],
  );

  // ── Accepter une demande ───────────────────
  const acceptRequest = useCallback(
    async (requestId, clientId) => {
      if (!user) return;

      try {
        await updateDoc(doc(db, "requests", requestId), {
          status: "accepted",
          updatedAt: serverTimestamp(),
        });

        // Incrémenter le compteur du jour
        await updateDoc(doc(db, "providers", user.uid), {
          todayCount: (stats.todayCount || 0) + 1,
          updatedAt: serverTimestamp(),
        });

        return { success: true, clientId };
      } catch (err) {
        console.error("Erreur acceptation demande:", err);
        return { success: false };
      }
    },
    [user?.uid, stats.todayCount],
  );

  // ── Décliner une demande ───────────────────
  const declineRequest = useCallback(
    async (requestId) => {
      if (!user) return;

      try {
        await updateDoc(doc(db, "requests", requestId), {
          status: "declined",
          updatedAt: serverTimestamp(),
        });
        return { success: true };
      } catch (err) {
        console.error("Erreur déclin demande:", err);
        return { success: false };
      }
    },
    [user?.uid],
  );

  return {
    provider,
    isAvailable,
    requests,
    missions,
    stats,
    loading,
    toggleAvailability,
    acceptRequest,
    declineRequest,
  };
}

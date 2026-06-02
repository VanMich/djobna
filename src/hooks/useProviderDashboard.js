// src/hooks/useProviderDashboard.js
//
// Remplace Firebase :
//   auth.currentUser                        → supabase.auth.getUser() (async)
//   onSnapshot(doc(db,'providers',uid))     → fetch + Realtime channel providers
//   onSnapshot(query(collection(db,'requests'),
//     where('providerId','==',uid),
//     where('status','==','pending')))       → fetch + Realtime channel requests
//   idem pour 'in_progress' (missions)
//   updateDoc(doc(db,'providers',uid))      → supabase.from('providers').update()
//   serverTimestamp()                       → new Date().toISOString()
//   getDatabase() + ref() + set() (RTDB)   → supabase.from('chats').upsert()
//   location: { latitude, longitude }      → colonnes séparées latitude / longitude
//   todayCount → today_count | monthRevenue → month_revenue | providerId → provider_id

import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import { supabase, pushNotify } from "../config/supabase";

// Mapping snake_case DB → camelCase pour les composants UI
function mapRequest(r) {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name,
    providerId: r.provider_id,
    service: r.service,
    title: r.title,
    description: r.description,
    location: r.location,
    scheduledDate: r.scheduled_date,
    budget: r.budget,
    photos: r.photos || [],
    status: r.status,
    quartier: r.quartier,
    // null tant que le prestataire n'a pas déclaré la fin (double confirmation)
    providerCompletedAt: r.provider_completed_at ? new Date(r.provider_completed_at).getTime() : null,
    // Convertit l'ISO string en millisecondes pour la fonction timeAgo de RequestCard
    createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
  };
}

export function useProviderDashboard() {
  const [userId, setUserId] = useState(null); // null = chargement en cours
  const [provider, setProvider] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [requests, setRequests] = useState([]);       // requêtes en attente (pending)
  const [missions, setMissions] = useState([]);       // missions en cours (in_progress)
  const [completedMissions, setCompletedMissions] = useState([]); // missions terminées aujourd'hui
  const [stats, setStats] = useState({ todayCount: 0, rating: 0, monthRevenue: 0, walletBalance: 0 });
  const [loading, setLoading] = useState(true);

  // Récupère l'uid au montage — remplace auth.currentUser (synchrone Firebase)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? ""); // "" = non connecté
    });
  }, []);

  // ── Profil prestataire ─────────────────────────────────────────────────────
  // Remplace onSnapshot(doc(db, 'providers', uid))
  useEffect(() => {
    if (userId === null) return; // encore en chargement
    if (!userId) { setLoading(false); return; }

    const fetchProvider = async () => {
      const { data } = await supabase
        .from("providers")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        // Mapping snake_case → camelCase
        setProvider({
          id: userId,
          displayName: data.display_name,
          photoURL: data.photo_url,
          bio: data.bio,
          services: data.services || [],
          availability: data.availability,
          verificationStatus: data.verification_status,
          rating: {
            global: data.rating_global || 0,
            punctuality: data.rating_punctuality || 0,
            quality: data.rating_quality || 0,
            communication: data.rating_communication || 0,
            valueForMoney: data.rating_value_for_money || 0,
          },
          reviewCount: data.review_count || 0,
          walletBalance: data.wallet_balance || 0,
          subscription: {
            plan: data.subscription_plan || "classic",
            expiresAt: data.subscription_expires_at || null,
            trialUsed: data.trial_used || false,
          },
        });
        setIsAvailable(data.availability || false);
        const rating = data.rating_global || 0;
        setStats({
          todayCount: data.today_count || 0,       // today_count → todayCount
          rating,
          monthRevenue: data.month_revenue || 0,   // month_revenue → monthRevenue
          walletBalance: data.wallet_balance || 0, // wallet_balance → walletBalance (solde dispo §13.1)
        });
      }
      setLoading(false);
    };

    fetchProvider();

    // Realtime : écoute les modifications du profil prestataire
    const providerChannel = supabase
      .channel(`dashboard-provider-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "providers",
        filter: `id=eq.${userId}`,
      }, fetchProvider)
      .subscribe();

    return () => supabase.removeChannel(providerChannel);
  }, [userId]);

  // ── Demandes + missions ────────────────────────────────────────────────────
  // Remplace les deux onSnapshot sur les queries Firestore (pending + in_progress)
  // Un seul canal Realtime suffit (filtré sur provider_id) — les deux fetches sont
  // déclenchés à chaque changement car on ne peut pas filtrer par status dans
  // postgres_changes.
  useEffect(() => {
    if (!userId) return;

    // ── Nouvelles demandes à traiter (statut "pending") ──
    const fetchRequests = async () => {
      const { data } = await supabase
        .from("requests")
        .select("*")
        .eq("provider_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setRequests((data || []).map(mapRequest));
    };

    // ── Missions acceptées, travaux en cours (statut "in_progress") ──
    const fetchMissions = async () => {
      const { data } = await supabase
        .from("requests")
        .select("*")
        .eq("provider_id", userId)
        .eq("status", "in_progress");
      setMissions((data || []).map(mapRequest));
    };

    // ── Missions terminées aujourd'hui (statut "completed", §13.1) ──
    // On filtre par updated_at >= début de la journée courante
    const fetchCompletedToday = async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("requests")
        .select("*")
        .eq("provider_id", userId)
        .eq("status", "completed")
        .gte("updated_at", startOfDay.toISOString());
      setCompletedMissions((data || []).map(mapRequest));
    };

    fetchRequests();
    fetchMissions();
    fetchCompletedToday();

    // Un seul canal Realtime suffit — toute modification sur requests du prestataire
    // déclenche le rechargement des 3 listes
    const requestsChannel = supabase
      .channel(`dashboard-requests-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "requests",
        filter: `provider_id=eq.${userId}`,
      }, () => {
        fetchRequests();
        fetchMissions();
        fetchCompletedToday();
      })
      .subscribe();

    return () => supabase.removeChannel(requestsChannel);
  }, [userId]);

  // ── Toggle disponibilité ───────────────────────────────────────────────────
  // Remplace updateDoc(doc(db,'providers',uid), { availability, location })
  // location: { latitude, longitude } (Firebase) → colonnes séparées (PostgreSQL)
  const toggleAvailability = useCallback(
    async (newValue) => {
      if (!userId) return;
      try {
        const updateData = {
          availability: newValue,
          updated_at: new Date().toISOString(), // serverTimestamp() → ISO string
        };

        if (newValue) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            updateData.location = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          }
        } else {
          updateData.location = { latitude: null, longitude: null };
        }

        await supabase.from("providers").update(updateData).eq("id", userId);
        setIsAvailable(newValue);
      } catch (err) {
        console.error("Erreur toggle disponibilité:", err);
      }
    },
    [userId],
  );

  // ── Accepter une demande ───────────────────────────────────────────────────
  // Remplace :
  //   updateDoc(doc(db,'requests',id))  → supabase.from('requests').update()
  //   updateDoc(doc(db,'providers',id)) → supabase.from('providers').update()
  //   set(ref(database,'chats/.../meta'), ...) [RTDB] → supabase.from('chats').upsert()
  const acceptRequest = useCallback(
    async (requestId, clientId) => {
      if (!userId) return { success: false };
      try {
        const now = new Date().toISOString();

        await supabase
          .from("requests")
          .update({ status: "in_progress", updated_at: now })
          .eq("id", requestId);

        const { data: chatRow, error: chatError } = await supabase
          .from("chats")
          .upsert({
            provider_id: userId,
            client_id: clientId,
            request_id: requestId,
            last_message: "✅ Demande acceptée",
            last_message_at: now,
          }, { onConflict: "request_id" })
          .select("id")
          .single();

        if (chatError) throw chatError;

        await supabase.from("messages").insert({
          chat_id: chatRow.id,
          sender_id: userId,
          type: "system",
          text: "✅ Demande acceptée",
          created_at: now,
        });

        pushNotify(clientId, "✅ Demande acceptée", "Votre demande a été acceptée ! Consultez vos messages.", { persist: true, type: "request_accepted", relatedId: requestId });

        return { success: true, chatId: chatRow.id };
      } catch (err) {
        console.error("Erreur acceptation demande:", err);
        return { success: false };
      }
    },
    [userId],
  );

  // ── Décliner une demande ───────────────────────────────────────────────────
  const declineRequest = useCallback(
    async (requestId, clientId) => {
      if (!userId) return { success: false };
      try {
        await supabase
          .from("requests")
          .update({ status: "declined", updated_at: new Date().toISOString() })
          .eq("id", requestId);

        if (clientId) {
          pushNotify(clientId, "❌ Demande déclinée", "Votre demande a été déclinée. Essayez un autre prestataire.", { persist: true, type: "request_declined", relatedId: requestId });
        }

        return { success: true };
      } catch (err) {
        console.error("Erreur déclin demande:", err);
        return { success: false };
      }
    },
    [userId],
  );

  // ── Déclarer une mission terminée (double confirmation, §11.4) ─────────────
  // Le prestataire DÉCLARE avoir fini → on horodate provider_completed_at.
  // Le statut reste "in_progress" : c'est le CLIENT qui clôture en confirmant.
  const completeRequest = useCallback(
    async (requestId, clientId) => {
      if (!userId) return { success: false };
      try {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from("requests")
          .update({
            provider_completed_at: now,
            updated_at: now,
          })
          .eq("id", requestId);
        if (error) throw error;

        // Message système dans le chat lié à cette demande
        const { data: chatData } = await supabase
          .from("chats")
          .select("id")
          .eq("request_id", requestId)
          .maybeSingle();

        if (chatData) {
          await supabase.from("messages").insert({
            chat_id: chatData.id,
            sender_id: userId,
            type: "system",
            text: "🏁 Prestation terminée — en attente de confirmation du client",
            read: false,
            created_at: now,
          });
          await supabase
            .from("chats")
            .update({ last_message: "Prestation terminée", last_message_at: now })
            .eq("id", chatData.id);
        }

        if (clientId) pushNotify(clientId, "Mission terminée ?", "Le prestataire indique avoir terminé. Confirme pour clôturer.", { persist: true, type: "mission_complete", relatedId: requestId });

        return { success: true };
      } catch (err) {
        console.error("Erreur déclaration fin de mission:", err);
        return { success: false };
      }
    },
    [userId],
  );

  return {
    provider,
    isAvailable,
    requests,
    missions,
    completedMissions,   // missions terminées aujourd'hui (§13.1 Bloc terminées)
    stats,
    loading,
    toggleAvailability,
    acceptRequest,
    declineRequest,
    completeRequest,     // "J'ai terminé" → déclare la fin (le client confirme)
  };
}

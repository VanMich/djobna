// src/hooks/useReviews.js
//
// Gère les avis clients sur les prestataires (§15).
//
// Fonctions exposées :
//   reviews          — liste des avis reçus par le prestataire (temps réel)
//   loading          — chargement initial
//   checkCanReview   — vérifie si le client connecté peut noter ce prestataire
//                      (condition : mission completed + pas encore d'avis)
//   submitReview     — soumet un avis dans la table "reviews"
//
// Note §15.4 : le recalcul de providers.rating (note agrégée) sera géré par
// une fonction/trigger Supabase côté back-office lors de l'implémentation de §4.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../config/supabase";

// Mapping snake_case DB → camelCase UI
function mapReview(r) {
  return {
    id:            r.id,
    requestId:     r.request_id,
    clientId:      r.client_id,
    providerId:    r.provider_id,
    ratedBy:       r.rated_by,
    globalRating:  r.global_rating,
    punctuality:   r.punctuality    || 0,
    quality:       r.quality        || 0,
    communication: r.communication  || 0,
    valueForMoney: r.value_for_money|| 0,
    comment:       r.comment        || "",
    providerReply: r.provider_reply || "",
    authorName:    r.author_name    || "Client",
    createdAt:     r.created_at,
    // Champs compatibles avec le composant ReviewItem de ReviewsTab
    rating: r.global_rating,
    date:   r.created_at
      ? new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "",
  };
}

export function useReviews(providerId) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charge les avis et s'abonne aux nouvelles soumissions en temps réel
  useEffect(() => {
    if (!providerId) { setLoading(false); return; }

    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("provider_id", providerId)
        .eq("rated_by", "client")
        .order("created_at", { ascending: false });

      setReviews((data || []).map(mapReview));
      setLoading(false);
    };

    fetchReviews();

    // Realtime : nouvel avis soumis → mise à jour instantanée de la liste
    const channel = supabase
      .channel(`reviews-provider-${providerId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "reviews",
        filter: `provider_id=eq.${providerId}`,
      }, fetchReviews)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [providerId]);

  // Vérifie si le client connecté peut noter ce prestataire.
  // Conditions cumulatives :
  //   1. Il existe au moins une mission "completed" entre le client et ce prestataire
  //   2. Aucun avis n'a encore été soumis pour cette mission
  const checkCanReview = useCallback(async (clientId) => {
    if (!clientId || !providerId) return { canReview: false };

    // Cherche une mission terminée entre ce client et ce prestataire
    const { data: completedRequests } = await supabase
      .from("requests")
      .select("id")
      .eq("client_id", clientId)
      .eq("provider_id", providerId)
      .eq("status", "completed")
      .limit(1);

    if (!completedRequests?.length) return { canReview: false };

    const requestId = completedRequests[0].id;

    // Vérifie si un avis client existe déjà pour cette mission
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("request_id", requestId)
      .eq("rated_by", "client")
      .maybeSingle();

    return { canReview: !existing, requestId };
  }, [providerId]);

  // Soumet un avis dans la table reviews.
  // Le recalcul de providers.rating est délégué à un trigger Supabase (§4 back-office).
  const submitReview = useCallback(async ({
    requestId,
    clientId,
    globalRating,
    punctuality,
    quality,
    communication,
    valueForMoney,
    comment,
    authorName,
  }) => {
    try {
      const { error } = await supabase.from("reviews").insert({
        request_id:      requestId,
        client_id:       clientId,
        provider_id:     providerId,
        rated_by:        "client",
        global_rating:   globalRating,
        punctuality:     punctuality   || globalRating,
        quality:         quality       || globalRating,
        communication:   communication || globalRating,
        value_for_money: valueForMoney || globalRating,
        comment:         comment       || "",
        author_name:     authorName    || "Client",
      });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Erreur soumission avis:", err);
      return { success: false };
    }
  }, [providerId]);

  // Prestataire répond à un avis client (§15.2)
  const replyToReview = useCallback(async (reviewId, reply) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ provider_reply: reply })
        .eq("id", reviewId);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Erreur réponse avis:", err);
      return { success: false };
    }
  }, []);

  return { reviews, loading, checkCanReview, submitReview, replyToReview };
}

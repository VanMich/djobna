// src/hooks/useServiceRequest.js
//
// Remplace Firebase :
//   auth.currentUser                  → supabase.auth.getUser() (async)
//   getDoc(doc(db,'users',uid))       → supabase.from('users').select().eq('id',uid).single()
//   userData.displayName              → userData.display_name
//   addDoc(collection(db,'requests')) → supabase.from('requests').insert()
//   Date.now() / serverTimestamp()    → new Date().toISOString()
//   camelCase Firestore               → snake_case PostgreSQL

import { useState } from "react";
import { supabase } from "../config/supabase";

export function useServiceRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitRequest = async ({
    providerId,
    service,
    title,
    description,
    location,
    scheduledDate,
    budget,
    photos,
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Remplace auth.currentUser (synchrone Firebase)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      // Récupère le nom et quartier du client
      // Remplace getDoc(doc(db,'users',user.uid))
      const { data: userData } = await supabase
        .from("users")
        .select("display_name, quartier")  // display_name remplace displayName
        .eq("id", user.id)                 // user.id = user.uid Firebase
        .single();

      const now = new Date().toISOString(); // remplace serverTimestamp() / Date.now()

      const { error: insertError } = await supabase.from("requests").insert({
        client_id: user.id,
        client_name: userData?.display_name || "Client",
        quartier: userData?.quartier || "",
        provider_id: providerId,
        service,
        title,
        description,
        location,
        scheduled_date: scheduledDate || null,
        budget: budget ? Number(budget) : null,
        photos: photos || [],
        status: "pending",
        created_at: now,
        updated_at: now,
      });
      if (insertError) throw insertError;

      return { success: true };
    } catch (err) {
      console.error("Erreur soumission demande:", err);
      setError("Impossible d'envoyer la demande. Réessayez.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { submitRequest, loading, error };
}

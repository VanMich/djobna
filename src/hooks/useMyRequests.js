import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";

function mapRequest(r) {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name,
    providerId: r.provider_id,
    providerName: r.providers?.display_name || null,
    providerPhoto: r.providers?.photo_url || null,
    service: r.service,
    title: r.title,
    description: r.description,
    location: r.location,
    scheduledDate: r.scheduled_date,
    budget: r.budget,
    photos: r.photos || [],
    status: r.status,
    quartier: r.quartier,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
  };
}

export function useMyRequests() {
  const [userId, setUserId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (userId === null) return;
    if (!userId) { setLoading(false); return; }

    const fetchRequests = async () => {
      const { data } = await supabase
        .from("requests")
        .select("*, providers:provider_id(display_name, photo_url)")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });
      setRequests((data || []).map(mapRequest));
      setLoading(false);
    };

    fetchRequests();

    const channel = supabase
      .channel(`my-requests-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "requests",
        filter: `client_id=eq.${userId}`,
      }, fetchRequests)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  return { requests, loading };
}

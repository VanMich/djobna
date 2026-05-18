// src/hooks/useUnreadCount.js
// Compte le total des messages non lus pour l'utilisateur courant.
// Utilisé dans les tab navigators pour afficher le badge sur l'onglet Messages.
import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";

export function useUnreadCount() {
  const [userId, setUserId] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const { count: n } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("read", false)
        .neq("sender_id", userId);
      setCount(n || 0);
    };

    fetch();

    const channel = supabase
      .channel(`unread-count-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetch)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  return count;
}

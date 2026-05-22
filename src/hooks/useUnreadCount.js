// src/hooks/useUnreadCount.js
// Compte le total des messages non lus pour l'utilisateur courant.
// Utilisé dans les tab navigators pour afficher le badge sur l'onglet Messages.
import { useEffect, useRef, useState } from "react";
import { supabase } from "../config/supabase";

export function useUnreadCount() {
  const [userId, setUserId] = useState(null);
  const [count, setCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && mountedRef.current) { setUserId(session.user.id); return; }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, sess) => {
        if (sess?.user?.id && mountedRef.current) { setUserId(sess.user.id); subscription.unsubscribe(); }
      });
    };
    init();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchCount = async () => {
      try {
        // 1. Récupère les IDs des chats de l'utilisateur
        const { data: userChats, error: chatsErr } = await supabase
          .from("chats")
          .select("id")
          .or(`client_id.eq.${userId},provider_id.eq.${userId}`);

        if (chatsErr) {
          console.error("useUnreadCount — erreur fetch chats:", chatsErr.message);
          return;
        }

        const chatIds = (userChats || []).map((c) => c.id);
        if (chatIds.length === 0) {
          if (mountedRef.current) setCount(0);
          return;
        }

        // 2. Compte les messages non lus dans ces chats
        const { count: n, error: msgErr } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("chat_id", chatIds)
          .eq("read", false)
          .neq("sender_id", userId);

        if (msgErr) {
          console.error("useUnreadCount — erreur count messages:", msgErr.message);
          return;
        }

        if (mountedRef.current) setCount(n || 0);
      } catch (err) {
        console.error("useUnreadCount — erreur inattendue:", err);
      }
    };

    fetchCount();

    // Écoute les INSERT (nouveau message) et UPDATE (marquage lu) uniquement
    const channel = supabase
      .channel(`unread-count-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchCount)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, fetchCount)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  return count;
}

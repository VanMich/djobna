// src/hooks/useUnreadCount.js
// Compte le total des messages non lus pour l'utilisateur courant.
// Utilisé dans les tab navigators pour afficher le badge sur l'onglet Messages.
import { useEffect, useRef, useState } from "react";
import { supabase } from "../config/supabase";

export function useUnreadCount() {
  const [userId, setUserId] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [count, setCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && mountedRef.current) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from("users")
          .select("active_role")
          .eq("id", session.user.id)
          .single();
        if (mountedRef.current) setActiveRole(data?.active_role || "client");
        return;
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, sess) => {
        if (sess?.user?.id && mountedRef.current) {
          setUserId(sess.user.id);
          const { data } = await supabase
            .from("users")
            .select("active_role")
            .eq("id", sess.user.id)
            .single();
          if (mountedRef.current) setActiveRole(data?.active_role || "client");
          subscription.unsubscribe();
        }
      });
    };
    init();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!userId || !activeRole) return;

    const fetchCount = async () => {
      try {
        const roleColumn = activeRole === "provider" ? "provider_id" : "client_id";
        const { data: userChats, error: chatsErr } = await supabase
          .from("chats")
          .select("id")
          .eq(roleColumn, userId);

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

    // Écoute les INSERT (nouveau message) et UPDATE (marquage lu) uniquement.
    // Filtre aussi les chats par rôle pour ne réagir qu'aux changements pertinents.
    const channel = supabase
      .channel(`unread-count-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchCount)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "messages",
        filter: `read=eq.true`,
      }, fetchCount)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, activeRole]);

  return count;
}

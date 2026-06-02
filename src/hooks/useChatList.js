import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../config/supabase";

export function useChatList() {
  const [userId, setUserId] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // ── 1. Récupérer userId + activeRole ──────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mountedRef.current) return;
      if (session?.user?.id) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from("users")
          .select("active_role")
          .eq("id", session.user.id)
          .single();
        if (mountedRef.current) setActiveRole(data?.active_role || "client");
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
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
        setTimeout(() => {
          if (mountedRef.current && !userId) {
            setUserId("");
            subscription.unsubscribe();
          }
        }, 3000);
      }
    };

    initUser();
    return () => { mountedRef.current = false; };
  }, []);

  // ── 2. Fetch conversations (SANS FK join — plus robuste) ──────────────────
  const fetchConversations = useCallback(async () => {
    if (!userId || !activeRole) return;

    try {
      setError(null);
      // Étape 1 : récupérer les chats filtrés par rôle actif
      const roleColumn = activeRole === "provider" ? "provider_id" : "client_id";
      const { data: chats, error: chatsError } = await supabase
        .from("chats")
        .select("id, provider_id, client_id, request_id, last_message, last_message_at")
        .eq(roleColumn, userId)
        .order("last_message_at", { ascending: false });

      if (chatsError) {
        console.warn("useChatList chats error:", chatsError.message);
        if (mountedRef.current) { setError(chatsError); setLoading(false); }
        return;
      }

      if (!chats || chats.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Étape 2 : récupérer les infos utilisateurs (tous les other users)
      const otherIds = [...new Set(chats.map((c) =>
        c.provider_id === userId ? c.client_id : c.provider_id
      ))];
      const providerIds = [...new Set(chats.map((c) => c.provider_id))];
      const chatIds = chats.map((c) => c.id);

      // Requêtes parallèles — chacune indépendante, aucune ne bloque les autres
      const [usersRes, providersRes, unreadRes, lastSendersRes] = await Promise.all([
        supabase.from("public_users").select("id, display_name, photo_url, role").in("id", otherIds),
        supabase.from("public_providers").select("id, services").in("id", providerIds),
        supabase.from("messages").select("chat_id").in("chat_id", chatIds).eq("read", false).neq("sender_id", userId),
        supabase.from("messages").select("chat_id, sender_id").in("chat_id", chatIds).order("created_at", { ascending: false }).limit(chatIds.length),
      ]);

      // Indexer les résultats
      const usersById = {};
      (usersRes.data || []).forEach((u) => { usersById[u.id] = u; });

      const servicesById = {};
      (providersRes.data || []).forEach((p) => { servicesById[p.id] = p.services; });

      const unreadByChat = {};
      (unreadRes.data || []).forEach((m) => {
        unreadByChat[m.chat_id] = (unreadByChat[m.chat_id] || 0) + 1;
      });

      const lastSenderByChat = {};
      (lastSendersRes.data || []).forEach((m) => {
        if (!lastSenderByChat[m.chat_id]) lastSenderByChat[m.chat_id] = m.sender_id;
      });

      // Étape 3 : construire la liste enrichie
      const enriched = chats.map((chat) => {
        const isProvider = chat.provider_id === userId;
        const otherId = isProvider ? chat.client_id : chat.provider_id;
        const otherData = usersById[otherId];

        return {
          chatId: chat.id,
          requestId: chat.request_id || null,
          otherId,
          otherUser: {
            displayName: otherData?.display_name || "Utilisateur",
            photoURL: otherData?.photo_url || null,
            role: otherData?.role || null,
            services: isProvider ? null : servicesById[chat.provider_id] || null,
          },
          lastMessage: chat.last_message || "",
          lastMessageAt: chat.last_message_at
            ? new Date(chat.last_message_at).getTime()
            : 0,
          lastSenderIsMe: lastSenderByChat[chat.id] === userId,
          unreadCount: unreadByChat[chat.id] || 0,
        };
      });

      if (mountedRef.current) {
        setConversations(enriched);
        setLoading(false);
      }
    } catch (err) {
      console.warn("useChatList unexpected error:", err);
      if (mountedRef.current) { setError(err); setLoading(false); }
    }
  }, [userId, activeRole]);

  // ── 3. Lancer le fetch + Realtime ─────────────────────────────────────────
  useEffect(() => {
    if (userId === null || activeRole === null) return;
    if (!userId) { setLoading(false); return; }

    fetchConversations();

    // Filtre le canal Realtime sur le rôle actif pour ne recevoir que les
    // changements des chats de cet utilisateur (évite un refetch global)
    const roleColumn = activeRole === "provider" ? "provider_id" : "client_id";
    const channel = supabase
      .channel(`chatlist-${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "chats",
        filter: `${roleColumn}=eq.${userId}`,
      }, fetchConversations)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchConversations)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages",
        filter: `read=eq.true`,
      }, fetchConversations)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, activeRole, fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations };
}

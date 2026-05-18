// src/hooks/useChatList.js
//
// Remplace Firebase :
//   auth.currentUser                       → supabase.auth.getUser() (async)
//   getDatabase() + ref('chats') + onValue → supabase.from('chats').select() + Realtime
//   off(chatsRef)                          → supabase.removeChannel()
//   getDoc(doc(firestore,'users',id)) ×N   → JOIN SQL unique (pas de requêtes en boucle)
//   chat.meta?.unreadCount?.[uid]          → count sur table messages (read=false, sender≠moi)
//   lastMessageAt (number)                 → new Date(ISO).getTime()
//   otherUser.displayName                  → display_name → displayName (mapping)

import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";

export function useChatList() {
  const [userId, setUserId] = useState(null); // null = chargement
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupère l'uid courant — remplace auth.currentUser (synchrone Firebase)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (userId === null) return; // encore en chargement
    if (!userId) { setLoading(false); return; }

    const fetchConversations = async () => {
      // Une seule requête avec JOIN — remplace onValue(ref(db,'chats')) + N×getDoc(users)
      // provider:users!provider_id et client:users!client_id = JOIN sur les deux FK
      const { data: chats } = await supabase
        .from("chats")
        .select(`
          id,
          provider_id,
          client_id,
          last_message,
          last_message_at,
          provider:users!provider_id ( display_name, photo_url, role ),
          client:users!client_id    ( display_name, photo_url, role )
        `)
        .or(`provider_id.eq.${userId},client_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (!chats || chats.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Compte les messages non lus en une seule requête
      // Remplace chat.meta?.unreadCount?.[currentUser.uid]
      const chatIds = chats.map((c) => c.id);
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("chat_id")
        .in("chat_id", chatIds)
        .eq("read", false)
        .neq("sender_id", userId);

      // Index des non-lus par chatId — O(n) au lieu de N requêtes
      const unreadByChat = {};
      (unreadMessages || []).forEach((m) => {
        unreadByChat[m.chat_id] = (unreadByChat[m.chat_id] || 0) + 1;
      });

      const enriched = chats.map((chat) => {
        const isProvider = chat.provider_id === userId;
        const otherId = isProvider ? chat.client_id : chat.provider_id;
        const otherData = isProvider ? chat.client : chat.provider;

        return {
          chatId: chat.id,
          otherId,
          // Mapping snake_case → camelCase pour compatibilité UI
          otherUser: {
            displayName: otherData?.display_name || "Utilisateur",
            photoURL: otherData?.photo_url || null,
            role: otherData?.role || null,
          },
          lastMessage: chat.last_message || "",
          // Convertit ISO string → millisecondes (tri + affichage temps)
          lastMessageAt: chat.last_message_at
            ? new Date(chat.last_message_at).getTime()
            : 0,
          unreadCount: unreadByChat[chat.id] || 0,
        };
      });

      setConversations(enriched);
      setLoading(false);
    };

    fetchConversations();

    // Realtime : écoute les modifications de la liste de conversations
    // Remplace onValue(ref(database,'chats'), callback) + off(chatsRef)
    const channel = supabase
      .channel(`chatlist-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chats",
      }, fetchConversations)
      // Un nouveau message met aussi à jour les compteurs de non-lus
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, fetchConversations)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  return { conversations, loading };
}

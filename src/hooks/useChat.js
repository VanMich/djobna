// src/hooks/useChat.js
//
// Remplace Firebase RTDB :
//   auth.currentUser                       → supabase.auth.getUser() (async)
//   getChatId(uid1,uid2)                   → query SQL sur chats (provider_id,client_id)
//   onValue(ref(db,'chats/id/messages'))   → Realtime channel sur table messages
//   push(messagesRef, message)             → supabase.from('messages').insert()
//   update(ref(db,'chats/id/meta'),{...})  → supabase.from('chats').update()
//   update unreadCount                     → update messages.read = true
//   off(messagesRef)                       → supabase.removeChannel()
//   message.senderId                       → sender_id → senderId (mapMessage)

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../config/supabase";

// Mapping snake_case DB → camelCase pour les composants UI
function mapMessage(m) {
  return {
    id: m.id,
    text: m.text || null,
    senderId: m.sender_id,             // sender_id → senderId
    type: m.type || "text",
    // Convertit ISO string → millisecondes (compatibilité showDate dans ChatScreen)
    createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
    read: m.read,
    devis: m.devis || null,
  };
}

export function useChat(otherUserId) {
  const [userId, setUserId] = useState(null); // null = chargement
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── 1. Récupère l'uid courant ─────────────────────────────────────────────
  // Remplace auth.currentUser (synchrone Firebase)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? "");
    });
  }, []);

  // ── 2. Trouve ou crée la conversation ────────────────────────────────────
  // Remplace getChatId(uid1, uid2) — Supabase utilise un UUID dans la table chats
  useEffect(() => {
    if (!userId || !otherUserId) return;

    (async () => {
      // Cherche une conversation existante dans les deux sens (provider↔client)
      const { data: existing } = await supabase
        .from("chats")
        .select("id")
        .or(
          `and(provider_id.eq.${userId},client_id.eq.${otherUserId}),` +
          `and(provider_id.eq.${otherUserId},client_id.eq.${userId})`
        )
        .maybeSingle();

      if (existing) {
        setChatId(existing.id);
        return;
      }

      // Aucune conversation existante — en crée une
      // On détermine qui est prestataire à partir de active_role
      const { data: myData } = await supabase
        .from("users")
        .select("active_role, role")
        .eq("id", userId)
        .single();

      const activeRole = myData?.active_role || myData?.role || "client";
      const iAmProvider = activeRole === "provider" || activeRole === "both";
      const now = new Date().toISOString();

      const { data: newChat } = await supabase
        .from("chats")
        .insert({
          provider_id: iAmProvider ? userId : otherUserId,
          client_id: iAmProvider ? otherUserId : userId,
          last_message: "",
          last_message_at: now,
          created_at: now,
        })
        .select("id")
        .single();

      if (newChat) setChatId(newChat.id);
    })();
  }, [userId, otherUserId]);

  // ── 3. Charge les messages et s'abonne aux changements Realtime ──────────
  // Remplace onValue(messagesRef, callback) + off(messagesRef)
  useEffect(() => {
    if (!chatId || !userId) {
      // userId chargé mais pas encore de chatId → pas de loader infini
      if (userId !== null && !otherUserId) setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      setMessages((data || []).map(mapMessage));
      setLoading(false);
    };

    // Marque comme lu les messages de l'interlocuteur
    // Remplace update(ref(db,'chats/id/meta/unreadCount'), { [uid]: 0 })
    const markRead = async () => {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("chat_id", chatId)
        .eq("read", false)
        .neq("sender_id", userId);
    };

    fetchMessages();
    markRead();

    const channel = supabase
      .channel(`chat-${chatId}`)
      // Nouveau message reçu
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, mapMessage(payload.new)]);
        markRead();
      })
      // Mise à jour d'un message (ex : statut devis accepté/refusé)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.new.id ? mapMessage(payload.new) : m))
        );
      })
      .subscribe();

    return () => supabase.removeChannel(channel); // remplace off(messagesRef)
  }, [chatId, userId, otherUserId]);

  // ── Envoyer un message texte ──────────────────────────────────────────────
  // Remplace push(messagesRef, message) + update(meta)
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !userId || !chatId) return;
      const now = new Date().toISOString();

      await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: userId,           // senderId → sender_id
        text: text.trim(),
        type: "text",
        read: false,
        created_at: now,
      });

      // Met à jour le résumé de la conversation
      await supabase.from("chats").update({
        last_message: text.trim(),   // lastMessage → last_message
        last_message_at: now,        // lastMessageAt → last_message_at
      }).eq("id", chatId);
    },
    [userId, chatId],
  );

  // ── Envoyer un devis ──────────────────────────────────────────────────────
  // Remplace push(messagesRef, { type:'devis', devis:{...} })
  // devis stocké en colonne JSONB dans la table messages
  const sendDevis = useCallback(
    async (devisData) => {
      if (!userId || !chatId) return;
      const now = new Date().toISOString();

      await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: userId,
        type: "devis",
        read: false,
        devis: {
          title: devisData.title,
          price: devisData.price,
          description: devisData.description,
          status: "pending",
        },
        created_at: now,
      });

      await supabase.from("chats").update({
        last_message: `Devis : ${devisData.price} FCFA`,
        last_message_at: now,
      }).eq("id", chatId);
    },
    [userId, chatId],
  );

  // ── Répondre à un devis ───────────────────────────────────────────────────
  // Remplace update(ref(db,'chats/id/messages/msgId/devis'), { status })
  // JSONB : fetch + merge + update (PostgreSQL n'a pas d'équivalent de set nested)
  const respondToDevis = useCallback(
    async (messageId, response) => {
      if (!chatId) return;

      const { data } = await supabase
        .from("messages")
        .select("devis")
        .eq("id", messageId)
        .single();

      await supabase.from("messages").update({
        devis: { ...data?.devis, status: response },
      }).eq("id", messageId);
    },
    [chatId],
  );

  return {
    messages,
    loading,
    sendMessage,
    sendDevis,
    respondToDevis,
    chatId,
    currentUserId: userId, // user.uid Firebase → user.id Supabase
  };
}

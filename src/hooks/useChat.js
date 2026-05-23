import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, pushNotify } from "../config/supabase";

function mapMessage(m) {
  return {
    id: m.id,
    text: m.text || null,
    imageUrl: m.image_url || null,
    senderId: m.sender_id,
    type: m.type || "text",
    createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
    read: m.read ?? false,
    delivered: m.delivered ?? false,
    devis: m.devis || null,
    replyTo: m.reply_message
      ? { id: m.reply_message.id, text: m.reply_message.text, senderId: m.reply_message.sender_id, type: m.reply_message.type }
      : null,
    status: m.read ? "read" : m.delivered ? "delivered" : "sent",
  };
}

function mapMessageSimple(m) {
  return {
    id: m.id,
    text: m.text || null,
    imageUrl: m.image_url || null,
    senderId: m.sender_id,
    type: m.type || "text",
    createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
    read: m.read ?? false,
    delivered: m.delivered ?? false,
    devis: m.devis || null,
    replyTo: null,
    status: m.read ? "read" : m.delivered ? "delivered" : "sent",
  };
}

export function useChat(otherUserId, { chatIdParam = null, requestIdParam = null } = {}) {
  const [userId, setUserId] = useState(null);
  const [chatId, setChatId] = useState(chatIdParam);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState(requestIdParam);
  const [requestStatus, setRequestStatus] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const typingTimeoutRef = useRef(null);
  const typingChannelRef = useRef(null);
  // Indique si la résolution du chatId est terminée (évite le flash du vide)
  const chatIdResolvedRef = useRef(!!chatIdParam);

  // ── 1. Current user (getSession = local, pas d'appel réseau) ───────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) { setUserId(session.user.id); return; }
      // Fallback si session pas encore prête
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, sess) => {
        if (sess?.user?.id) { setUserId(sess.user.id); subscription.unsubscribe(); }
      });
    };
    init();
  }, []);

  // ── 2. Resolve chatId ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    if (chatIdParam) {
      chatIdResolvedRef.current = true;
      setChatId(chatIdParam);
      return;
    }

    if (requestIdParam) {
      chatIdResolvedRef.current = false;
      (async () => {
        const { data } = await supabase
          .from("chats").select("id").eq("request_id", requestIdParam).maybeSingle();
        chatIdResolvedRef.current = true;
        if (data) setChatId(data.id);
        else setLoading(false);
      })();
      return;
    }

    if (!otherUserId) {
      chatIdResolvedRef.current = true;
      setLoading(false);
      return;
    }

    chatIdResolvedRef.current = false;
    (async () => {
      const { data: existing } = await supabase
        .from("chats").select("id")
        .or(`and(provider_id.eq.${userId},client_id.eq.${otherUserId}),and(provider_id.eq.${otherUserId},client_id.eq.${userId})`)
        .order("created_at", { ascending: false }).limit(1);
      chatIdResolvedRef.current = true;
      if (existing?.length > 0) setChatId(existing[0].id);
      else setLoading(false);
    })();
  }, [userId, otherUserId, chatIdParam, requestIdParam]);

  // ── 2b. Request status + Realtime ─────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    let reqChannel = null;

    (async () => {
      const { data: chatData } = await supabase
        .from("chats").select("request_id").eq("id", chatId).single();
      if (!chatData?.request_id) return;
      setRequestId(chatData.request_id);

      const { data: reqData } = await supabase
        .from("requests").select("status").eq("id", chatData.request_id).single();
      if (reqData) setRequestStatus(reqData.status);

      reqChannel = supabase
        .channel(`req-status-${chatData.request_id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "requests", filter: `id=eq.${chatData.request_id}` },
          (payload) => { if (payload.new?.status) setRequestStatus(payload.new.status); })
        .subscribe();
    })();

    return () => { if (reqChannel) supabase.removeChannel(reqChannel); };
  }, [chatId]);

  // ── 3. Messages + Realtime ────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId || !userId) {
      // Ne couper le loading que si la résolution du chatId est terminée
      if (userId !== null && !chatId && chatIdResolvedRef.current) setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, reply_message:reply_to(*)")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      setMessages((data || []).map(mapMessage));
      setLoading(false);
    };

    const markDelivered = async () => {
      await supabase.from("messages").update({ delivered: true })
        .eq("chat_id", chatId).eq("delivered", false).neq("sender_id", userId);
    };

    const markRead = async () => {
      await supabase.from("messages").update({ read: true, delivered: true })
        .eq("chat_id", chatId).eq("read", false).neq("sender_id", userId);
    };

    fetchMessages();
    markDelivered();
    setTimeout(markRead, 800);

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newMsg = mapMessageSimple(payload.new);
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const cleaned = prev.filter(
              (m) => !(typeof m.id === "string" && m.id.startsWith("temp_") && m.senderId === newMsg.senderId && m.type === newMsg.type && Math.abs(m.createdAt - newMsg.createdAt) < 5000)
            );
            return [...cleaned, newMsg];
          });
          if (newMsg.senderId !== userId) {
            markDelivered();
            markRead();
          }
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const updated = mapMessageSimple(payload.new);
          setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated, replyTo: m.replyTo } : m));
        })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId, userId]);

  // ── 4. Typing indicator (Realtime Broadcast) ──────────────────────────────
  useEffect(() => {
    if (!chatId || !userId) return;

    const typingChannel = supabase.channel(`typing-${chatId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId !== userId) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, userId]);

  const broadcastTyping = useCallback(() => {
    if (!typingChannelRef.current || !userId) return;
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId },
    });
  }, [userId]);

  // ── Send text ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !userId || !chatId) return;
      const now = new Date().toISOString();
      const tempId = `temp_${Date.now()}`;
      const currentReply = replyTo;
      setReplyTo(null);

      setMessages((prev) => [...prev, {
        id: tempId, text: text.trim(), senderId: userId, type: "text",
        createdAt: new Date(now).getTime(), read: false, delivered: false,
        devis: null, imageUrl: null, status: "sending",
        replyTo: currentReply ? { id: currentReply.id, text: currentReply.text, senderId: currentReply.senderId, type: currentReply.type } : null,
      }]);

      const { data, error } = await supabase.from("messages")
        .insert({ chat_id: chatId, sender_id: userId, text: text.trim(), type: "text", created_at: now, reply_to: currentReply?.id || null })
        .select().single();

      if (error) {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: "error" } : m));
        return;
      }

      setMessages((prev) => prev.map((m) => m.id === tempId
        ? { ...mapMessageSimple(data), status: "sent", replyTo: m.replyTo } : m));

      await supabase.from("chats").update({ last_message: text.trim(), last_message_at: now }).eq("id", chatId);
      pushNotify(otherUserId, "💬 Nouveau message", text.trim().slice(0, 80));
    },
    [userId, chatId, otherUserId, replyTo],
  );

  // ── Send image ────────────────────────────────────────────────────────────
  const sendImage = useCallback(
    async (imageUrl) => {
      if (!imageUrl || !userId || !chatId) return;
      const now = new Date().toISOString();
      const tempId = `temp_${Date.now()}`;

      setMessages((prev) => [...prev, {
        id: tempId, text: null, senderId: userId, type: "image",
        createdAt: new Date(now).getTime(), read: false, delivered: false,
        devis: null, imageUrl, status: "sending", replyTo: null,
      }]);

      const { data, error } = await supabase.from("messages")
        .insert({ chat_id: chatId, sender_id: userId, type: "image", image_url: imageUrl, created_at: now })
        .select().single();

      if (error) {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: "error" } : m));
        return;
      }

      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...mapMessageSimple(data), status: "sent" } : m));
      await supabase.from("chats").update({ last_message: "📷 Photo", last_message_at: now }).eq("id", chatId);
      pushNotify(otherUserId, "📷 Photo", "Vous avez reçu une image.");
    },
    [userId, chatId, otherUserId],
  );

  // ── Send devis ────────────────────────────────────────────────────────────
  const sendDevis = useCallback(
    async (devisData) => {
      if (!userId || !chatId) return;
      const now = new Date().toISOString();
      const tempId = `temp_${Date.now()}`;
      const devisPayload = { title: devisData.title, lines: devisData.lines || [], total: devisData.total, validUntil: devisData.validUntil || null, status: "pending" };

      setMessages((prev) => [...prev, {
        id: tempId, text: null, senderId: userId, type: "devis",
        createdAt: new Date(now).getTime(), read: false, delivered: false,
        devis: devisPayload, imageUrl: null, status: "sending", replyTo: null,
      }]);

      const { data, error } = await supabase.from("messages")
        .insert({ chat_id: chatId, sender_id: userId, type: "devis", devis: devisPayload, created_at: now })
        .select().single();

      if (error) {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: "error" } : m));
        return;
      }

      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...mapMessageSimple(data), status: "sent" } : m));
      const label = `📋 Devis : ${(devisData.total || 0).toLocaleString("fr-FR")} FCFA`;
      await supabase.from("chats").update({ last_message: label, last_message_at: now }).eq("id", chatId);
      pushNotify(otherUserId, "📋 Nouveau devis", `${(devisData.total || 0).toLocaleString("fr-FR")} FCFA`);
    },
    [userId, chatId, otherUserId],
  );

  // ── Respond to devis ──────────────────────────────────────────────────────
  const respondToDevis = useCallback(
    async (messageId, response) => {
      if (!chatId) return;
      const now = new Date().toISOString();

      const { data } = await supabase.from("messages").select("devis, sender_id").eq("id", messageId).single();
      await supabase.from("messages").update({ devis: { ...data?.devis, status: response } }).eq("id", messageId);

      const statusLabel = response === "accepted" ? "Devis accepté" : "Devis refusé";
      await supabase.from("messages").insert({
        chat_id: chatId, sender_id: userId, type: "system",
        text: response === "accepted" ? "✅ Devis accepté" : "❌ Devis refusé", created_at: now,
      });
      await supabase.from("chats").update({ last_message: statusLabel, last_message_at: now }).eq("id", chatId);
      if (data?.sender_id) pushNotify(data.sender_id, statusLabel, statusLabel);

      if (response === "accepted") {
        const { data: chatData } = await supabase.from("chats").select("request_id").eq("id", chatId).single();
        if (chatData?.request_id) {
          await supabase.from("requests").update({ devis_accepted: true }).eq("id", chatData.request_id);
        }
      }
    },
    [chatId, userId],
  );

  // ── Cancel devis (provider only) ───────────────────────────────────────────
  const cancelDevis = useCallback(
    async (messageId) => {
      if (!chatId) return;
      const now = new Date().toISOString();

      const { data } = await supabase.from("messages").select("devis").eq("id", messageId).single();
      await supabase.from("messages").update({ devis: { ...data?.devis, status: "cancelled" } }).eq("id", messageId);

      await supabase.from("messages").insert({
        chat_id: chatId, sender_id: userId, type: "system",
        text: "🚫 Devis annulé par le prestataire", created_at: now,
      });
      await supabase.from("chats").update({ last_message: "Devis annulé", last_message_at: now }).eq("id", chatId);
      pushNotify(otherUserId, "Devis annulé", "Le prestataire a annulé son devis.");
    },
    [chatId, userId, otherUserId],
  );

  // ── Confirm complete ──────────────────────────────────────────────────────
  const confirmComplete = useCallback(async () => {
    if (!requestId || !chatId) throw new Error("Données manquantes (requestId ou chatId)");
    const now = new Date().toISOString();

    const { error } = await supabase.from("requests").update({ status: "completed", completed_at: now }).eq("id", requestId);
    if (error) throw error;
    setRequestStatus("completed");

    await supabase.from("messages").insert({
      chat_id: chatId, sender_id: userId, type: "system",
      text: "✅ Prestation confirmée par le client. Mission terminée !", created_at: now,
    });
    await supabase.from("chats").update({ last_message: "Mission terminée", last_message_at: now }).eq("id", chatId);
    pushNotify(otherUserId, "Mission terminée", "La prestation a été confirmée.");
  }, [requestId, chatId, userId, otherUserId]);

  // ── Retry failed message ──────────────────────────────────────────────────
  const retryMessage = useCallback(
    async (tempId) => {
      const msg = messages.find((m) => m.id === tempId && m.status === "error");
      if (!msg || !chatId) return;

      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: "sending" } : m));
      const insertData = { chat_id: chatId, sender_id: userId, type: msg.type, created_at: new Date().toISOString() };
      if (msg.type === "text") insertData.text = msg.text;
      if (msg.type === "image") insertData.image_url = msg.imageUrl;
      if (msg.type === "devis") insertData.devis = msg.devis;
      if (msg.replyTo?.id) insertData.reply_to = msg.replyTo.id;

      const { data, error } = await supabase.from("messages").insert(insertData).select().single();
      if (error) {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: "error" } : m));
        return;
      }
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...mapMessageSimple(data), status: "sent", replyTo: m.replyTo } : m));
    },
    [messages, chatId, userId],
  );

  return {
    messages, loading, chatId, currentUserId: userId,
    requestId, requestStatus,
    isOtherTyping, replyTo, setReplyTo,
    sendMessage, sendImage, sendDevis, respondToDevis, cancelDevis,
    confirmComplete, retryMessage, broadcastTyping,
  };
}

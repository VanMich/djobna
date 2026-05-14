// src/hooks/useChat.js
import { useState, useEffect, useCallback, useMemo } from "react";
import { getDatabase, off, onValue, push, ref, update } from "firebase/database";
import { auth } from "../config/firebase";

// Genere un ID stable pour une conversation entre deux utilisateurs.
export function getChatId(uid1, uid2) {
  if (!uid1 || !uid2) return null;
  return [uid1, uid2].sort().join("_");
}

export function useChat(otherUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const database = useMemo(() => getDatabase(), []);
  const chatId = getChatId(currentUser?.uid, otherUserId);
  const messagesRef = useMemo(
    () => (chatId ? ref(database, `chats/${chatId}/messages`) : null),
    [chatId, database],
  );

  const markAsRead = useCallback(async () => {
    if (!currentUser || !chatId) return;

    try {
      await update(ref(database, `chats/${chatId}/meta/unreadCount`), {
        [currentUser.uid]: 0,
      });
    } catch (err) {
      console.error("Erreur mark as read:", err);
    }
  }, [chatId, currentUser, database]);

  useEffect(() => {
    if (!currentUser || !messagesRef) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const msgs = Object.entries(data)
          .map(([id, msg]) => ({ id, ...msg }))
          .sort((a, b) => a.createdAt - b.createdAt);
        setMessages(msgs);
      } else {
        setMessages([]);
      }

      setLoading(false);
    });

    markAsRead();

    return () => off(messagesRef);
  }, [currentUser, markAsRead, messagesRef]);

  const updateChatMeta = useCallback(
    async (lastMessage) => {
      if (!currentUser || !chatId || !otherUserId) return;

      await update(ref(database, `chats/${chatId}/meta`), {
        lastMessage,
        lastMessageAt: Date.now(),
        participants: [currentUser.uid, otherUserId],
      });
    },
    [chatId, currentUser, database, otherUserId],
  );

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !currentUser || !messagesRef) return;

      const message = {
        text: text.trim(),
        senderId: currentUser.uid,
        type: "text",
        createdAt: Date.now(),
        read: false,
      };

      try {
        await push(messagesRef, message);
        await updateChatMeta(text.trim());
      } catch (err) {
        console.error("Erreur envoi message:", err);
      }
    },
    [currentUser, messagesRef, updateChatMeta],
  );

  const sendDevis = useCallback(
    async (devisData) => {
      if (!currentUser || !messagesRef) return;

      const message = {
        type: "devis",
        senderId: currentUser.uid,
        createdAt: Date.now(),
        read: false,
        devis: {
          title: devisData.title,
          price: devisData.price,
          description: devisData.description,
          status: "pending",
        },
      };

      try {
        await push(messagesRef, message);
        await updateChatMeta(`Devis : ${devisData.price} FCFA`);
      } catch (err) {
        console.error("Erreur envoi devis:", err);
      }
    },
    [currentUser, messagesRef, updateChatMeta],
  );

  const respondToDevis = useCallback(
    async (messageId, response) => {
      if (!chatId) return;

      try {
        await update(
          ref(database, `chats/${chatId}/messages/${messageId}/devis`),
          { status: response },
        );
      } catch (err) {
        console.error("Erreur reponse devis:", err);
      }
    },
    [chatId, database],
  );

  return {
    messages,
    loading,
    sendMessage,
    sendDevis,
    respondToDevis,
    chatId,
    currentUserId: currentUser?.uid,
  };
}

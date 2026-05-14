// src/hooks/useChatList.js
// Hook pour récupérer toutes les conversations de l'utilisateur
import { getDatabase, off, onValue, ref } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db as firestore } from "../config/firebase";

export function useChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const database = getDatabase();

  useEffect(() => {
    if (!currentUser) return;

    // Écouter tous les chats qui contiennent l'UID de l'utilisateur
    // On écoute le nœud racine 'chats' et on filtre côté client
    // Pour un MVP c'est acceptable — en production on utiliserait
    // des Firebase queries ou Cloud Functions
    const chatsRef = ref(database, "chats");

    const unsubscribe = onValue(chatsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Filtrer les conversations de l'utilisateur courant
      const userChats = Object.entries(data)
        .filter(([chatId, chat]) =>
          chat.meta?.participants?.includes(currentUser.uid),
        )
        .sort(
          (a, b) =>
            (b[1].meta?.lastMessageAt || 0) - (a[1].meta?.lastMessageAt || 0),
        );

      // Enrichir avec les données du profil de l'interlocuteur
      const enriched = await Promise.all(
        userChats.map(async ([chatId, chat]) => {
          // Trouver l'ID de l'interlocuteur
          const otherId = chat.meta?.participants?.find(
            (id) => id !== currentUser.uid,
          );

          // Récupérer son profil depuis Firestore
          let otherUser = { displayName: "Utilisateur", quartier: "" };
          try {
            const userSnap = await getDoc(doc(firestore, "users", otherId));
            if (userSnap.exists()) otherUser = userSnap.data();
            if (otherUser.role === "provider" || otherUser.role === "both") {
              const providerSnap = await getDoc(
                doc(firestore, "providers", otherId),
              );
              if (providerSnap.exists()) {
                otherUser = { ...otherUser, ...providerSnap.data() };
              }
            }
          } catch (err) {
            console.error("Erreur récup profil:", err);
          }

          return {
            chatId,
            otherId,
            otherUser,
            lastMessage: chat.meta?.lastMessage || "",
            lastMessageAt: chat.meta?.lastMessageAt || 0,
            unreadCount: chat.meta?.unreadCount?.[currentUser.uid] || 0,
          };
        }),
      );

      setConversations(enriched);
      setLoading(false);
    });

    return () => off(chatsRef);
  }, [currentUser?.uid]);

  return { conversations, loading };
}

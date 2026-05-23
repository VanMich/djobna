// src/hooks/useNotifications.js
// Gère les permissions push + stocke l'Expo Push Token en base (§16).
// À appeler une seule fois au niveau de l'AppNavigator après connexion.

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "../config/supabase";

// Configuration du gestionnaire de notifications (doit être en dehors du composant)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken() {
  // Demande la permission push
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  // Crée le channel Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Djobna",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Récupère l'Expo Push Token (nécessite un appareil physique ou Expo Go)
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      || Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token;
  } catch {
    return null;
  }
}

export function useNotifications() {
  useEffect(() => {
    (async () => {
      const token = await registerPushToken();
      if (!token) return;

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Stocke le token en base pour l'envoi côté serveur
      await supabase
        .from("users")
        .update({ push_token: token })
        .eq("id", user.id);
    })();
  }, []);
}

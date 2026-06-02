// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION SUPABASE — remplace l'ancien firebase.js
//
// Supabase joue 4 rôles dans ce projet :
//   1. Auth       → connexion par SMS OTP via Twilio (remplace Firebase Auth + reCAPTCHA)
//   2. Database   → tables PostgreSQL (remplace Firestore + Realtime Database)
//   3. Realtime   → écoute les changements en temps réel (remplace onSnapshot + onValue)
//   4. Storage    → stockage des images (remplace Firebase Storage)
//
// Dans les autres fichiers, importer ainsi :
//   import { supabase } from '../config/supabase';
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// URL et clé chargées depuis les variables d'environnement (.env).
// Les variables EXPO_PUBLIC_* sont injectées par Expo au build.
// La clé anon reste sans danger côté client car la sécurité est gérée
// par les Row Level Security policies dans Supabase.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Variables Supabase manquantes. Copie .env.example en .env et renseigne " +
      "EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY, puis relance avec « expo start -c »."
  );
}

// createClient() est l'équivalent de initializeApp() de Firebase.
// Pas besoin de vérifier si le client existe déjà — Supabase le gère en interne.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATION HELPER
// Envoie une push notification via l'edge function send-push sécurisée.
// Inclut automatiquement le JWT de l'utilisateur connecté.
// ─────────────────────────────────────────────────────────────────────────────
const PUSH_URL = `${SUPABASE_URL}/functions/v1/send-push`;

export async function pushNotify(recipientId, title, body, data) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    fetch(PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ recipientId, title, body: body || "", data: data || {} }),
    }).catch(() => {});
  } catch {
    // fire & forget — ne pas bloquer l'UX
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AIDE-MÉMOIRE RAPIDE — équivalences Firebase → Supabase
//
// AUTHENTIFICATION :
//   Firebase : getAuth(app)                          → supabase.auth
//   Firebase : onAuthStateChanged(auth, cb)          → supabase.auth.onAuthStateChange(cb)
//   Firebase : auth.currentUser.uid                  → session.user.id  (dans le callback)
//   Firebase : signOut(auth)                         → supabase.auth.signOut()
//
// BASE DE DONNÉES :
//   Firebase : getDoc(doc(db, 'table', id))          → supabase.from('table').select().eq('id', id).single()
//   Firebase : setDoc(doc(db, 'table', id), data)    → supabase.from('table').upsert({ id, ...data })
//   Firebase : updateDoc(doc(db, 'table', id), data) → supabase.from('table').update(data).eq('id', id)
//   Firebase : addDoc(collection(db, 'table'), data) → supabase.from('table').insert(data)
//   Firebase : onSnapshot(ref, cb)                   → supabase.channel().on('postgres_changes', ...).subscribe()
//   Firebase : serverTimestamp()                     → new Date().toISOString()
//
// NOMS DE CHAMPS : camelCase (Firestore) → snake_case (PostgreSQL)
//   displayName → display_name | photoURL → photo_url | activeRole → active_role
//   createdAt → created_at   | phoneNumber → phone_number
// ─────────────────────────────────────────────────────────────────────────────

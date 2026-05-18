# Plan de migration Firebase → Supabase + Twilio

## Statut global
- [x] Configuration Twilio (compte, Messaging Service, clés)
- [x] Configuration Supabase (projet, tables, RLS, Realtime, Storage, Auth Phone)
- [x] Migration du code

---

## Fichiers à modifier (dans l'ordre)

### PHASE 1 — Configuration de base

#### [x] 1. Installer les packages
```bash
npm uninstall firebase expo-firebase-recaptcha
npm install @supabase/supabase-js
```

#### [x] 2. Créer `src/config/supabase.js`
- Fichier créé avec l'URL et la clé anon du projet Supabase
- Exporte `supabase` (équivalent de `auth` + `db` de Firebase combinés)
- Contient un aide-mémoire des équivalences Firebase → Supabase en commentaires
- `firebase.js` reste en place jusqu'à ce que tous les imports soient migrés (Phase 7)

---

### PHASE 2 — Authentification (le plus critique)

#### [x] 3. `src/hooks/useAuth.js`
**Avant :** Firebase Phone Auth + reCAPTCHA (PhoneAuthProvider, signInWithCredential)
**Après :** `supabase.auth.signInWithOtp({ phone })` + `supabase.auth.verifyOtp()`
- Supprimer : `PhoneAuthProvider`, `signInWithCredential`, `RecaptchaVerifier`
- Remplacer `sendOTP()` → `supabase.auth.signInWithOtp({ phone: phoneNumber })`
- Remplacer `verifyOTP()` → `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
- Remplacer `signOut()` → `supabase.auth.signOut()`
- Remplacer `onAuthStateChanged()` → `supabase.auth.onAuthStateChange()`

#### [x] 4. `src/screens/PhoneScreen.jsx`
**Avant :** Composant `FirebaseRecaptchaVerifierModal` + ref recaptcha
**Après :** Appel direct à `useAuth().sendOTP()` sans reCAPTCHA
- Supprimer : import et usage de `expo-firebase-recaptcha`
- Supprimer : `recaptchaVerifier` ref et le composant `<FirebaseRecaptchaVerifierModal>`
- Mettre à jour l'appel à `sendOTP(phoneNumber)` (plus besoin de passer la ref recaptcha)

#### [x] 5. `src/screens/OTPScreen.jsx`
**Avant :** `PhoneAuthProvider.credential(verificationId, code)` + `signInWithCredential()`
**Après :** `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
- Supprimer : `verificationId` (plus utilisé)
- Remplacer la logique de vérification par `verifyOTP(phoneNumber, code)`

#### [x] 6. `src/screens/SplashScreen.jsx`
**Avant :** `onAuthStateChanged(auth, user => ...)` de Firebase
**Après :** `supabase.auth.onAuthStateChange((event, session) => ...)`
- Remplacer l'import `auth` de firebase par `supabase`
- Adapter le callback : Firebase donne `user`, Supabase donne `session` → utiliser `session?.user`

#### [x] 7. `src/navigation/AppNavigator.jsx`
**Avant :** `onAuthStateChanged(auth, ...)` + `onSnapshot` pour écouter `activeRole`
**Après :** `supabase.auth.onAuthStateChange()` + `supabase.from('users').select()` avec subscription Realtime
- Remplacer le listener d'auth
- Remplacer l'écoute Firestore du champ `activeRole` par une subscription Supabase Realtime sur la table `users`

---

### PHASE 3 — Profils utilisateurs

#### [x] 8. `src/hooks/useProfile.js`
**Avant :** `setDoc(doc(db, 'users', uid), {...})` + `setDoc(doc(db, 'clients', uid), {...})`
**Après :** `supabase.from('users').upsert({...})` + `supabase.from('clients').upsert({...})`
- Remplacer `setDoc` → `supabase.from().upsert()`
- Remplacer `serverTimestamp()` → `new Date().toISOString()`
- Adapter les noms de champs : camelCase → snake_case (ex: `displayName` → `display_name`)

#### [x] 9. `src/screens/ProfileSetupScreen.jsx`
**Avant :** Appelle `useProfile` avec les données Firebase
**Après :** Même logique, adapter si des données Firebase sont passées directement dans le screen
- Vérifier les champs du formulaire → ils doivent correspondre aux colonnes Supabase
- Vérifier la navigation après création de profil

#### [x] 10. `src/hooks/useRoleSwitch.js`
**Avant :** `updateDoc(doc(db, 'users', uid), { activeRole: newRole })`
**Après :** `supabase.from('users').update({ active_role: newRole }).eq('id', uid)`
- Remplacer `updateDoc` → `supabase.from().update()`
- Adapter le nom de champ : `activeRole` → `active_role`

#### [x] 11. `src/hooks/useClientProfile.js`
**Avant :** `getDoc(doc(db, 'users', uid))` + `getDoc(doc(db, 'clients', uid))` + `onSnapshot`
**Après :** `supabase.from('users').select()` + subscription Realtime
- Remplacer les lectures Firestore par des requêtes Supabase
- Remplacer `onSnapshot` → subscription Supabase Realtime ou polling simple
- Adapter les noms de champs snake_case

---

### PHASE 4 — Prestataires

#### [x] 12. `src/hooks/useProviders.js`
**Avant :** `query(collection(db, 'providers'), where('availability', '==', true), ...)`
**Après :** `supabase.from('providers').select('*, users(display_name, photo_url)').eq('availability', true)`
- Remplacer toutes les queries Firestore par des queries Supabase
- Profiter des JOIN SQL : récupérer `users` et `providers` en une seule requête
- Adapter les filtres (service, ville, etc.)

#### [x] 13. `src/hooks/useProviderSetup.js`
**Avant :** `setDoc(doc(db, 'providers', uid), {...})` + `setDoc(doc(db, 'verification', uid), {...})`
**Après :** `supabase.from('providers').upsert({...})` + `supabase.from('verification').upsert({...})`
- Remplacer les écritures Firestore
- Pour les uploads d'images (CNI, selfie) : remplacer Firebase Storage par Supabase Storage
  - `supabase.storage.from('documents').upload(path, file)`

#### [x] 14. `src/screens/ProviderSetupScreen.jsx`
**Avant :** Appelle `useProviderSetup` avec données Firebase
**Après :** Même logique, vérifier les champs du formulaire
- Vérifier la navigation après inscription prestataire
- Adapter les champs camelCase → snake_case si passés directement

#### [x] 15. `src/hooks/useProviderOwnProfile.js`
**Avant :** `getDoc` + `updateDoc` sur la collection `providers`
**Après :** `supabase.from('providers').select()` + `.update()`
- Remplacer lectures et écritures
- Pour upload photo/portfolio : Supabase Storage

#### [ ] 16. `src/screens/ProviderProfileOwnScreen.jsx`
**Avant :** Utilise `useProviderOwnProfile` avec données Firebase
**Après :** Même logique, vérifier les champs affichés

#### [x] 17. `src/screens/ProviderProfileScreen.jsx`
**Avant :** Lecture Firestore du profil prestataire
**Après :** `supabase.from('providers').select('*, users(*)').eq('id', providerId)`
- Vérifier les champs affichés (camelCase → snake_case)

---

### PHASE 5 — Dashboard prestataire et demandes

#### [x] 18. `src/hooks/useProviderDashboard.js`
**Avant :** `onSnapshot(query(collection(db, 'requests'), where('providerId', '==', uid)))` + RTDB
**Après :** `supabase.from('requests').select()` + subscription Realtime
- Remplacer `onSnapshot` → subscription Supabase Realtime sur `requests`
- Remplacer la lecture RTDB (disponibilité) → `supabase.from('providers').select('availability')`
- Remplacer `updateDoc` pour toggle disponibilité → `supabase.from('providers').update({ availability })`

#### [x] 19. `src/hooks/useServiceRequest.js`
**Avant :** `addDoc(collection(db, 'requests'), {...})`
**Après :** `supabase.from('requests').insert({...})`
- Remplacer `addDoc` → `supabase.from().insert()`
- Adapter les noms de champs snake_case
- Remplacer `serverTimestamp()` → `new Date().toISOString()`

#### [x] 20. `src/screens/HomeProviderScreen.jsx`
**Avant :** Utilise `useProviderDashboard` avec données Firebase
**Après :** Même logique, vérifier les champs affichés

#### [x] 21. `src/screens/HomeScreen.jsx`
**Avant :** Utilise `useProviders` avec données Firebase
**Après :** Même logique, vérifier l'affichage après migration `useProviders`

---

### PHASE 6 — Chat en temps réel

#### [x] 22. `src/hooks/useChat.js`
**Avant :** Firebase RTDB (`ref`, `push`, `onValue`, `off`, `update`)
**Après :** Supabase Realtime (`supabase.channel()`, `postgres_changes`)
- Remplacer `push(ref(db, 'chats/...'))` → `supabase.from('messages').insert()`
- Remplacer `onValue` → subscription `supabase.channel().on('postgres_changes', ...)`
- Remplacer `update` pour meta chat → `supabase.from('chats').update()`
- Remplacer `off()` → `supabase.removeChannel()`

#### [x] 23. `src/hooks/useChatList.js`
**Avant :** RTDB pour la liste des conversations + Firestore pour enrichir avec données users
**Après :** `supabase.from('chats').select('*, users!provider_id(*), users!client_id(*)')` + Realtime
- Remplacer RTDB par requête Supabase avec JOIN
- Remplacer `onValue` → subscription Realtime sur `chats`

#### [x] 24. `src/screens/ChatScreen.jsx`
**Avant :** Utilise `useChat` avec RTDB
**Après :** Même logique, vérifier l'affichage des messages et devis

---

### PHASE 7 — Nettoyage final

#### [x] 25. Supprimer `src/config/firebase.js`
- S'assurer qu'aucun fichier n'importe encore depuis `../config/firebase`
- Grep dans tout le projet pour vérifier

#### [x] 26. Vérifier `app.json`
- Supprimer les plugins Firebase si présents (`@react-native-firebase/...`)
- Supprimer `google-services.json` / `GoogleService-Info.plist` si existants

#### [x] 27. Vérifier `package.json`
- Confirmer que `firebase` et `expo-firebase-recaptcha` sont absents
- Confirmer que `@supabase/supabase-js` est présent

#### [ ] 28. Test end-to-end
- [ ] Envoi OTP → réception SMS Twilio
- [ ] Vérification OTP → connexion
- [ ] Création profil client
- [ ] Inscription prestataire
- [ ] Affichage liste prestataires
- [ ] Chat en temps réel
- [ ] Demande de service
- [ ] Changement de rôle (client ↔ prestataire)

---

## Correspondances de noms de champs (camelCase → snake_case)

| Firebase (Firestore) | Supabase (PostgreSQL) |
|----------------------|-----------------------|
| `displayName` | `display_name` |
| `photoURL` | `photo_url` |
| `activeRole` | `active_role` |
| `phoneNumber` | `phone_number` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `yearsOfExperience` | `years_of_experience` |
| `interventionZones` | `intervention_zones` |
| `servicePricing` | `service_pricing` |
| `reviewCount` | `review_count` |
| `todayCount` | `today_count` |
| `monthRevenue` | `month_revenue` |
| `verificationStatus` | `verification_status` |
| `walletBalance` | `wallet_balance` |
| `favoriteProviders` | `favorite_providers` |
| `bookingHistory` | `booking_history` |
| `profileComplete` | `profile_complete` |
| `clientId` | `client_id` |
| `providerId` | `provider_id` |
| `requestId` | `request_id` |
| `scheduledDate` | `scheduled_date` |
| `lastMessage` | `last_message` |
| `lastMessageAt` | `last_message_at` |
| `senderId` | `sender_id` |
| `chatId` | `chat_id` |
| `cniRecto` | `cni_recto` |
| `cniVerso` | `cni_verso` |
| `selfieWithCNI` | `selfie_with_cni` |
| `submittedAt` | `submitted_at` |
| `reviewedAt` | `reviewed_at` |
| `rejectionReason` | `rejection_reason` |

---

## Équivalences Firebase → Supabase (aide-mémoire rapide)

| Firebase | Supabase |
|----------|----------|
| `setDoc(doc(db, 'table', id), data)` | `supabase.from('table').upsert({ id, ...data })` |
| `updateDoc(doc(db, 'table', id), data)` | `supabase.from('table').update(data).eq('id', id)` |
| `getDoc(doc(db, 'table', id))` | `supabase.from('table').select('*').eq('id', id).single()` |
| `addDoc(collection(db, 'table'), data)` | `supabase.from('table').insert(data)` |
| `getDocs(query(collection(db, 'table'), where(...)))` | `supabase.from('table').select('*').eq(...)` |
| `onSnapshot(docRef, cb)` | `supabase.channel().on('postgres_changes', ...).subscribe()` |
| `serverTimestamp()` | `new Date().toISOString()` |
| `auth.currentUser.uid` | `(await supabase.auth.getUser()).data.user.id` |
| `onAuthStateChanged(auth, cb)` | `supabase.auth.onAuthStateChange((event, session) => cb(session?.user))` |
| `signOut(auth)` | `supabase.auth.signOut()` |
| `getDatabase()` + `ref()` + `onValue()` | `supabase.channel().on('postgres_changes', ...).subscribe()` |
| `push(ref(db, path), data)` | `supabase.from('table').insert(data)` |
| `off(ref)` | `supabase.removeChannel(channel)` |

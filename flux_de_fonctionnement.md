# FLUX DE FONCTIONNEMENT — DJOBNA

> Document de référence pour l'implémentation complète de la logique applicative.
> Toute la logique existante sera adaptée pour suivre ce flux.

---

## SOMMAIRE

1. [Authentification](#1-authentification)
2. [Onboarding Client](#2-onboarding-client)
3. [Onboarding Prestataire](#3-onboarding-prestataire)
4. [Vérification du compte prestataire](#4-vérification-du-compte-prestataire)
5. [Système d'abonnement](#5-système-dabonnement)
6. [Navigation et changement de rôle](#6-navigation-et-changement-de-rôle)
7. [Espace Client — Accueil](#7-espace-client--accueil)
8. [Espace Client — Carte (Map)](#8-espace-client--carte-map)
9. [Profil public d'un prestataire](#9-profil-public-dun-prestataire)
10. [Flux de demande de service](#10-flux-de-demande-de-service)
11. [Messagerie et devis](#11-messagerie-et-devis)
12. [Paiement et commission](#12-paiement-et-commission)
13. [Espace Prestataire — Dashboard (Home)](#13-espace-prestataire--dashboard-home)
14. [Espace Prestataire — Profil](#14-espace-prestataire--profil)
15. [Système de notation et avis](#15-système-de-notation-et-avis)
16. [Notifications](#16-notifications)
17. [Historique et statistiques](#17-historique-et-statistiques)
18. [Structure de la base de données](#18-structure-de-la-base-de-données)

---

## 1. AUTHENTIFICATION

### 1.1 Entrée dans l'application

- L'application démarre sur un **SplashScreen** animé.
- Le SplashScreen vérifie l'état d'authentification Firebase :
  - **Utilisateur connecté** → redirection vers l'écran principal correspondant à son rôle actif.
  - **Utilisateur non connecté** → redirection vers l'écran de saisie du numéro de téléphone.

### 1.2 Connexion par OTP (One-Time Password)

**Écran PhoneScreen :**
- L'utilisateur saisit son numéro de téléphone avec le préfixe pays (+237 Cameroun par défaut).
- Validation du format du numéro côté client avant envoi.
- Firebase Phone Auth envoie un SMS avec un code OTP à 6 chiffres.
- Un reCAPTCHA invisible est géré en arrière-plan (expo-firebase-recaptcha).

**Écran OTPScreen :**
- Clavier numérique animé pour saisir le code à 6 chiffres.
- Minuteur de 60 secondes avec option de renvoi du code à l'expiration.
- Animation de secousse (shake) en cas de code incorrect.
- En cas de succès → vérification du profil dans Firestore :
  - **Nouveau utilisateur** (aucun document dans `users/`) → redirection vers **ProfileSetupScreen**.
  - **Utilisateur existant** → redirection vers l'écran principal selon son `activeRole`.

---

## 2. ONBOARDING CLIENT

### 2.1 Création du profil client (ProfileSetupScreen — rôle client)

Formulaire en **une seule étape** :
- Nom complet *(obligatoire)*
- Photo de profil *(facultative — upload depuis galerie)*
- Ville *(obligatoire)*
- Quartier *(obligatoire — liste déroulante selon la ville)*
- Pays *(obligatoire)*
- Numéro de téléphone *(pré-rempli depuis l'auth, non modifiable ici)*

À la validation :
- Création du document `users/{uid}` avec `role: "client"` et `activeRole: "client"`.
- Création du document `clients/{uid}`.
- Redirection vers **ClientTabNavigator** (Home, Map, Messages, Profil).

### 2.2 Complétion du profil client (ultérieure)

- Depuis l'onglet **Profil**, le client peut modifier toutes ses informations.
- Un indicateur de **complétion du profil** (%) est affiché.
- **Règle critique** : Un client ne peut soumettre une demande de service que si son profil est complet (nom, localisation renseignés).

---

## 3. ONBOARDING PRESTATAIRE

### 3.1 Accès à la création du compte prestataire

- Depuis l'onglet **Profil client**, un bouton est affiché :
  - Si aucun compte prestataire n'existe → **"Devenir prestataire"**
  - Si un compte prestataire existe déjà → **"Compte prestataire"** (bascule de rôle, voir §6)

### 3.2 Formulaire de création en plusieurs étapes (ProviderSetupScreen)

Le formulaire s'affiche comme un **flow multi-étapes** (stepper avec barre de progression).

---

**Étape 1 — Informations personnelles**
- Nom complet *(pré-rempli depuis le profil client si existant)*
- Numéro de téléphone *(pré-rempli, non modifiable)*
- Photo de profil *(obligatoire — upload galerie ou prise de photo en direct)*
- Ville, Quartier, Pays *(obligatoires)*
- Zones d'intervention *(multi-sélection de quartiers/villes — liste prédéfinie)*

---

**Étape 2 — Services proposés et tarification**
- Sélection du ou des **types de services** parmi la liste prédéfinie (plomberie, mécanique, électricité, coiffure, etc.).
- Pour **chaque service sélectionné**, le prestataire définit :
  - Un **intitulé personnalisé** du service (ex : "Plomberie résidentielle")
  - Un **tarif minimum** *(encadré par notre plancher selon le marché)*
  - Un **tarif maximum** *(encadré par notre plafond selon notre commission)*
  - L'**unité** (par heure, par intervention, par jour, etc.)
- Les fourchettes min/max acceptables sont définies côté back-end par service.

---

**Étape 3 — Description et expérience**
- Biographie / description libre *(min 50 caractères, max 500)*
- Nombre d'années d'expérience
- Langues parlées *(multi-sélection)*

---

**Étape 4 — Vérification d'identité (KYC)**
- **Photo CNI recto** *(upload obligatoire)*
- **Photo CNI verso** *(upload obligatoire)*
- **Selfie avec CNI en main** *(photo prise en direct uniquement, upload depuis galerie désactivé)*
- Ces documents sont uploadés dans Firebase Storage sous `verification/{uid}/`.

---

**Étape 5 — Récapitulatif et soumission**
- Affichage de toutes les informations saisies pour relecture.
- Bouton **"Soumettre pour vérification"**.
- À la soumission :
  - Création du document `providers/{uid}` avec `verificationStatus: "pending"`.
  - Redirection vers un écran d'attente indiquant que le compte est en cours de vérification.

---

## 4. VÉRIFICATION DU COMPTE PRESTATAIRE

### 4.1 Processus de vérification

**Option retenue : vérification hybride (manuelle + automatisée)**

- **Phase 1 — Vérification automatique** (IA / Deep Learning) :
  - Détection et lecture OCR de la CNI (nom, numéro).
  - Comparaison du visage sur la CNI avec le selfie via un modèle de reconnaissance faciale.
  - Si le score de confiance est suffisant → passage automatique à `verificationStatus: "auto_approved"`.
  - Si le score est insuffisant → escalade vers vérification manuelle.

- **Phase 2 — Vérification manuelle** (back-office Djobna) :
  - Un opérateur examine les documents depuis un dashboard d'administration.
  - Résultat : `approved` ou `rejected` avec motif.
  - **Délai cible : 24 à 48 heures.**

### 4.2 Communication au prestataire

- **Notifié par push notification et in-app** lors de chaque changement de statut.
- Statuts possibles : `pending` → `approved` / `rejected`.
- En cas de rejet : affichage du motif + possibilité de re-soumettre les documents.
- En cas d'approbation : activation complète du compte prestataire + début de la **période d'essai gratuite** (1 mois Premium).

---

## 5. SYSTÈME D'ABONNEMENT

### 5.1 Plans disponibles

| Fonctionnalité | Classique (Gratuit) | Premium (Payant) |
|---|---|---|
| Apparaître dans les résultats | Oui | Oui (priorité) |
| Nombre de requêtes/mois | Limité (ex: 10) | Illimité |
| Apparition sur la carte | Oui | En avant (badge) |
| Génération de devis | Non | Oui |
| Statistiques détaillées | Basiques | Avancées |
| Badge "Vérifié Premium" | Non | Oui |
| Support prioritaire | Non | Oui |

### 5.2 Période d'essai

- À l'approbation du compte, **1 mois Premium offert automatiquement**.
- Un bandeau de compte à rebours est affiché dans le Dashboard prestataire.
- 7 jours avant l'expiration → notifications de rappel (push + in-app).

### 5.3 Souscription

- Depuis l'onglet **Profil prestataire** → section "Mon abonnement".
- Paiement via **Orange Money** ou **MTN Mobile Money**.
- Renouvellement automatique si le mode de paiement est actif, sinon bascule vers Classique.
- Factures générées et consultables dans l'historique de l'abonnement.

---

## 6. NAVIGATION ET CHANGEMENT DE RÔLE

### 6.1 Structure de navigation

**Rôle actif : Client** → `ClientTabNavigator`
- Home (accueil + liste prestataires)
- Map (carte interactive)
- Messages (conversations)
- Profil (profil client)

**Rôle actif : Prestataire** → `ProviderTabNavigator`
- Dashboard (requêtes + missions)
- Map *(à implémenter — voir missions sur carte)*
- Messages (conversations)
- Profil (profil prestataire)

### 6.2 Bascule de rôle

- Depuis **chaque onglet Profil**, un bouton persistant permet de basculer de rôle :
  - Client → **"Passer en mode Prestataire"**
  - Prestataire → **"Passer en mode Client"**
- La bascule met à jour `activeRole` dans `users/{uid}`.
- Le navigateur se reconstruit instantanément selon le nouveau rôle.
- L'état de chaque rôle (disponibilité, missions en cours) est conservé lors de la bascule.

---

## 7. ESPACE CLIENT — ACCUEIL

### 7.1 Affichage de la liste des prestataires

- Liste des prestataires **disponibles** (`availability: true`, `verificationStatus: "approved"`).
- Chargement en temps réel via `onSnapshot` Firestore.
- Chaque carte prestataire affiche :
  - Photo, nom, services, note moyenne, quartier, fourchette de prix, badge Premium.

### 7.2 Filtres et recherche

- Barre de recherche par mot-clé (nom, service).
- Filtres avancés (drawer animé) :
  - Type de service
  - Quartier / Zone
  - Fourchette de prix (slider min/max)
  - Note minimale
  - Disponibilité immédiate
- Les filtres s'appliquent dynamiquement sur la liste.

### 7.3 Accès au profil prestataire

- Clic sur une carte → redirection vers le **profil public du prestataire** (§9).

---

## 8. ESPACE CLIENT — CARTE (MAP)

### 8.1 Affichage initial

- La carte s'ouvre centrée sur la **position GPS du client** (avec permission).
- Si la permission GPS est refusée → centrage sur la ville par défaut.
- Les prestataires disponibles et vérifiés sont affichés sous forme de **marqueurs** sur la carte.
- Le **rayon d'affichage initial** est défini dans le code (ex : 5 km).

### 8.2 Marqueurs prestataires

- Marqueur coloré selon le type de service principal.
- Badge Premium visible sur le marqueur.
- Clic sur un marqueur → une **modale slide-up** s'affiche avec :
  - Photo, nom, service principal, note, quartier.
  - Bouton **"Voir le profil"** → vers profil public (§9).
  - Bouton **"Solliciter"** → raccourci vers la demande de service (§10).

### 8.3 Filtres sur la carte

- Les mêmes filtres que l'accueil (§7.2) s'appliquent à la carte.
- Les résultats filtrés se mettent à jour dynamiquement sur la carte.

---

## 9. PROFIL PUBLIC D'UN PRESTATAIRE

### 9.1 Structure du profil (ProviderProfileScreen)

Trois onglets :

**Onglet 1 — Profil**
- Photo, nom, badge vérifié, badge Premium, note globale, nombre d'avis.
- Services proposés avec fourchettes de prix par service.
- Zones d'intervention.
- Biographie / description.
- Langues parlées.
- Bouton **"Solliciter les services"** *(désactivé si profil client incomplet)*.
- Bouton **"Contacter"** *(ouvre la messagerie directe)*.
- Bouton **"Ajouter aux favoris"** (cœur).

**Onglet 2 — Portfolio**
- Galerie de photos des travaux réalisés par le prestataire.
- Le prestataire peut uploader des photos depuis son profil propre.

**Onglet 3 — Avis**
- Liste des avis clients avec note (étoiles) et commentaire.
- Date de l'avis, nom du client.
- Note moyenne détaillée (ponctualité, qualité, communication, rapport qualité/prix).

---

## 10. FLUX DE DEMANDE DE SERVICE

### 10.1 Prérequis

- Le client **doit avoir son profil complet** (nom + localisation) pour soumettre une demande.
- Si le profil est incomplet → une alerte invite le client à compléter son profil avant de continuer.

### 10.2 Création de la demande (côté client)

Depuis le profil public du prestataire → bouton **"Solliciter les services"** → modale de demande :

- **Service souhaité** *(sélection parmi les services du prestataire)*
- **Intitulé de la tâche** *(ex : "Réparation fuite robinet cuisine")*
- **Description détaillée** *(champ texte libre, min 20 caractères)*
- **Lieu d'intervention** *(adresse précise ou sélection sur mini-carte)*
- **Date et heure souhaitées** *(date picker)*
- **Budget proposé** *(optionnel — dans la fourchette du prestataire)*
- **Photos jointes** *(optionnel — jusqu'à 3 photos)*

À la validation → création d'un document `requests/{requestId}` :
```
status: "pending"
clientId, providerId, service, title, description,
location, scheduledDate, budget, photos[], createdAt
```

### 10.3 Réception de la demande (côté prestataire)

- La requête apparaît en temps réel dans le **Dashboard prestataire** (Home) avec le statut **"Nouveau"**.
- Si le prestataire est en mode client au moment de la réception → **notification push + badge sur la cloche**.
- En cliquant sur la requête → affichage du détail complet (toutes les infos saisies par le client).

### 10.4 Actions du prestataire sur la requête

| Action | Résultat |
|---|---|
| **Accepter** | `status → "in_progress"` — une conversation est créée/ouverte automatiquement avec le client |
| **Refuser** | `status → "declined"` — le client est notifié, la requête disparaît du Dashboard |
| **Proposer un autre créneau** | Message automatique envoyé dans la messagerie |

### 10.5 États d'une requête

```
pending → in_progress → completed
         → declined
```

- **pending** : en attente de réponse du prestataire.
- **in_progress** : acceptée, travaux en cours ou négociation active.
- **completed** : tâche terminée, paiement effectué.
- **declined** : refusée par le prestataire.

---

## 11. MESSAGERIE ET DEVIS

### 11.1 Accès à la messagerie

- Liste des conversations dans l'onglet **Messages** (ClientTabNavigator et ProviderTabNavigator).
- Chaque item affiche : photo, nom, dernier message, heure, compteur de non-lus.
- Clic → ouverture du **ChatScreen**.

### 11.2 Fonctionnalités du chat

- Messagerie en temps réel via Firebase Realtime Database (`chats/{chatId}/messages/`).
- Types de messages :
  - **Texte**
  - **Image** (upload depuis galerie)
  - **Devis** (carte structurée)
  - **Message système** (ex : "Requête acceptée", "Tâche terminée confirmée")
- Indicateur de lecture (vu/non vu).
- Indicateur de frappe en cours.

### 11.3 Génération de devis (Devis)

*Fonctionnalité réservée aux prestataires Premium.*

Depuis le chat → bouton **"Générer un devis"** → formulaire :
- Intitulé de la prestation
- Détail des postes (lignes : description + montant)
- Sous-total, TVA (si applicable), total
- Conditions (délai, modalités de paiement)
- Date de validité du devis

Le devis est affiché dans le chat comme une **carte structurée** avec :
- Bouton **"Accepter le devis"** (côté client)
- Bouton **"Refuser / Négocier"** (côté client)

### 11.4 Acceptation du devis et clôture

1. **Le client accepte le devis** → `request.devisAccepted: true`, message système dans le chat.
2. **Le prestataire réalise la prestation.**
3. **Le client confirme la fin de la tâche** → bouton "Confirmer la fin" dans le chat ou depuis l'historique.
4. **Paiement effectué via l'application** (§12).
5. → `status: "completed"` → génération de l'historique des deux côtés + invitation à laisser un avis.

---

## 12. PAIEMENT ET COMMISSION

### 12.1 Méthodes de paiement

- **Orange Money**
- **MTN Mobile Money**

*(Intégration prévue en fin de développement.)*

### 12.2 Flux de paiement

1. Après confirmation de fin de tâche par le client → écran de paiement.
2. Le montant affiché = montant du devis accepté.
3. Le client choisit la méthode (Orange / MTN) et confirme.
4. Une **commission Djobna** est prélevée automatiquement (% défini en back-end).
5. Le **solde net** est crédité sur le compte prestataire dans l'application.

### 12.3 Portefeuille prestataire

- Solde disponible visible dans le Dashboard prestataire.
- Historique des transactions.
- Demande de retrait vers son compte Orange Money / MTN Money.
- Délai de retrait : immédiat ou sous 24h selon les règles définies.

---

## 13. ESPACE PRESTATAIRE — DASHBOARD (HOME)

### 13.1 Sections du Dashboard

**Bloc Statistiques rapides (en haut)**
- Missions du jour
- Note moyenne
- Revenus du mois (barre de progression vers l'objectif)
- Solde disponible

**Bloc Disponibilité**
- Toggle ON/OFF (disponible / indisponible).
- Quand OFF → le prestataire n'apparaît plus dans les recherches ni sur la carte.

**Bloc Requêtes entrantes**
- Liste des requêtes avec statut `pending`.
- Chaque carte affiche : service, nom du client, date souhaitée, budget proposé.
- Actions rapides : Accepter / Refuser / Voir le détail.

**Bloc Missions en cours**
- Liste des requêtes avec statut `in_progress`.
- Accès rapide à la messagerie correspondante.
- Bouton "Marquer comme terminée" (doit être confirmée par le client).

**Bloc Missions terminées (aujourd'hui)**
- Récapitulatif des tâches complétées dans la journée.

### 13.2 Abonnement Premium (bandeau)

- Si dans la période d'essai → bandeau avec compte à rebours.
- Si abonnement expiré → bandeau d'alerte avec bouton de renouvellement.
- Si Premium actif → badge discret avec date de renouvellement.

---

## 14. ESPACE PRESTATAIRE — PROFIL

### 14.1 Informations affichées et modifiables

- Photo de profil *(modifiable)*
- Nom complet *(modifiable)*
- Biographie *(modifiable)*
- Services et tarifs *(modifiables par service)*
- Zones d'intervention *(modifiables)*
- Langues parlées *(modifiables)*
- Numéro de téléphone *(non modifiable — lié à l'auth)*

### 14.2 Portfolio

- Galerie de photos uploadées par le prestataire.
- Ajout / suppression de photos.
- Légende optionnelle sur chaque photo.

### 14.3 Statistiques avancées (Premium)

- Évolution des revenus (graphique mensuel).
- Taux d'acceptation des requêtes.
- Note moyenne détaillée par critère.
- Nombre de vues du profil.
- Classement dans la catégorie de service.

### 14.4 Documents et vérification

- Statut du compte (vérifié / en attente / rejeté).
- Possibilité de re-soumettre les documents en cas de rejet.
- Lien vers les CGU et politique de confidentialité.

---

## 15. SYSTÈME DE NOTATION ET AVIS

### 15.1 Déclenchement

- Après chaque mission `completed` → notification push envoyée au client.
- Dans l'application → écran / modale d'évaluation.

### 15.2 Critères d'évaluation (côté client → prestataire)

- Note globale (1 à 5 étoiles)
- Ponctualité (1 à 5)
- Qualité du travail (1 à 5)
- Communication (1 à 5)
- Rapport qualité/prix (1 à 5)
- Commentaire libre *(optionnel, min 10 caractères si renseigné)*

### 15.3 Évaluation inverse (côté prestataire → client)

- Le prestataire peut aussi noter le client.
- Critères : Sérieux, Disponibilité, Communication.
- Visible uniquement par les prestataires (aide à filtrer les clients peu sérieux).

### 15.4 Gestion des avis

- Les avis sont modérables par l'équipe Djobna (signalement possible).
- La note moyenne du prestataire se recalcule automatiquement à chaque nouvel avis.
- Un prestataire peut répondre publiquement à un avis.

---

## 16. NOTIFICATIONS

### 16.1 Types de notifications push

| Événement | Destinataire |
|---|---|
| Nouvelle requête reçue | Prestataire |
| Requête acceptée | Client |
| Requête refusée | Client |
| Nouveau message | Client & Prestataire |
| Devis reçu | Client |
| Devis accepté | Prestataire |
| Fin de tâche confirmée | Prestataire |
| Paiement reçu | Prestataire |
| Avis laissé | Prestataire |
| Abonnement bientôt expiré (J-7, J-3, J-1) | Prestataire |
| Compte vérifié / rejeté | Prestataire |

### 16.2 Notifications in-app

- Icône cloche dans la barre de navigation avec badge compteur.
- Centre de notifications listant toutes les notifications récentes.
- Marquage lu/non-lu, suppression individuelle ou globale.

### 16.3 Préférences de notifications

- Depuis le profil (client et prestataire) → section "Notifications".
- Activation/désactivation par type de notification.
- Paramétrage des heures de non-dérangement.

---

## 17. HISTORIQUE ET STATISTIQUES

### 17.1 Historique client

- Liste de toutes les missions complétées avec le prestataire, le service, la date et le montant.
- Accès au devis et aux échanges de la mission.
- Possibilité de **re-solliciter** le même prestataire en un clic.

### 17.2 Historique prestataire

- Liste de toutes les missions complétées avec le client, le service, la date et le revenu net.
- Détail par mois et par type de service.
- Export possible (PDF) pour déclarations fiscales.

---

## 18. STRUCTURE DE LA BASE DE DONNÉES

### 18.1 Firestore Collections

```
users/{uid}
  displayName, phone, photoURL
  role: "client" | "provider" | "both"
  activeRole: "client" | "provider"
  city, quartier, country
  createdAt, updatedAt
  notificationPreferences: {}

clients/{uid}
  favoriteProviders: [uid]
  bookingHistory: [requestId]
  profileComplete: boolean
  rating: number (note en tant que client)

providers/{uid}
  displayName, photoURL, phone, bio
  city, quartier, country
  interventionZones: [string]
  services: [{ type, label, minPrice, maxPrice, unit }]
  languages: [string]
  yearsOfExperience: number
  availability: boolean
  location: { latitude, longitude }
  rating: { global, punctuality, quality, communication, valueForMoney }
  reviewCount: number
  verificationStatus: "pending" | "auto_approved" | "approved" | "rejected"
  rejectionReason: string
  subscription: { plan: "classic" | "premium", expiresAt, trialUsed }
  walletBalance: number
  totalEarnings: number
  portfolio: [{ url, caption, createdAt }]
  createdAt, updatedAt

requests/{requestId}
  clientId, providerId
  service, title, description
  location: { address, latitude, longitude }
  scheduledDate
  budget
  photos: [url]
  status: "pending" | "in_progress" | "completed" | "declined"
  devisAccepted: boolean
  devisId: string
  createdAt, updatedAt, completedAt

reviews/{reviewId}
  requestId, clientId, providerId
  ratedBy: "client" | "provider"
  ratings: { global, punctuality, quality, communication, valueForMoney }
  comment: string
  providerReply: string
  createdAt

notifications/{uid}/items/{notifId}
  type, title, body
  read: boolean
  relatedId (requestId, chatId, etc.)
  createdAt

subscriptions/{uid}
  plan, startedAt, expiresAt, autoRenew
  paymentMethod, transactionHistory: []

verification/{uid}
  cniRecto: url
  cniVerso: url
  selfieWithCNI: url
  submittedAt
  reviewedAt, reviewedBy
  status, rejectionReason
```

### 18.2 Firebase Realtime Database

```
chats/
  {chatId}/
    meta/
      participants: [uid, uid]
      requestId
      lastMessage: { text, senderId, timestamp }
      unreadCount: { [uid]: number }
    messages/
      {messageId}/
        senderId, text, type, timestamp
        imageUrl (si type = "image")
        devis: { title, items[], total, validUntil, status }
        read: boolean
```

---

*Fin du document — version complète v2.0*
*Toute modification de la logique applicative doit être répercutée ici.*

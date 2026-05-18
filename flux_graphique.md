# DJOBNA — REPRÉSENTATION GRAPHIQUE DES FLUX

> Diagrammes Mermaid. Pour les visualiser : clic droit sur le fichier dans VS Code → "Open Preview" (ou installer l'extension **"Markdown Preview Mermaid Support"**).

---

## 1. FLUX GLOBAL DE L'APPLICATION

```mermaid
flowchart TD
    A([🚀 Lancement App]) --> B[SplashScreen]
    B --> C{Utilisateur\nconnecté ?}
    C -- Non --> D[PhoneScreen]
    C -- Oui --> E{Profil\nexistant ?}
    D --> F[OTPScreen]
    F --> G{Code OTP\nvalide ?}
    G -- Non --> H[❌ Erreur / Shake\nRessayer]
    H --> F
    G -- Oui --> E
    E -- Non --> I[ProfileSetupScreen]
    E -- Oui --> J{activeRole ?}
    I --> J
    J -- client --> K[🏠 ClientTabNavigator]
    J -- provider --> L[📋 ProviderTabNavigator]

    K --> K1[Home]
    K --> K2[Map]
    K --> K3[Messages]
    K --> K4[Profil Client]

    L --> L1[Dashboard]
    L --> L2[Map]
    L --> L3[Messages]
    L --> L4[Profil Prestataire]
```

---

## 2. FLUX D'AUTHENTIFICATION OTP

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur
    participant A as 📱 App
    participant F as 🔥 Firebase Auth
    participant S as 📨 SMS

    U->>A: Saisit numéro de téléphone
    A->>A: Validation format numéro
    A->>F: Demande envoi OTP (reCAPTCHA invisible)
    F->>S: Envoie SMS avec code 6 chiffres
    S->>U: Reçoit le SMS
    U->>A: Saisit le code OTP
    A->>F: Vérifie le code OTP
    alt Code correct
        F-->>A: ✅ Token d'authentification
        A->>A: Vérifie profil dans Firestore
        alt Nouveau utilisateur
            A->>U: Redirige → ProfileSetupScreen
        else Utilisateur existant
            A->>U: Redirige → Écran principal (selon activeRole)
        end
    else Code incorrect
        F-->>A: ❌ Erreur
        A->>U: Animation shake + message d'erreur
    else Délai expiré (60s)
        A->>U: Bouton "Renvoyer le code"
        U->>A: Demande renvoi
        A->>F: Nouvelle demande OTP
    end
```

---

## 3. ONBOARDING CLIENT

```mermaid
flowchart TD
    A([Nouvel utilisateur]) --> B[ProfileSetupScreen\nRôle : Client]
    B --> C[Saisie : Nom complet]
    C --> D[Photo de profil\nfacultative]
    D --> E[Ville / Quartier / Pays]
    E --> F{Formulaire\ncomplet ?}
    F -- Non --> G[⚠️ Champs manquants\nhighlightés]
    G --> C
    F -- Oui --> H[Création users/uid\nrole: client\nactiveRole: client]
    H --> I[Création clients/uid]
    I --> J([✅ ClientTabNavigator\nHome])
```

---

## 4. ONBOARDING PRESTATAIRE — MULTI-ÉTAPES

```mermaid
flowchart TD
    A([Bouton 'Devenir Prestataire'\ndepuis Profil Client]) --> B

    subgraph STEP1 [Étape 1 — Infos personnelles]
        B[Nom, Téléphone pré-rempli\nPhoto obligatoire\nVille / Quartier / Pays\nZones d'intervention]
    end

    STEP1 --> C

    subgraph STEP2 [Étape 2 — Services & Tarifs]
        C[Sélection type de services\nPour chaque service :\n• Intitulé personnalisé\n• Tarif min / max\n• Unité]
    end

    STEP2 --> D

    subgraph STEP3 [Étape 3 — Description]
        D[Biographie\nAnnées d'expérience\nLangues parlées]
    end

    STEP3 --> E

    subgraph STEP4 [Étape 4 — KYC / Identité]
        E[📷 Photo CNI recto\n📷 Photo CNI verso\n🤳 Selfie avec CNI\nupload direct uniquement]
    end

    STEP4 --> F

    subgraph STEP5 [Étape 5 — Récapitulatif]
        F[Relecture de toutes\nles informations]
    end

    STEP5 --> G[Bouton 'Soumettre']
    G --> H[Création providers/uid\nverificationStatus: pending]
    H --> I([⏳ Écran d'attente\nVérification en cours])
```

---

## 5. FLUX DE VÉRIFICATION DU COMPTE PRESTATAIRE

```mermaid
flowchart TD
    A([Documents soumis\nverificationStatus: pending]) --> B

    subgraph AUTO [Phase 1 — IA automatique]
        B[OCR de la CNI\nLecture nom + numéro]
        B --> C[Comparaison visage\nCNI vs Selfie]
        C --> D{Score de\nconfiance ?}
    end

    D -- Suffisant --> E[verificationStatus:\nauto_approved]
    D -- Insuffisant --> F

    subgraph MANUAL [Phase 2 — Modération manuelle]
        F[Dashboard back-office\nOpérateur examine les docs]
        F --> G{Décision\nopérateur ?}
    end

    G -- Approuvé --> E
    G -- Rejeté --> H[verificationStatus: rejected\n+ motif de rejet]

    E --> I[🔔 Notification Push\n'Compte approuvé']
    E --> J[1 mois Premium\noffert automatiquement]
    J --> K([✅ ProviderTabNavigator\nactif])

    H --> L[🔔 Notification Push\n'Compte rejeté' + motif]
    L --> M[Prestataire peut\nre-soumettre les docs]
    M --> A
```

---

## 6. FLUX DE DEMANDE DE SERVICE

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant A as 📱 App
    participant DB as 🔥 Firestore
    participant P as 🔧 Prestataire

    C->>A: Visite profil prestataire
    C->>A: Clique "Solliciter les services"
    A->>A: Vérifie profil client complet
    alt Profil incomplet
        A-->>C: ⚠️ "Complète ton profil d'abord"
    else Profil complet
        A->>C: Affiche modale de demande
        C->>A: Remplit le formulaire\n(service, description, lieu,\ndate, budget, photos)
        A->>DB: Crée requests/{id}\nstatus: pending
        DB->>P: 🔔 Notification "Nouvelle requête"
        P->>A: Ouvre la requête
        alt Prestataire Accepte
            P->>DB: status → in_progress
            DB->>C: 🔔 Notification "Requête acceptée"
            A->>A: Ouvre conversation\nClient ↔ Prestataire
        else Prestataire Refuse
            P->>DB: status → declined
            DB->>C: 🔔 Notification "Requête refusée"
            A->>C: Requête disparaît de la liste
        end
    end
```

---

## 7. ÉTATS D'UNE REQUÊTE

```mermaid
stateDiagram-v2
    [*] --> pending : Client soumet la demande

    pending --> in_progress : Prestataire accepte
    pending --> declined : Prestataire refuse

    in_progress --> completed : Client confirme fin\n+ Paiement effectué

    declined --> [*] : Notification client\nArchivage

    completed --> [*] : Historique généré\nInvitation à noter

    note right of pending
        🔔 Notif prestataire
        Visible dans Dashboard
    end note

    note right of in_progress
        Chat ouvert
        Devis possible
    end note

    note right of completed
        Paiement prélevé
        Commission déduite
    end note
```

---

## 8. FLUX MESSAGERIE ET DEVIS

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant CHAT as 💬 Chat
    participant P as 🔧 Prestataire

    Note over C,P: Requête acceptée → Chat automatiquement ouvert

    P->>CHAT: Envoie message texte\n(négociation, détails)
    CHAT->>C: 🔔 Nouveau message
    C->>CHAT: Répond

    Note over P: Prestataire Premium uniquement
    P->>CHAT: Génère un Devis\n(items, total, validité)
    CHAT->>C: 📄 Carte "Devis reçu"

    alt Client Accepte le devis
        C->>CHAT: ✅ "Accepter le devis"
        CHAT->>P: 🔔 Devis accepté
        Note over C,P: Travaux réalisés
        C->>CHAT: ✅ "Confirmer fin de tâche"
        CHAT->>CHAT: Message système\n"Tâche terminée"
        Note over C,P: → Paiement (§9)
    else Client Refuse / Négocie
        C->>CHAT: ❌ "Refuser / Négocier"
        C->>CHAT: Envoie contre-proposition
        P->>CHAT: Génère nouveau devis
    end
```

---

## 9. FLUX DE PAIEMENT

```mermaid
flowchart TD
    A([Client confirme\nfin de tâche]) --> B[Écran de paiement]
    B --> C[Montant affiché\n= Devis accepté]
    C --> D{Choix méthode\nde paiement}
    D --> E[Orange Money]
    D --> F[MTN Mobile Money]
    E --> G[Confirmation\nde paiement]
    F --> G
    G --> H{Paiement\nvalidé ?}
    H -- Non --> I[❌ Erreur\nRessayer]
    I --> D
    H -- Oui --> J[Prélèvement commission\nDjobna]
    J --> K[Crédit solde net\nvers prestataire]
    K --> L[requests/id\nstatus: completed]
    L --> M[Génération historique\nclient + prestataire]
    M --> N[🔔 Notif prestataire\nPaiement reçu]
    N --> O([Invitation à noter\nle prestataire])
```

---

## 10. SYSTÈME D'ABONNEMENT

```mermaid
stateDiagram-v2
    [*] --> trial : Compte approuvé\n1 mois Premium offert

    trial --> premium : Souscrit avant\nexpiration

    trial --> classic : N'a pas souscrit\nà l'expiration

    classic --> premium : Souscription payante\n(Orange / MTN Money)

    premium --> classic : Non-renouvellement\nou paiement échoué

    premium --> premium : Renouvellement\nautomatique mensuel

    note right of trial
        Durée : 30 jours
        Fonctionnalités illimitées
        Bandeau compte à rebours
        Rappels J-7, J-3, J-1
    end note

    note right of premium
        Requêtes illimitées
        Génération de devis
        Stats avancées
        Badge Premium
        Priorité dans les résultats
    end note

    note right of classic
        Max 10 requêtes/mois
        Pas de devis
        Stats basiques
    end note
```

---

## 11. BASCULE DE RÔLE CLIENT ↔ PRESTATAIRE

```mermaid
flowchart LR
    A([Utilisateur connecté]) --> B{Profil\nprestataire\nexistant ?}

    B -- Non --> C[Bouton\n'Devenir prestataire']
    C --> D[Flow Onboarding\nPrestataire §4]
    D --> E[providers/uid créé]
    E --> F[activeRole: provider]

    B -- Oui --> G[Bouton\n'Passer en mode\nPrestataire']
    G --> F

    F --> H([ProviderTabNavigator])

    H --> I[Bouton\n'Passer en mode\nClient']
    I --> J[activeRole: client]
    J --> K([ClientTabNavigator])
    K --> G
```

---

## 12. FLUX DE NOTATION ET AVIS

```mermaid
flowchart TD
    A([Requête completed\nPaiement effectué]) --> B[🔔 Notification push\nau client]
    B --> C[Écran / Modale\nd'évaluation]

    subgraph EVAL_CLIENT [Évaluation Client → Prestataire]
        C --> D[Note globale ⭐ 1-5]
        D --> E[Ponctualité ⭐ 1-5]
        E --> F[Qualité du travail ⭐ 1-5]
        F --> G[Communication ⭐ 1-5]
        G --> H[Rapport qualité/prix ⭐ 1-5]
        H --> I[Commentaire libre\noptionnel]
    end

    I --> J[Sauvegarde reviews/id]
    J --> K[Recalcul note moyenne\nproviders/uid]

    A --> L[🔔 Invitation au\nprestataire]

    subgraph EVAL_PROVIDER [Évaluation Prestataire → Client]
        L --> M[Sérieux ⭐ 1-5]
        M --> N[Disponibilité ⭐ 1-5]
        N --> O[Communication ⭐ 1-5]
    end

    O --> P[Sauvegarde dans\nclients/uid.rating]
    P --> Q([✅ Historique complet\ngénéré des 2 côtés])
```

---

## 13. FLUX NOTIFICATIONS

```mermaid
flowchart LR
    subgraph EVENTS [Événements déclencheurs]
        E1[Nouvelle requête]
        E2[Requête acceptée/refusée]
        E3[Nouveau message]
        E4[Devis reçu/accepté]
        E5[Fin de tâche confirmée]
        E6[Paiement reçu]
        E7[Avis laissé]
        E8[Abonnement J-7, J-3, J-1]
        E9[Compte vérifié/rejeté]
    end

    subgraph CHANNELS [Canaux]
        C1[📲 Push Notification\nexpo-notifications]
        C2[🔔 In-App Badge\ncloche avec compteur]
        C3[📋 Centre de notifs\nliste in-app]
    end

    E1 --> C1 & C2 & C3
    E2 --> C1 & C2 & C3
    E3 --> C1 & C2 & C3
    E4 --> C1 & C2 & C3
    E5 --> C1 & C2 & C3
    E6 --> C1 & C2 & C3
    E7 --> C2 & C3
    E8 --> C1 & C3
    E9 --> C1 & C3
```

---

## 14. ARCHITECTURE GÉNÉRALE DES DONNÉES

```mermaid
erDiagram
    USERS {
        string uid PK
        string displayName
        string phone
        string photoURL
        string role
        string activeRole
        string city
        string quartier
    }

    CLIENTS {
        string uid PK
        array favoriteProviders
        array bookingHistory
        boolean profileComplete
        number rating
    }

    PROVIDERS {
        string uid PK
        array services
        boolean availability
        object location
        object rating
        string verificationStatus
        object subscription
        number walletBalance
    }

    REQUESTS {
        string requestId PK
        string clientId FK
        string providerId FK
        string service
        string status
        boolean devisAccepted
        string devisId
        timestamp scheduledDate
    }

    REVIEWS {
        string reviewId PK
        string requestId FK
        string clientId FK
        string providerId FK
        string ratedBy
        object ratings
        string comment
    }

    VERIFICATION {
        string uid PK
        string cniRecto
        string cniVerso
        string selfieWithCNI
        string status
    }

    CHATS {
        string chatId PK
        array participants
        string requestId FK
        object lastMessage
    }

    MESSAGES {
        string messageId PK
        string chatId FK
        string senderId FK
        string type
        string text
        object devis
    }

    USERS ||--|| CLIENTS : "est un"
    USERS ||--|| PROVIDERS : "peut être"
    USERS ||--|| VERIFICATION : "soumet"
    CLIENTS ||--o{ REQUESTS : "crée"
    PROVIDERS ||--o{ REQUESTS : "reçoit"
    REQUESTS ||--o{ REVIEWS : "génère"
    REQUESTS ||--|| CHATS : "associée à"
    CHATS ||--o{ MESSAGES : "contient"
```

---

*Document généré à partir du flux_de_fonctionnement.md — v2.0*

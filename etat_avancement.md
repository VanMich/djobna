# État d'avancement — Djobna
*Dernière mise à jour : 17/05/2026*

---

## Légende
- ✅ Fait et fonctionnel
- ⚠️ Partiellement fait (fonctionne mais incomplet)
- ❌ Pas encore fait
- 🔜 Prévu en fin de développement

---

## Section 1 — Authentification

| Fonctionnalité | État |
|---|---|
| Connexion par numéro de téléphone (OTP Firebase) | ✅ |
| reCAPTCHA invisible (expo-firebase-recaptcha) | ✅ |
| Flux : Splash → Phone → OTP → ProfileSetup → MainApp | ✅ |
| Persistance de session (onAuthStateChanged) | ✅ |
| Déconnexion depuis profil | ✅ |

---

## Section 2 — Création de profil client

| Fonctionnalité | État |
|---|---|
| Formulaire : displayName, photo, ville, quartier, pays | ✅ |
| Création `users/{uid}` avec `activeRole: "client"` | ✅ |
| Création `clients/{uid}` (favoris, historique) | ✅ |
| Upload photo de profil (Firebase Storage) | ❌ `photoURL = null` en attendant |

---

## Section 3 — Création compte prestataire

| Fonctionnalité | État |
|---|---|
| ProviderSetupScreen (5 étapes) | ✅ |
| Étape 0 : identité, ville, quartier, zones | ✅ |
| Étape 1 : services + tarifs (customLabel, min/max, unité) | ✅ |
| Étape 2 : bio, années d'expérience, langues | ✅ |
| Étape 3 : CNI recto/verso (galerie), selfie (caméra) | ✅ UI seulement |
| Étape 4 : récap + soumission | ✅ |
| Création `providers/{uid}` dans Firestore | ✅ |
| Création `verification/{uid}` dans Firestore | ✅ |
| Mise à jour `users/{uid}.role = "both"` | ✅ |
| VerificationPendingScreen | ✅ |
| Upload photos KYC (Firebase Storage) | ❌ `null` en attendant |

---

## Section 4 — Vérification KYC (back-office)

| Fonctionnalité | État |
|---|---|
| Interface admin pour consulter les dossiers | ❌ Pas de back-office |
| Approbation / rejet avec motif | ❌ |
| Mise à jour automatique `verificationStatus` | ❌ |
| Re-soumission des documents en cas de rejet | ❌ |
| **Contournement pour les tests** : passer `verificationStatus` à `"approved"` manuellement dans la Firebase Console | ⚠️ |

---

## Section 5 — Système d'abonnement

| Fonctionnalité | État |
|---|---|
| Plans Classic / Premium | 🔜 Fin de développement |
| Période d'essai | 🔜 |
| Bandeau Premium dans le Dashboard | ❌ |
| Badge Premium sur les profils et marqueurs carte | ✅ Affiché si `subscription.plan === "premium"` |

---

## Section 6 — Navigation et changement de rôle

| Fonctionnalité | État |
|---|---|
| `AppNavigator` avec `onSnapshot` sur `activeRole` | ✅ |
| `ClientTabNavigator` (Home / Map / Messages / Profil) | ✅ |
| `ProviderTabNavigator` (Dashboard / Map / Messages / Profil) | ✅ |
| `useRoleSwitch` : bascule client ↔ prestataire | ✅ |
| Card de bascule dans `ClientProfileScreen` (4 états) | ✅ |
| Card "Passer en mode Client" dans `ProviderProfileOwnScreen` | ✅ |
| Tab bar qui change automatiquement sans rechargement | ✅ |

---

## Section 7 — Espace Client — Accueil

| Fonctionnalité | État |
|---|---|
| Barre de recherche textuelle (inline TextInput) | ✅ |
| Filtre : catégorie de service (chips) | ✅ |
| Filtre : quartier (chips, 32 quartiers de Douala) | ✅ |
| Filtre : note minimale (Tous / 3+ / 4+ / 4.5+) | ✅ |
| Tags filtres actifs supprimables | ✅ |
| `useProviders` avec filtrage client-side | ✅ |
| Skeleton loading (shimmer) | ✅ |
| Animations d'entrée des cartes (stagger + spring) | ✅ |
| `ProviderCard` : photo, nom, service, note, quartier, prix | ✅ |
| Badge Premium sur les cartes | ✅ |
| Badge Vérifié sur les cartes | ✅ |
| Prix réels depuis `servicePricing` Firestore | ✅ |
| Clic sur une carte → `ProviderProfileScreen` | ✅ |
| État vide (aucun résultat) avec animation | ✅ |

---

## Section 8 — Espace Client — Carte (Map)

| Fonctionnalité | État |
|---|---|
| Centrage sur position GPS du client | ✅ |
| Fallback sur Douala si GPS refusé | ✅ |
| Marqueurs prestataires (colorés par service) | ✅ |
| Badge Premium sur les marqueurs | ✅ |
| Clic marqueur → modale slide-up | ✅ |
| Modale : photo, nom, service, note, quartier, badge vérifié | ✅ |
| Bouton "Voir le profil" dans la modale | ✅ |
| Bouton "Solliciter" dans la modale | ✅ |
| Filtres : service + quartier + note minimale | ✅ |
| Recherche textuelle | ✅ |
| Rayon d'affichage 5km | ❌ Tous les prestataires avec `location` sont affichés |

---

## Section 9 — Profil public prestataire

| Fonctionnalité | État |
|---|---|
| Structure 3 onglets (Profil / Réalisations / Avis) | ✅ |
| Photo, nom, badge vérifié, badge Premium | ✅ |
| Stats : note, nombre d'avis, missions, expérience | ✅ |
| Services avec fourchettes de prix réelles (`servicePricing`) | ✅ |
| Zones d'intervention | ✅ |
| Biographie | ✅ |
| Langues parlées | ✅ |
| Bouton "Solliciter les services" | ✅ |
| Vérification profil client complet avant sollicitation | ✅ |
| Bouton "Ajouter aux favoris" (cœur) | ⚠️ Local uniquement — non persisté en Firestore |
| Galerie portfolio (onglet Réalisations) | ✅ |
| Liste avis avec nom, date, note, commentaire | ✅ |
| Résumé avis : note globale + barres distribution | ✅ |
| Notes détaillées par critère (ponctualité, qualité…) | ✅ |
| Partage du profil | ⚠️ Message texte simple, pas de deep link |

---

## Section 10 — Flux de demande de service

| Fonctionnalité | État |
|---|---|
| `ServiceRequestModal` (7 champs) | ✅ |
| Sélection du service (chips) | ✅ |
| Intitulé de la tâche | ✅ |
| Description (min 20 caractères, compteur) | ✅ |
| Lieu d'intervention | ✅ |
| Date et heure souhaitées | ✅ |
| Budget proposé (optionnel) | ✅ |
| Photos jointes (max 3, expo-image-picker) | ✅ UI — upload Firebase Storage ❌ |
| Création `requests/{id}` dans Firestore | ✅ |
| Réception en temps réel dans le Dashboard prestataire | ✅ |
| `RequestCard` : service, titre, description, lieu, date, budget | ✅ |
| Action Accepter → `status: "in_progress"` | ✅ |
| Action Décliner → `status: "declined"` | ✅ |
| Action "Proposer un autre créneau" → Chat | ✅ |
| Initialisation conversation RTDB à l'acceptation | ✅ |
| Notification push à l'acceptation / au refus | ❌ |
| Écran de détail complet d'une requête | ❌ |

---

## Section 11 — Messagerie et devis

| Fonctionnalité | État |
|---|---|
| `ChatScreen` en temps réel (Firebase RTDB) | ✅ |
| Messages texte | ✅ |
| Messages image (upload galerie) | ⚠️ UI présent — Firebase Storage ❌ |
| Carte de devis structurée (`DevisCard`) | ✅ |
| Répondre au devis (Accepter / Refuser) | ✅ |
| Indicateur de lecture (vu/non vu) | ⚠️ Partiel |
| Liste des conversations (onglet Messages) | ❌ À vérifier / compléter |
| Compteur de non-lus dans la tab bar | ❌ |
| Indicateur de frappe en cours | ❌ |
| Messages système ("Requête acceptée", "Tâche terminée") | ❌ |
| Formulaire de génération de devis (Premium) | ❌ |

---

## Section 12 — Paiement et commission

| Fonctionnalité | État |
|---|---|
| Orange Money | 🔜 Fin de développement |
| MTN Mobile Money | 🔜 Fin de développement |
| Commission Djobna automatique | 🔜 |
| Portefeuille prestataire | 🔜 |
| Historique transactions | 🔜 |
| Demande de retrait | 🔜 |

---

## Section 13 — Dashboard prestataire

| Fonctionnalité | État |
|---|---|
| Stats rapides : missions du jour, note, revenus | ✅ |
| Toggle disponibilité ON/OFF + GPS | ✅ |
| Champ `availability` cohérent avec `useProviders` | ✅ |
| Bloc requêtes entrantes (`pending`) en temps réel | ✅ |
| Bloc missions en cours (`in_progress`) | ✅ |
| Accès rapide messagerie depuis une mission | ✅ |
| Solde disponible dans les stats | ❌ |
| Bloc missions terminées (aujourd'hui) | ❌ |
| Bouton "Marquer comme terminée" sur les missions | ❌ |
| Bandeau abonnement Premium (essai / expiré / actif) | ❌ |

---

## Section 14 — Profil prestataire (propre)

| Fonctionnalité | État |
|---|---|
| Affichage : services avec prix, portfolio, revenus | ✅ |
| Section services énumérés avec style (numéro, icône, prix) | ✅ |
| `EditProfileSheet` : modifier bio, nom, quartier | ✅ |
| Portfolio : ajouter / supprimer des photos | ✅ |
| Toggle notifications (messages / demandes) | ✅ UI — non persisté |
| Modification des services et tarifs | ❌ |
| Modification des zones d'intervention | ❌ |
| Modification des langues parlées | ❌ |
| Re-soumission KYC en cas de rejet | ❌ |
| Légende sur les photos portfolio | ❌ |
| Statistiques avancées Premium (graphiques) | ❌ |

---

## Section 15 — Notation et avis

| Fonctionnalité | État |
|---|---|
| Modale / écran d'évaluation après mission complétée | ❌ |
| Critères côté client (global + ponctualité + qualité + communication + valeur) | ❌ |
| Recalcul automatique de la note moyenne | ❌ |
| Évaluation inverse prestataire → client | ❌ |
| Réponse publique d'un prestataire à un avis | ❌ |
| Signalement d'un avis | ❌ |

---

## Section 16 — Notifications

| Fonctionnalité | État |
|---|---|
| `expo-notifications` installé | ✅ |
| Configuration et envoi de notifications push | ❌ |
| Centre de notifications (écran) | ❌ |
| Badge compteur sur l'icône cloche | ❌ |
| Marquage lu / non-lu | ❌ |
| Préférences par type de notification | ❌ UI présent (switches) — non persisté |

---

## Section 17 — Historique et statistiques

| Fonctionnalité | État |
|---|---|
| Historique missions côté client | ❌ |
| Re-solliciter un prestataire depuis l'historique | ❌ |
| Historique missions côté prestataire | ❌ |
| Détail par mois et par service | ❌ |
| Export PDF | ❌ |

---

## Section 18 — Structure base de données

| Fonctionnalité | État |
|---|---|
| `users/{uid}` conforme au flux | ✅ |
| `clients/{uid}` conforme | ✅ |
| `providers/{uid}` : champs principaux conformes | ✅ |
| `providers.services` : stocké comme `string[]` + `servicePricing{}` séparé | ⚠️ Diverge du flux (qui définit un tableau d'objets) — fonctionne néanmoins |
| `verification/{uid}` conforme | ✅ |
| `requests/{id}` : champs principaux conformes | ✅ |
| `requests.location` : stocké comme `string` au lieu de `{address, lat, lng}` | ⚠️ |
| `reviews/{id}` | ❌ Non implémenté |
| `notifications/{uid}/items/{id}` | ❌ Non implémenté |
| `subscriptions/{uid}` | ❌ Non implémenté |
| RTDB `chats/{chatId}/messages/` | ✅ |
| RTDB `chats/{chatId}/meta/` | ✅ |

---

## Résumé global

| Section | Avancement |
|---|---|
| 1. Authentification | ✅ Complet |
| 2. Profil client | ⚠️ Storage manquant |
| 3. Création compte prestataire | ⚠️ Storage manquant |
| 4. Vérification KYC | ❌ Pas de back-office |
| 5. Abonnement | 🔜 Fin de dev |
| 6. Navigation / rôles | ✅ Complet |
| 7. Accueil client | ✅ Complet |
| 8. Carte | ✅ Complet (rayon 5km non filtré) |
| 9. Profil public prestataire | ✅ Complet (favoris non persistés) |
| 10. Demande de service | ✅ Complet (Storage + notifs push manquants) |
| 11. Messagerie | ⚠️ Chat OK, liste conversations + devis formulaire manquants |
| 12. Paiement | 🔜 Fin de dev |
| 13. Dashboard prestataire | ⚠️ Missions terminées + solde manquants |
| 14. Profil prestataire propre | ⚠️ Modification services/zones/langues manquante |
| 15. Notation et avis | ❌ Pas commencé |
| 16. Notifications | ❌ Pas commencé |
| 17. Historique | ❌ Pas commencé |
| 18. Base de données | ⚠️ Quelques divergences mineures |

---

## Prochaines priorités recommandées

1. **§11** — Liste des conversations (onglet Messages) et compteur non-lus
2. **§13** — Bouton "Marquer comme terminée" sur les missions
3. **§15** — Modale de notation après mission complétée
4. **§16** — Notifications push (expo-notifications déjà installé)
5. **§14** — Modification services/tarifs/zones depuis le profil prestataire
6. **§17** — Historique missions côté client et prestataire
7. **Firebase Storage** — upload photos (profil, KYC, portfolio, demandes)
8. **§4** — Back-office KYC (interface web séparée)
9. **§12** — Paiement (Orange Money / MTN)
10. **§5** — Abonnement Premium

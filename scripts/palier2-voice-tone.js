/**
 * Palier 2 — Voice & tone harmonization
 * - "prestataire" → "pro" in user-facing strings
 * - Vouvoiement → tutoiement (vous→tu, votre→ton/ta, vos→tes)
 * - Concrete CTAs
 *
 * Each replacement is an exact literal match → safe, no regex surprises.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src");

// [filePath relative to src, oldString, newString]
const REPLACEMENTS = [

  // ═══ SplashScreen.jsx ═══
  ["screens/SplashScreen.jsx",
   'Trouvez le bon prestataire{"\\n"}près de chez vous, maintenant.',
   'Trouve le bon pro{"\\n"}près de chez toi, maintenant.'],

  // ═══ PhoneScreen.jsx ═══
  ["screens/PhoneScreen.jsx",
   'Entrez votre{"\\n"}numéro de téléphone',
   'Entre ton{"\\n"}numéro de téléphone'],
  ["screens/PhoneScreen.jsx",
   "Un SMS vous sera envoyé pour confirmer",
   "Un SMS te sera envoyé pour confirmer"],

  // ═══ ProfileSetupScreen.jsx ═══
  ["screens/ProfileSetupScreen.jsx",
   "Nous avons besoin d’accéder à vos photos.",
   "Nous avons besoin d’accéder à tes photos."],
  ["screens/ProfileSetupScreen.jsx",
   "Entrez votre nom complet\")",
   "Entre ton nom complet\")"],
  ["screens/ProfileSetupScreen.jsx",
   "Entrez votre ville\")",
   "Entre ta ville\")"],
  ["screens/ProfileSetupScreen.jsx",
   "Choisissez votre quartier\")",
   "Choisis ton quartier\")"],
  ["screens/ProfileSetupScreen.jsx",
   "Entrez votre pays\")",
   "Entre ton pays\")"],
  ["screens/ProfileSetupScreen.jsx",
   "Créez votre profil",
   "Crée ton profil"],
  ["screens/ProfileSetupScreen.jsx",
   "Ces informations seront visibles sur votre compte",
   "Ces informations seront visibles sur ton compte"],
  ["screens/ProfileSetupScreen.jsx",
   "Depuis votre galerie",
   "Depuis ta galerie"],
  ["screens/ProfileSetupScreen.jsx",
   "Choisissez votre quartier\"",
   "Choisis ton quartier\""],
  ["screens/ProfileSetupScreen.jsx",
   "Entrez votre quartier\"",
   "Entre ton quartier\""],

  // ═══ ProviderSetupScreen.jsx ═══
  ["screens/ProviderSetupScreen.jsx",
   "Vos coordonnées de prestataire",
   "Tes coordonnées de pro"],
  ["screens/ProviderSetupScreen.jsx",
   "Ce que vous proposez et à quel prix",
   "Ce que tu proposes et à quel prix"],
  ["screens/ProviderSetupScreen.jsx",
   "Votre profil\", subtitle: \"Présentez votre expérience",
   "Ton profil\", subtitle: \"Présente ton expérience"],
  ["screens/ProviderSetupScreen.jsx",
   "Documents requis pour valider votre compte",
   "Documents requis pour valider ton compte"],
  ["screens/ProviderSetupScreen.jsx",
   "Vérifiez avant de soumettre",
   "Vérifie avant de soumettre"],
  ["screens/ProviderSetupScreen.jsx",
   "Entrez votre nom complet.\"",
   "Entre ton nom complet.\""],
  ["screens/ProviderSetupScreen.jsx",
   "Entrez votre ville.\"",
   "Entre ta ville.\""],
  ["screens/ProviderSetupScreen.jsx",
   "Choisissez votre quartier.\"",
   "Choisis ton quartier.\""],
  ["screens/ProviderSetupScreen.jsx",
   "Sélectionnez au moins une zone d'intervention.",
   "Sélectionne au moins une zone d'intervention."],
  ["screens/ProviderSetupScreen.jsx",
   "Sélectionnez au moins un service.",
   "Sélectionne au moins un service."],
  ["screens/ProviderSetupScreen.jsx",
   "Renseignez l'intitulé de chaque service.",
   "Renseigne l'intitulé de chaque service."],
  ["screens/ProviderSetupScreen.jsx",
   "Renseignez les tarifs min et max.",
   "Renseigne les tarifs min et max."],
  ["screens/ProviderSetupScreen.jsx",
   "Sélectionnez au moins une langue.",
   "Sélectionne au moins une langue."],
  ["screens/ProviderSetupScreen.jsx",
   "Ajoutez la photo recto de votre CNI.",
   "Ajoute la photo recto de ta CNI."],
  ["screens/ProviderSetupScreen.jsx",
   "Ajoutez la photo verso de votre CNI.",
   "Ajoute la photo verso de ta CNI."],
  ["screens/ProviderSetupScreen.jsx",
   "Prenez un selfie avec votre CNI en main.",
   "Prends un selfie avec ta CNI en main."],
  ["screens/ProviderSetupScreen.jsx",
   "Depuis votre galerie",
   "Depuis ta galerie"],
  ["screens/ProviderSetupScreen.jsx",
   "Choisissez votre quartier",
   "Choisis ton quartier"],
  ["screens/ProviderSetupScreen.jsx",
   "Entrez votre quartier manuellement",
   "Entre ton quartier manuellement"],
  ["screens/ProviderSetupScreen.jsx",
   "Sélectionnez vos zones",
   "Sélectionne tes zones"],
  ["screens/ProviderSetupScreen.jsx",
   "Sélectionnez vos services puis définissez vos tarifs.",
   "Sélectionne tes services puis définis tes tarifs."],
  ["screens/ProviderSetupScreen.jsx",
   "Décrivez votre expertise, votre façon de travailler, ce qui vous distingue... (min. 50 caractères)",
   "Décris ton expertise, ta façon de travailler, ce qui te distingue... (min. 50 caractères)"],
  ["screens/ProviderSetupScreen.jsx",
   "Ces documents sont nécessaires pour valider votre compte. Ils sont traités de manière confidentielle.",
   "Ces documents sont nécessaires pour valider ton compte. Ils sont traités de manière confidentielle."],
  ["screens/ProviderSetupScreen.jsx",
   "Tenez votre CNI bien visible à côté de votre visage.",
   "Tiens ta CNI bien visible à côté de ton visage."],
  ["screens/ProviderSetupScreen.jsx",
   "Après soumission, votre dossier sera examiné sous 24 à 48 heures. Vous serez notifié par l'application.",
   "Après soumission, ton dossier sera examiné sous 24 à 48 heures. Tu seras notifié par l'application."],

  // ═══ ClientProfileScreen.jsx ═══
  ["screens/ClientProfileScreen.jsx",
   "Votre dossier a été rejeté. Vous pouvez soumettre à nouveau vos documents.",
   "Ton dossier a été rejeté. Tu peux soumettre à nouveau tes documents."],
  ["screens/ClientProfileScreen.jsx",
   "Vous devrez vous reconnecter avec votre numéro de téléphone.",
   "Tu devras te reconnecter avec ton numéro de téléphone."],
  ["screens/ClientProfileScreen.jsx",
   "Cette action est irréversible. Toutes vos données seront supprimées.",
   "Cette action est irréversible. Toutes tes données seront supprimées."],
  ["screens/ClientProfileScreen.jsx",
   "Contactez le support pour supprimer votre compte.",
   "Contacte le support pour supprimer ton compte."],
  ["screens/ClientProfileScreen.jsx",
   "\"Devenir prestataire\"",
   "\"Devenir pro\""],
  ["screens/ClientProfileScreen.jsx",
   "\"Passer en mode Prestataire\"",
   "\"Passer en mode Pro\""],
  ["screens/ClientProfileScreen.jsx",
   "\"Proposez vos services sur Djobna\"",
   "\"Propose tes services sur Djobna\""],
  ["screens/ClientProfileScreen.jsx",
   "\"Votre dossier est en cours d'examen\"",
   "\"Ton dossier est en cours d'examen\""],
  ["screens/ClientProfileScreen.jsx",
   "\"Votre compte prestataire est validé\"",
   "\"Ton compte pro est validé\""],
  ["screens/ClientProfileScreen.jsx",
   "\"Mes prestataires favoris\"",
   "\"Mes pros favoris\""],
  ["screens/ClientProfileScreen.jsx",
   "Suivre vos demandes en cours",
   "Suivre tes demandes en cours"],
  ["screens/ClientProfileScreen.jsx",
   "\"Offres prestataires\"",
   "\"Offres pro\""],

  // ═══ HomeProviderScreen.jsx ═══
  ["screens/HomeProviderScreen.jsx",
   "Votre abonnement Premium a expiré. Renouvelez pour rester visible.",
   "Ton abonnement Premium a expiré. Renouvelle pour rester visible."],
  ["screens/HomeProviderScreen.jsx",
   "Vous êtes hors ligne",
   "Tu es hors ligne"],
  ["screens/HomeProviderScreen.jsx",
   "Activez votre disponibilité pour recevoir des demandes de clients.",
   "Active ta disponibilité pour recevoir des demandes de clients."],
  ["screens/HomeProviderScreen.jsx",
   "Vous êtes visible sur la carte. Les clients peuvent vous contacter.",
   "Tu es visible sur la carte. Les clients peuvent te contacter."],

  // ═══ VerificationPendingScreen.jsx ═══
  ["screens/VerificationPendingScreen.jsx",
   "Votre dossier est en cours d'examen. Notre équipe vérifie vos informations et vos documents d'identité.",
   "Ton dossier est en cours d'examen. Notre équipe vérifie tes informations et tes documents d'identité."],
  ["screens/VerificationPendingScreen.jsx",
   "Vérification automatique de votre CNI (quelques minutes)",
   "Vérification automatique de ta CNI (quelques minutes)"],
  ["screens/VerificationPendingScreen.jsx",
   "En attendant, vous pouvez continuer à utiliser Djobna en tant que client.",
   "En attendant, tu peux continuer à utiliser Djobna en tant que client."],

  // ═══ ProviderProfileScreen.jsx ═══
  ["screens/ProviderProfileScreen.jsx",
   "\"Votre avis a été publié.\"",
   "\"Ton avis a été publié.\""],
  ["screens/ProviderProfileScreen.jsx",
   "\"Signaler ce prestataire\"",
   "\"Signaler ce pro\""],
  ["screens/ProviderProfileScreen.jsx",
   "Complétez votre profil (nom et quartier) avant de solliciter un prestataire.",
   "Complète ton profil (nom et quartier) avant de contacter un pro."],
  ["screens/ProviderProfileScreen.jsx",
   "Ce prestataire n'est plus disponible.",
   "Ce pro n'est plus disponible."],

  // ═══ ProviderProfileOwnScreen.jsx ═══
  ["screens/ProviderProfileOwnScreen.jsx",
   "\"Vos documents sont en cours d'examen par notre équipe.\"",
   "\"Tes documents sont en cours d'examen par notre équipe.\""],
  ["screens/ProviderProfileOwnScreen.jsx",
   "\"Soumettez à nouveau vos pièces justificatives.\"",
   "\"Soumets à nouveau tes pièces justificatives.\""],
  ["screens/ProviderProfileOwnScreen.jsx",
   "\"La vérification augmente votre visibilité sur la carte.\"",
   "\"La vérification augmente ta visibilité sur la carte.\""],
  ["screens/ProviderProfileOwnScreen.jsx",
   "Vous devrez vous reconnecter avec votre numéro de téléphone.",
   "Tu devras te reconnecter avec ton numéro de téléphone."],
  ["screens/ProviderProfileOwnScreen.jsx",
   "\"Chercher des prestataires et faire des demandes\"",
   "\"Chercher des pros et faire des demandes\""],

  // ═══ HomeScreen.jsx ═══
  ["screens/HomeScreen.jsx",
   "Rechercher un prestataire…",
   "Rechercher un pro…"],
  ["screens/HomeScreen.jsx",
   "prestataire{providers.length > 1 ? \"s\" : \"\"}",
   "pro{providers.length > 1 ? \"s\" : \"\"}"],
  ["screens/HomeScreen.jsx",
   "\"Près de vous\"",
   "\"Près de toi\""],
  ["screens/HomeScreen.jsx",
   "\"Aucun prestataire trouvé\"",
   "\"Aucun pro trouvé\""],

  // ═══ MapScreen.jsx ═══
  ["screens/MapScreen.jsx",
   "Prestataires près de vous",
   "Pros près de toi"],
  ["screens/MapScreen.jsx",
   "|| \"Prestataire\"",
   "|| \"Pro\""],

  // ═══ ChatListScreen.jsx ═══
  ["screens/ChatListScreen.jsx",
   "Contactez un prestataire depuis son profil pour commencer.",
   "Contacte un pro depuis son profil pour commencer."],

  // ═══ ChatScreen.jsx ═══
  ["screens/ChatScreen.jsx",
   "\"Votre avis a été publié.\"",
   "\"Ton avis a été publié.\""],

  // ═══ MyRequestsScreen.jsx ═══
  ["screens/MyRequestsScreen.jsx",
   "|| \"Prestataire\"",
   "|| \"Pro\""],
  ["screens/MyRequestsScreen.jsx",
   "Vos demandes de services apparaîtront ici une fois envoyées.",
   "Tes demandes de services apparaîtront ici une fois envoyées."],

  // ═══ MissionHistoryScreen.jsx ═══
  ["screens/MissionHistoryScreen.jsx",
   "Vos missions apparaîtront ici une fois que vous aurez fait des demandes.",
   "Tes missions apparaîtront ici une fois que tu auras fait des demandes."],

  // ═══ ChatInput.jsx ═══
  ["components/chat/ChatInput.jsx",
   "\"Vous devez être connecté.\"",
   "\"Tu dois être connecté.\""],

  // ═══ RequestCard.jsx ═══
  ["components/homeProvider/RequestCard.jsx",
   "Le client sera informé que vous n'êtes pas disponible.",
   "Le client sera informé que tu n'es pas disponible."],

  // ═══ RequestDetailScreen.jsx ═══
  ["screens/RequestDetailScreen.jsx",
   "Le client sera informé que vous n'êtes pas disponible.",
   "Le client sera informé que tu n'es pas disponible."],

  // ═══ FavoritesSection.jsx ═══
  ["components/clientProfile/FavoritesSection.jsx",
   "Aucun favori — ajoutez des prestataires depuis leur profil",
   "Aucun favori — ajoute des pros depuis leur profil"],
  ["components/clientProfile/FavoritesSection.jsx",
   "de vos favoris ?",
   "de tes favoris ?"],

  // ═══ PortfolioSection.jsx ═══
  ["components/providerOwnProfile/PortfolioSection.jsx",
   "Elle sera retirée définitivement de votre portfolio.",
   "Elle sera retirée définitivement de ton portfolio."],
  ["components/providerOwnProfile/PortfolioSection.jsx",
   "Ce prestataire n'a pas encore ajouté de photos",
   "Ce pro n'a pas encore ajouté de photos"],
  ["components/providerOwnProfile/PortfolioSection.jsx",
   "Ajoutez des photos de vos travaux pour attirer plus de clients",
   "Ajoute des photos de tes travaux pour attirer plus de clients"],

  // ═══ EditProfileSheet.jsx ═══
  ["components/providerOwnProfile/EditProfileSheet.jsx",
   "\"Entrez votre nom complet\"",
   "\"Entre ton nom complet\""],
  ["components/providerOwnProfile/EditProfileSheet.jsx",
   "Décrivez votre expérience, vos spécialités...",
   "Décris ton expérience, tes spécialités..."],
  ["components/providerOwnProfile/EditProfileSheet.jsx",
   "Choisissez votre quartier",
   "Choisis ton quartier"],
  ["components/providerOwnProfile/EditProfileSheet.jsx",
   "Quartiers où vous vous déplacez pour intervenir chez les clients.",
   "Quartiers où tu te déplaces pour intervenir chez les clients."],
  ["components/providerOwnProfile/EditProfileSheet.jsx",
   "Renseignez une fourchette de prix pour chacun de vos services.",
   "Renseigne une fourchette de prix pour chacun de tes services."],

  // ═══ ServiceRequestModal.jsx ═══
  ["components/providerProfile/ServiceRequestModal.jsx",
   "Vous pouvez joindre jusqu'à 3 photos.",
   "Tu peux joindre jusqu'à 3 photos."],
  ["components/providerProfile/ServiceRequestModal.jsx",
   "\"Décrivez brièvement votre tâche.\"",
   "\"Décris brièvement ta tâche.\""],
  ["components/providerProfile/ServiceRequestModal.jsx",
   "a reçu votre demande et vous répondra dès que possible.",
   "a reçu ta demande et te répondra dès que possible."],
  ["components/providerProfile/ServiceRequestModal.jsx",
   "Décrivez le problème, les difficultés d'accès, ce que vous attendez…",
   "Décris le problème, les difficultés d'accès, ce que tu attends…"],

  // ═══ ReviewsTab.jsx ═══
  ["components/providerProfile/ReviewsTab.jsx",
   "Réponse du prestataire",
   "Réponse du pro"],
  ["components/providerProfile/ReviewsTab.jsx",
   "Votre réponse publique…",
   "Ta réponse publique…"],
  ["components/providerProfile/ReviewsTab.jsx",
   "Vous avez travaillé ensemble",
   "Tu as fait appel à ce pro"],
  ["components/providerProfile/ReviewsTab.jsx",
   "Partagez votre expérience pour aider la communauté",
   "Partage ton expérience pour aider la communauté"],
];

// ── Run ──────────────────────────────────────────────────────────
let totalReplaced = 0;
let totalMissed = 0;
const fileChanges = {};
const missed = [];

for (const [relPath, oldStr, newStr] of REPLACEMENTS) {
  const filePath = path.join(SRC, relPath);
  if (!fs.existsSync(filePath)) {
    console.error("  FILE NOT FOUND: " + relPath);
    totalMissed++;
    missed.push([relPath, oldStr.slice(0, 60)]);
    continue;
  }
  let content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes(oldStr)) {
    console.error("  NOT FOUND in " + relPath + ": " + oldStr.slice(0, 60) + "...");
    totalMissed++;
    missed.push([relPath, oldStr.slice(0, 60)]);
    continue;
  }
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, "utf-8");
  totalReplaced++;
  fileChanges[relPath] = (fileChanges[relPath] || 0) + 1;
}

console.log("\n=== PALIER 2 - Voice & tone ===");
console.log("Replaced: " + totalReplaced);
console.log("Missed:   " + totalMissed);
console.log("Files changed: " + Object.keys(fileChanges).length);
for (const [f, count] of Object.entries(fileChanges).sort((a, b) => b[1] - a[1])) {
  console.log("  " + count + " changes: " + f);
}
if (missed.length > 0) {
  console.log("\nMissed details:");
  for (const [f, s] of missed) {
    console.log("  " + f + " -> " + s);
  }
}

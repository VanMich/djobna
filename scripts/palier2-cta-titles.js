/**
 * Palier 2 — Concrete CTAs & friendlier error titles
 * Replace generic "Erreur" with context-specific titles.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src");

const REPLACEMENTS = [
  // ═══ ProfileSetupScreen.jsx — validation → "Champ requis" ═══
  ["screens/ProfileSetupScreen.jsx",
   'Alert.alert("Erreur", "Entre ton nom complet")',
   'Alert.alert("Champ requis", "Entre ton nom complet")'],
  ["screens/ProfileSetupScreen.jsx",
   'Alert.alert("Erreur", "Entre ta ville")',
   'Alert.alert("Champ requis", "Entre ta ville")'],
  ["screens/ProfileSetupScreen.jsx",
   'Alert.alert("Erreur", "Choisis ton quartier")',
   'Alert.alert("Champ requis", "Choisis ton quartier")'],
  ["screens/ProfileSetupScreen.jsx",
   'Alert.alert("Erreur", "Entre ton pays")',
   'Alert.alert("Champ requis", "Entre ton pays")'],
  ["screens/ProfileSetupScreen.jsx",
   'Alert.alert("Erreur", "Impossible de créer le profil. Réessayez.")',
   'Alert.alert("Oups", "Impossible de créer le profil. Réessaye.")'],

  // ═══ EditProfileSheet.jsx ═══
  ["components/providerOwnProfile/EditProfileSheet.jsx",
   'Alert.alert("Erreur", "Entre ton nom complet")',
   'Alert.alert("Champ requis", "Entre ton nom complet")'],
  ["components/providerOwnProfile/EditProfileSheet.jsx",
   'Alert.alert("Erreur", "Impossible d\'enregistrer. Réessayez.")',
   'Alert.alert("Oups", "Impossible d\'enregistrer. Réessaye.")'],

  // ═══ PhoneScreen.jsx ═══
  ["screens/PhoneScreen.jsx",
   'Alert.alert("Erreur", "Entre un numéro valide à 9 chiffres")',
   'Alert.alert("Numéro invalide", "Entre un numéro valide à 9 chiffres.")'],
  ["screens/PhoneScreen.jsx",
   'Alert.alert("Erreur", "Impossible d\'envoyer le SMS. Réessayez.")',
   'Alert.alert("Oups", "Impossible d\'envoyer le SMS. Réessaye.")'],

  // ═══ HomeProviderScreen.jsx — network errors → "Oups" ═══
  ["screens/HomeProviderScreen.jsx",
   '"Impossible d\'accepter la demande. Réessayez."',
   '"Impossible d\'accepter la demande. Réessaye."'],
  ["screens/HomeProviderScreen.jsx",
   '"Impossible d\'ouvrir le chat. Réessayez."',
   '"Impossible d\'ouvrir le chat. Réessaye."'],
  ["screens/HomeProviderScreen.jsx",
   '"Impossible de décliner. Réessayez."',
   '"Impossible de décliner. Réessaye."'],
  ["screens/HomeProviderScreen.jsx",
   '"Impossible de marquer comme terminée. Réessayez."',
   '"Impossible de marquer comme terminée. Réessaye."'],

  // ═══ ChatScreen.jsx ═══
  ["screens/ChatScreen.jsx",
   '"Impossible de confirmer la fin de la mission. Réessayez."',
   '"Impossible de confirmer la fin de la mission. Réessaye."'],
  ["screens/ChatScreen.jsx",
   '"Données manquantes pour soumettre l\'avis. Réessayez plus tard."',
   '"Données manquantes pour soumettre l\'avis. Réessaye plus tard."'],
  ["screens/ChatScreen.jsx",
   '"Impossible de publier l\'avis. Réessayez."',
   '"Impossible de publier l\'avis. Réessaye."'],

  // ═══ ChatInput.jsx ═══
  ["components/chat/ChatInput.jsx",
   '"Impossible d\'envoyer l\'image."',
   '"Impossible d\'envoyer l\'image. Réessaye."'],

  // ═══ ProviderSetupScreen.jsx ═══
  ["screens/ProviderSetupScreen.jsx",
   '"Impossible de soumettre le dossier. Réessayez."',
   '"Impossible de soumettre le dossier. Réessaye."'],

  // ═══ ServiceRequestModal.jsx ═══
  ["components/providerProfile/ServiceRequestModal.jsx",
   '"Impossible d\'uploader les photos. Réessayez."',
   '"Impossible d\'uploader les photos. Réessaye."'],
  ["components/providerProfile/ServiceRequestModal.jsx",
   '"Impossible d\'envoyer la demande. Réessayez."',
   '"Impossible d\'envoyer la demande. Réessaye."'],

  // ═══ ProviderProfileScreen.jsx ═══
  ["screens/ProviderProfileScreen.jsx",
   '"Impossible de publier l\'avis. Réessayez."',
   '"Impossible de publier l\'avis. Réessaye."'],

  // ═══ RequestDetailScreen.jsx ═══
  ["screens/RequestDetailScreen.jsx",
   '"Impossible d\'accepter la demande. Réessayez."',
   '"Impossible d\'accepter la demande. Réessaye."'],
  ["screens/RequestDetailScreen.jsx",
   '"Impossible de décliner. Réessayez."',
   '"Impossible de décliner. Réessaye."'],
  ["screens/RequestDetailScreen.jsx",
   '"Impossible d\'ouvrir le chat. Réessayez."',
   '"Impossible d\'ouvrir le chat. Réessaye."'],

  // ═══ OTPScreen.jsx ═══
  ["screens/OTPScreen.jsx",
   '"Impossible de renvoyer le code."',
   '"Impossible de renvoyer le code. Réessaye."'],
];

let totalReplaced = 0;
let totalMissed = 0;

for (const [relPath, oldStr, newStr] of REPLACEMENTS) {
  const filePath = path.join(SRC, relPath);
  if (!fs.existsSync(filePath)) { totalMissed++; continue; }
  let content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes(oldStr)) {
    console.error("  NOT FOUND in " + relPath + ": " + oldStr.slice(0, 50));
    totalMissed++;
    continue;
  }
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, "utf-8");
  totalReplaced++;
}

console.log("=== CTA Titles ===");
console.log("Replaced: " + totalReplaced);
console.log("Missed: " + totalMissed);

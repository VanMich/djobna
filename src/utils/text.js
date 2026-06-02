// src/utils/text.js
// Utilitaires texte partagés pour la recherche.

// normalizeText : rend une chaîne comparable de façon robuste.
//  - "NFD" décompose les caractères accentués (é -> e + accent combinant)
//  - on retire les diacritiques combinants (plage U+0300 à U+036F)
//  - minuscules + trim
// Objectif : "Électricien", "electricien", "  ÉLECTRICIEN " donnent tous "electricien".
// Indispensable au Cameroun où l'on tape sans accents sur clavier mobile.
//
// Filet de sécurité : certains vieux moteurs Hermes (Android entrée de gamme)
// n'implémentent pas String.prototype.normalize. On retombe alors sur une
// table de remplacement des accents français — la recherche ne crashe jamais.
export function normalizeText(str = "") {
  let s = String(str);
  try {
    s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  } catch (_) {
    s = s
      .replace(/[àâäáãÀÂÄÁÃ]/g, "a")
      .replace(/[éèêëÉÈÊË]/g, "e")
      .replace(/[îïíìÎÏÍÌ]/g, "i")
      .replace(/[ôöóòõÔÖÓÒÕ]/g, "o")
      .replace(/[ûüúùÛÜÚÙ]/g, "u")
      .replace(/[çÇ]/g, "c");
  }
  return s.toLowerCase().trim();
}

// matchesQuery : true si `query` (normalisé) est contenu dans `haystack` (normalisé).
// haystack peut être une chaîne ou un tableau de morceaux (joints par espace).
export function matchesQuery(haystack, query) {
  const term = normalizeText(query);
  if (!term) return true;
  const text = Array.isArray(haystack) ? haystack.join(" ") : haystack;
  return normalizeText(text).includes(term);
}

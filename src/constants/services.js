// src/constants/services.js
// Liste des services disponibles sur Djobna (contexte camerounais)

// keywords : synonymes / variantes que les utilisateurs tapent réellement
// (fautes, formes courtes, métier vs prestation). Servent à la recherche
// tolérante — voir useProviders.js et SearchModal.jsx. Pas besoin d'accents
// ici : tout est normalisé au moment de la comparaison.
export const SERVICES = [
  { id: "mechanic", icon: "wrench", label: "Mécanicien", keywords: ["mecanicien", "mecano", "garagiste", "garage", "voiture", "auto", "vidange", "moteur"] },
  { id: "plumber", icon: "drop", label: "Plombier", keywords: ["plombier", "plomberie", "fuite", "tuyau", "eau", "robinet", "wc", "toilette", "canalisation", "douche"] },
  { id: "electrician", icon: "lightning", label: "Électricien", keywords: ["electricien", "electricite", "courant", "prise", "tableau", "cablage", "lumiere", "ampoule", "panne electrique", "disjoncteur"] },
  { id: "barber", icon: "scissors", label: "Coiffeur / Ébarbeur", keywords: ["coiffeur", "ebarbeur", "barbier", "coupe", "barbe", "cheveux", "salon", "coiffure"] },
  { id: "painter", icon: "paint-brush", label: "Peintre", keywords: ["peintre", "peinture", "mur", "badigeon", "ravalement"] },
  { id: "carpenter", icon: "hammer", label: "Menuisier", keywords: ["menuisier", "menuiserie", "bois", "meuble", "porte", "placard", "armoire", "ebeniste"] },
  { id: "tailor", icon: "needle", label: "Couturier", keywords: ["couturier", "couture", "tailleur", "vetement", "retouche", "habit", "robe", "ourlet"] },
  { id: "housekeeper", icon: "broom", label: "Femme de ménage", keywords: ["femme de menage", "menage", "nettoyage", "entretien", "aide menagere", "cleaning", "menagere", "repassage"] },
  { id: "caterer", icon: "cooking-pot", label: "Traiteur", keywords: ["traiteur", "cuisine", "repas", "evenement", "cuisinier", "catering", "buffet", "fete"] },
  { id: "locksmith", icon: "key", label: "Serrurier", keywords: ["serrurier", "serrure", "cle", "porte", "cadenas", "verrou"] },
  { id: "mover", icon: "package", label: "Déménageur", keywords: ["demenageur", "demenagement", "transport", "cartons", "camion", "porteur"] },
  { id: "security", icon: "shield-check", label: "Gardien", keywords: ["gardien", "securite", "vigile", "surveillance", "gardiennage", "agent"] },
  { id: "gardener", icon: "plant", label: "Jardinier", keywords: ["jardinier", "jardin", "gazon", "pelouse", "plante", "espaces verts", "tonte", "haie"] },
  { id: "welder", icon: "flame", label: "Soudeur", keywords: ["soudeur", "soudure", "metal", "fer", "ferronnerie", "portail", "grille"] },
  { id: "aircon", icon: "snowflake", label: "Climaticien", keywords: ["climaticien", "climatisation", "clim", "climatiseur", "frigo", "froid", "froid clim", "air conditionne", "split", "ventilation"] },
  { id: "tiler", icon: "wall", label: "Carreleur", keywords: ["carreleur", "carrelage", "carreaux", "faience", "dallage", "pose carreaux"] },
];

// Quartiers de Douala
export const QUARTIERS_DOUALA = [
  "Akwa",
  "Bonanjo",
  "Bonapriso",
  "Bali",
  "Bepanda",
  "Deido",
  "Ndokoti",
  "New Bell",
  "Makepe",
  "Logpom",
  "Kotto",
  "PK8",
  "PK10",
  "PK12",
  "Cité des Palmiers",
  "Bonamoussadi",
  "Logbaba",
  "Yassa",
  "Bonaberi",
  "Village",
  "Nylon",
  "Bessengue",
  "Bassa",
  "Soboum",
  "Ndog-Passi",
  "Mboppi",
  "Kassalafam",
  "Denver",
  "Kongolo",
  "Ngodi",
  "Total Nkwen",
  "Ndogbong",
];

export const QUARTIERS_YAOUNDE = [
  "Bastos", "Nlongkak", "Mvog-Mbi", "Mokolo", "Mvan",
  "Nsimeyong", "Biyem-Assi", "Mendong", "Simbock", "Nkolbisson",
  "Emana", "Mfandena", "Essos", "Omnisports", "Ngousso",
  "Etoudi", "Messa", "Briqueterie", "Tsinga", "Obili",
  "Nkol-Eton", "Ekounou", "Nkoldongo", "Olezoa", "Ahala",
  "Efoulan", "Odza", "Tongolo", "Elig-Essono", "Centre Ville",
];

export const QUARTIERS_PAR_VILLE = {
  "Douala": QUARTIERS_DOUALA,
  "Yaoundé": QUARTIERS_YAOUNDE,
};

// Fourchettes de prix par service
export const PRICE_RANGES = {
  mechanic: "5 000–20 000 FCFA",
  plumber: "5 000–15 000 FCFA",
  electrician: "8 000–30 000 FCFA",
  barber: "2 000–8 000 FCFA",
  painter: "10 000–40 000 FCFA",
  carpenter: "10 000–50 000 FCFA",
  tailor: "3 000–20 000 FCFA",
  housekeeper: "5 000–15 000 FCFA",
  caterer: "15 000–100 000 FCFA",
  locksmith: "5 000–20 000 FCFA",
  mover: "20 000–80 000 FCFA",
  security: "50 000–100 000 FCFA",
  default: "5 000–25 000 FCFA",
};

// Tarifs détaillés par service
export const PRICE_DETAILS = {
  mechanic: [
    { name: "Vidange", price: "5 000–8 000 FCFA" },
    { name: "Freins", price: "10 000–20 000 FCFA" },
    { name: "Diagnostic", price: "2 000–5 000 FCFA" },
    { name: "Embrayage", price: "25 000–50 000 FCFA" },
  ],
  plumber: [
    { name: "Fuite", price: "5 000–15 000 FCFA" },
    { name: "Robinetterie", price: "3 000–8 000 FCFA" },
    { name: "Installation", price: "20 000–50 000 FCFA" },
  ],
  electrician: [
    { name: "Installation", price: "10 000–30 000 FCFA" },
    { name: "Dépannage", price: "5 000–15 000 FCFA" },
    { name: "Tableau", price: "20 000–60 000 FCFA" },
  ],
  barber: [
    { name: "Coupe homme", price: "1 500–3 000 FCFA" },
    { name: "Barbe", price: "1 000–2 000 FCFA" },
    { name: "Coupe + Barbe", price: "2 500–4 000 FCFA" },
  ],
};

// Couleurs d'avatar par service
export const AVATAR_COLORS = {
  mechanic: "#1D9E75",
  electrician: "#3C3489",
  plumber: "#185FA5",
  barber: "#BA7517",
  painter: "#993C1D",
  housekeeper: "#0F6E56",
  caterer: "#6B3FA0",
  carpenter: "#7D4F2A",
  tailor: "#C44D8A",
  default: "#1D9E75",
};

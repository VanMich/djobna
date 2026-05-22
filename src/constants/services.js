// src/constants/services.js
// Liste des services disponibles sur Djobna (contexte camerounais)

export const SERVICES = [
  { id: "mechanic", icon: "🔧", label: "Mécanicien" },
  { id: "plumber", icon: "🪠", label: "Plombier" },
  { id: "electrician", icon: "⚡", label: "Électricien" },
  { id: "barber", icon: "✂️", label: "Coiffeur / Ébarbeur" },
  { id: "painter", icon: "🎨", label: "Peintre" },
  { id: "carpenter", icon: "🪚", label: "Menuisier" },
  { id: "tailor", icon: "🧵", label: "Couturier" },
  { id: "housekeeper", icon: "🏠", label: "Femme de ménage" },
  { id: "caterer", icon: "👨‍🍳", label: "Traiteur" },
  { id: "locksmith", icon: "🔐", label: "Serrurier" },
  { id: "mover", icon: "📦", label: "Déménageur" },
  { id: "security", icon: "🛡️", label: "Gardien" },
  { id: "gardener", icon: "🌿", label: "Jardinier" },
  { id: "welder", icon: "🔥", label: "Soudeur" },
  { id: "aircon", icon: "❄️", label: "Climaticien" },
  { id: "tiler", icon: "🧱", label: "Carreleur" },
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
    { name: "🔧 Vidange", price: "5 000–8 000 FCFA" },
    { name: "🛞 Freins", price: "10 000–20 000 FCFA" },
    { name: "⚙️ Diagnostic", price: "2 000–5 000 FCFA" },
    { name: "🔩 Embrayage", price: "25 000–50 000 FCFA" },
  ],
  plumber: [
    { name: "🚿 Fuite", price: "5 000–15 000 FCFA" },
    { name: "🚰 Robinetterie", price: "3 000–8 000 FCFA" },
    { name: "🛁 Installation", price: "20 000–50 000 FCFA" },
  ],
  electrician: [
    { name: "⚡ Installation", price: "10 000–30 000 FCFA" },
    { name: "🔌 Dépannage", price: "5 000–15 000 FCFA" },
    { name: "💡 Tableau", price: "20 000–60 000 FCFA" },
  ],
  barber: [
    { name: "✂️ Coupe homme", price: "1 500–3 000 FCFA" },
    { name: "🪒 Barbe", price: "1 000–2 000 FCFA" },
    { name: "💈 Coupe + Barbe", price: "2 500–4 000 FCFA" },
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

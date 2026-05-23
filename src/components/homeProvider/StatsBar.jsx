// src/components/homeProvider/StatsBar.jsx
//
// Bloc statistiques rapides affiché en haut du dashboard prestataire (§13.1).
// Affiche 4 métriques en grille 2×2 :
//   - Missions du jour (todayCount)
//   - Note moyenne (rating)
//   - Revenus du mois (monthRevenue)
//   - Solde disponible (walletBalance) ← ajouté §13.1

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Star } from "phosphor-react-native";

// Formate un nombre en milliers si > 1 000 (ex: 15 000 → "15K")
function formatNumber(n) {
  if (!n) return "0";
  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
}

export default function StatsBar({ stats, isAvailable }) {
  // Les 4 métriques à afficher (§13.1 Bloc Statistiques rapides)
  const items = [
    {
      value: stats.todayCount || "0",
      label: "Aujourd'hui",
    },
    {
      // rating peut être un objet { global, ... } ou un nombre — on normalise
      value: (() => {
        const r = typeof stats.rating === "object" ? stats.rating?.global : stats.rating;
        return r > 0 ? Number(r).toFixed(1) : "–";
      })(), hasIcon: true,
      label: "Note",
    },
    {
      value: formatNumber(stats.monthRevenue),
      label: "Mois (FCFA)",
    },
    {
      // Solde disponible — portefeuille prestataire (§13.1 + §12.3)
      value: formatNumber(stats.walletBalance),
      label: "Solde (FCFA)",
    },
  ];

  return (
    // Grille 2×2 : les 4 cartes s'organisent en 2 colonnes
    <View style={styles.grid}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.card, !isAvailable && styles.cardOff]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Text style={[styles.value, !isAvailable && styles.valueOff]}>
              {item.value}
            </Text>
            {item.hasIcon && <Star size={12} color="#F59E0B" weight="fill" />}
          </View>
          <Text style={[styles.label, !isAvailable && styles.labelOff]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Grille 2 colonnes avec flexWrap
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Chaque carte occupe ~50% de la largeur (moins le gap)
  card: {
    // "48%" pour laisser de la place au gap entre les deux colonnes
    width: "48%",
    backgroundColor: "rgba(29,158,117,.18)",
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(29,158,117,.2)",
    gap: 2,
  },
  cardOff: { opacity: 0.4 },

  value: { fontSize: 16, fontWeight: "800", color: "#5DCAA5" },
  valueOff: { color: "rgba(255,255,255,.4)" },

  label: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(29,158,117,.7)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelOff: { color: "rgba(255,255,255,.25)" },
});

// src/components/providerProfile/ProfileTab.js
// Onglet "Profil" — Spécialités, Tarifs, Zones, Bio
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SERVICES } from "../../constants/services";

export default function ProfileTab({ provider }) {
  const PRICE_MAP = {
    mechanic: [
      { name: "🔧 Vidange", price: "5 000–8 000 FCFA" },
      { name: "🛞 Freins", price: "10 000–20 000 FCFA" },
      { name: "⚙️ Diagnostic", price: "2 000–5 000 FCFA" },
      { name: "🔩 Embrayage", price: "25 000–50 000 FCFA" },
    ],
    plumber: [
      { name: "🚿 Fuite", price: "5 000–15 000 FCFA" },
      { name: "🚰 Robinetterie", price: "3 000–8 000 FCFA" },
    ],
    electrician: [
      { name: "⚡ Installation", price: "10 000–30 000 FCFA" },
      { name: "🔌 Dépannage", price: "5 000–15 000 FCFA" },
    ],
    barber: [
      { name: "✂️ Coupe", price: "1 500–3 000 FCFA" },
      { name: "🪒 Barbe", price: "1 000–2 000 FCFA" },
    ],
  };

  const mainService = provider?.services?.[0];
  const prices = PRICE_MAP[mainService] || [];
  const serviceLabels =
    provider?.services
      ?.map((id) => SERVICES.find((s) => s.id === id))
      .filter(Boolean) || [];

  const zones = provider?.zones || [provider?.quartier].filter(Boolean);

  return (
    <View style={styles.container}>
      {/* Spécialités */}
      <Section title="Spécialités">
        <View style={styles.tagsRow}>
          {serviceLabels.map((s) => (
            <View key={s.id} style={styles.tag}>
              <Text style={styles.tagText}>
                {s.icon} {s.label}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Tarifs */}
      {prices.length > 0 && (
        <Section title="Tarifs indicatifs">
          {prices.map((item, i) => (
            <View
              key={i}
              style={[
                styles.tarifRow,
                i === prices.length - 1 && styles.tarifRowLast,
              ]}
            >
              <Text style={styles.tarifName}>{item.name}</Text>
              <Text style={styles.tarifPrice}>{item.price}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Zones */}
      {zones.length > 0 && (
        <Section title="Zones de couverture">
          <View style={styles.zonesRow}>
            {zones.map((z, i) => (
              <View key={i} style={styles.zone}>
                <Text style={styles.zoneText}>📍 {z}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Bio */}
      {provider?.bio && (
        <Section title="À propos" last>
          <Text style={styles.bio}>{provider.bio}</Text>
        </Section>
      )}
    </View>
  );
}

// ── Composant Section réutilisable ─────────────
function Section({ title, children, last }) {
  return (
    <View style={[styles.section, last && styles.sectionLast]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 10 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 10,
    marginBottom: 0,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0EF",
  },
  sectionLast: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#AAB0B7",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Tags services
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F0FAF6",
    borderWidth: 1,
    borderColor: "#D1F5E8",
  },
  tagText: { fontSize: 11, fontWeight: "600", color: "#0F6E56" },

  // Tarifs
  tarifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F5",
  },
  tarifRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  tarifName: { fontSize: 12, color: "#555" },
  tarifPrice: { fontSize: 12, fontWeight: "700", color: "#111" },

  // Zones
  zonesRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  zone: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: "#F0FAF6",
    borderWidth: 1,
    borderColor: "#D1F5E8",
  },
  zoneText: { fontSize: 10, fontWeight: "600", color: "#0F6E56" },

  // Bio
  bio: { fontSize: 12, color: "#555", lineHeight: 20 },
});

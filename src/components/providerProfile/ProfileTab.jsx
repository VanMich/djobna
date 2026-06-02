// src/components/providerProfile/ProfileTab.jsx
import { StyleSheet, Text, View } from "react-native";

import MenuItem from "../clientProfile/MenuItem";
import MenuSection from "../clientProfile/MenuSection";
import Icon from "../ui/Icon";
import { SERVICES } from "../../constants/services";
import { colors, fonts } from "../../theme";

export default function ProfileTab({ provider }) {
  const serviceLabels = (provider?.services || [])
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean);

  // Tarifs réels depuis Firestore (servicePricing stocké à la création du profil)
  const servicePricing = provider?.servicePricing || {};

  const zones = provider?.interventionZones?.length
    ? provider.interventionZones
    : [provider?.quartier].filter(Boolean);

  const languages = provider?.languages || [];

  return (
    <View style={styles.container}>
      {/* ── Spécialités ── */}
      <MenuSection title="Spécialités">
        {serviceLabels.length > 0 ? (
          serviceLabels.map((svc) => {
            const pricing = servicePricing[svc.id];
            const sublabel = pricing
              ? `${(pricing.minPrice || 0).toLocaleString("fr-FR")} – ${(pricing.maxPrice || 0).toLocaleString("fr-FR")} FCFA / ${pricing.unit || "prestation"}`
              : null;
            return (
              <MenuItem
                key={svc.id}
                icon={svc.icon}
                iconBg="#F0FAF6"
                iconColor={colors.primary}
                label={pricing?.customLabel || svc.label}
                sublabel={sublabel}
                showArrow={false}
              />
            );
          })
        ) : (
          <Text style={styles.emptyText}>Aucune spécialité renseignée.</Text>
        )}
      </MenuSection>

      {/* ── Biographie ── */}
      {provider?.bio ? (
        <MenuSection title="À propos">
          <Text style={styles.bio}>{provider.bio}</Text>
        </MenuSection>
      ) : null}

      {/* ── Zones de couverture ── */}
      {zones.length > 0 ? (
        <MenuSection title="Zones de couverture">
          <View style={styles.tagsWrap}>
            {zones.map((zone) => (
              <View key={zone} style={styles.zoneTag}>
                <Icon name="map-pin" size={12} color={colors.primary} weight="fill" />
                <Text style={styles.zoneTagText}>{zone}</Text>
              </View>
            ))}
          </View>
        </MenuSection>
      ) : null}

      {/* ── Langues parlées ── */}
      {languages.length > 0 ? (
        <MenuSection title="Langues parlées">
          <View style={styles.tagsWrap}>
            {languages.map((lang) => (
              <View key={lang} style={styles.langTag}>
                <Icon name="translate" size={12} color="#3B82F6" weight="duotone" />
                <Text style={styles.langTagText}>{lang}</Text>
              </View>
            ))}
          </View>
        </MenuSection>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 10 },
  bio: {
    fontSize: 13,
    color: colors.ink500,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  emptyText: {
    fontSize: 12,
    color: colors.ink300,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  zoneTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5EEFE",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E8DDFD",
  },
  zoneTagText: { fontSize: 12, color: "#7C4DFF", fontFamily: fonts.semiBold },
  langTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F4FF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#C8E0FF",
  },
  langTagText: { fontSize: 12, color: "#185FA5", fontFamily: fonts.semiBold },
});

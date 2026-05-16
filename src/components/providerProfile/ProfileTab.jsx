// src/components/providerProfile/ProfileTab.jsx
import React from "react";
import { Text, StyleSheet, View } from "react-native";

import MenuItem from "../clientProfile/MenuItem";
import MenuSection from "../clientProfile/MenuSection";
import { PRICE_DETAILS, SERVICES } from "../../constants/services";

export default function ProfileTab({ provider }) {
  const mainService = provider?.services?.[0];
  const prices = PRICE_DETAILS[mainService] || [];
  const serviceLabels = (provider?.services || [])
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean);
  const zones = provider?.zones || [provider?.quartier].filter(Boolean);

  return (
    <View style={styles.container}>
      <MenuSection title="Spécialités">
        {serviceLabels.length > 0 ? (
          serviceLabels.map((service) => (
            <MenuItem
              key={service.id}
              icon={service.icon}
              iconBg="#F0FAF6"
              label={service.label}
              showArrow={false}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune spécialité renseignée.</Text>
        )}
      </MenuSection>

      {provider?.bio ? (
        <MenuSection title="À propos">
          <Text style={styles.bio}>{provider.bio}</Text>
        </MenuSection>
      ) : null}

      {prices.length > 0 ? (
        <MenuSection title="Tarifs indicatifs">
          {prices.map((item) => (
            <MenuItem
              key={`${item.name}-${item.price}`}
              icon="💰"
              iconBg="#E8F4FF"
              label={item.name}
              sublabel={item.price}
              showArrow={false}
            />
          ))}
        </MenuSection>
      ) : null}

      {zones.length > 0 ? (
        <MenuSection title="Zones de couverture">
          {zones.map((zone) => (
            <MenuItem
              key={zone}
              icon="📍"
              iconBg="#F5EEFE"
              label={zone}
              showArrow={false}
            />
          ))}
        </MenuSection>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 10 },
  bio: {
    fontSize: 12,
    color: "#555",
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  emptyText: {
    fontSize: 12,
    color: "#AAB0B7",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});

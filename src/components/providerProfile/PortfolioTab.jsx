// src/components/providerProfile/PortfolioTab.jsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import MenuItem from "../clientProfile/MenuItem";
import MenuSection from "../clientProfile/MenuSection";
import PortfolioSection from "../providerOwnProfile/PortfolioSection";

export default function PortfolioTab({ provider }) {
  const portfolio = provider?.portfolio || [];
  const lastJobs = provider?.lastJobs || [];

  return (
    <View style={styles.container}>
      <MenuSection title="Photos de travaux">
        <PortfolioSection portfolio={portfolio} readOnly />
      </MenuSection>

      {lastJobs.length > 0 ? (
        <MenuSection title="Dernières missions">
          {lastJobs.map((job, i) => (
            <MenuItem
              key={`${job.name}-${job.date}-${i}`}
              icon="check-circle"
              iconBg="#F0FAF6"
              label={job.name}
              sublabel={job.date}
              showArrow={false}
            />
          ))}
        </MenuSection>
      ) : (
        <MenuSection title="Dernières missions">
          <Text style={styles.emptyText}>Aucune mission récente affichée.</Text>
        </MenuSection>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 10 },
  emptyText: {
    fontSize: 12,
    color: "#AAB0B7",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});

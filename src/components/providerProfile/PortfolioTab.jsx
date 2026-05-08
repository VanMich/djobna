// src/components/providerProfile/PortfolioTab.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";

export default function PortfolioTab({ provider }) {
  const portfolio = provider?.portfolio || [];
  const lastJobs = provider?.lastJobs || [];

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos de travaux</Text>
        {portfolio.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosRow}
          >
            {portfolio.map((uri, i) => (
              <TouchableOpacity key={i} activeOpacity={0.85}>
                <Image source={{ uri }} style={styles.photo} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyPhotos}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>Pas encore de photos</Text>
          </View>
        )}
      </View>
      {lastJobs.length > 0 && (
        <View style={[styles.section, styles.sectionLast]}>
          <Text style={styles.sectionTitle}>Dernières missions</Text>
          {lastJobs.map((job, i) => (
            <View
              key={i}
              style={[
                styles.missionRow,
                i === lastJobs.length - 1 && styles.missionRowLast,
              ]}
            >
              <Text style={styles.missionName}>{job.name}</Text>
              <Text style={styles.missionDate}>{job.date}</Text>
            </View>
          ))}
        </View>
      )}
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
  photosRow: { gap: 8, paddingRight: 10 },
  photo: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
  },
  emptyPhotos: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 12, color: "#AAB0B7" },
  missionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F5",
  },
  missionRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  missionName: { fontSize: 12, color: "#444" },
  missionDate: { fontSize: 10, color: "#AAB0B7", fontWeight: "500" },
});

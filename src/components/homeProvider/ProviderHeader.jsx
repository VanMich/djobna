// src/components/homeProvider/ProviderHeader.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AvailabilityToggle from "./AvailabilityToggle";
import StatsBar from "./StatsBar";
import { colors } from "../../theme";

export default function ProviderHeader({
  provider,
  isAvailable,
  stats,
  requestCount,
  onToggle,
  onNotif,
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour 👋" : hour < 18 ? "Bon après-midi 👋" : "Bonsoir 👋";

  const firstName = provider?.displayName?.split(" ")[0] || "vous";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Ligne 1 : Salutation + Notif */}
        <View style={styles.topRow}>
          <View style={styles.greetBlock}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={onNotif}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={20} color="#9FE1CB" />
            {/* Badge si demandes non lues */}
            {requestCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {requestCount > 9 ? "9+" : requestCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle disponibilité */}
        <AvailabilityToggle
          isAvailable={isAvailable}
          onToggle={onToggle}
          requestCount={requestCount}
        />

        {/* Stats du jour */}
        <StatsBar stats={stats} isAvailable={isAvailable} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 6,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  greetBlock: { gap: 2 },
  greeting: { fontSize: 13, color: "#5DCAA5", fontWeight: "500" },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E24B4A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.background,
    paddingHorizontal: 2,
  },
  notifBadgeText: { fontSize: 7, fontWeight: "800", color: "#fff" },
});

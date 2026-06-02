// src/components/homeProvider/ProviderHeader.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "../ui/Icon";
import { colors, fonts } from "../../theme";

export default function ProviderHeader({ provider, requestCount, onNotif }) {
  const hour = new Date().getHours();
  const greetingText =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = provider?.displayName?.split(" ")[0] || "toi";

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.greetBlock}>
          <View style={styles.greetRow}>
            <Text style={styles.greeting}>{greetingText}</Text>
            <Icon name="hand" size={14} color={colors.primary} />
          </View>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={onNotif}
          activeOpacity={0.8}
        >
          <Icon name="bell" size={20} color={colors.ink700} />
          {requestCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {requestCount > 9 ? "9+" : requestCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetBlock: { gap: 2 },
  greetRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  greeting: { fontSize: 13, fontFamily: fonts.medium, color: colors.primary, letterSpacing: 0.3 },
  name: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    color: colors.ink900,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.ink50,
    borderWidth: 1,
    borderColor: colors.ink100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
    paddingHorizontal: 2,
  },
  notifBadgeText: { fontSize: 8, fontFamily: fonts.extraBold, color: colors.textInverse },
});

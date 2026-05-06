// src/navigation/BottomTabNavigator.js
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet, Text, View } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

// ── Composant icône personnalisé ──────────────
function TabIcon({ name, focused }) {
  return (
    <View style={styles.iconWrap}>
      {/* Indicateur actif — trait vert au dessus */}
      <View style={[styles.indicator, focused && styles.indicatorActive]} />

      {/* Fond coloré derrière l'icône active */}
      <View style={[styles.iconBubble, focused && styles.iconBubbleActive]}>
        <Ionicons
          name={focused ? name : `${name}-outline`}
          size={26}
          color={focused ? colors.primary : "#AAB0B7"}
        />
      </View>
    </View>
  );
}

// Écrans placeholder pour Messages et Profil
function PlaceholderScreen({ route }) {
  const icons = { Messages: "chatbubble", Profile: "person" };
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F4F6F5",
      }}
    >
      <Ionicons name={icons[route.name]} size={48} color="#DDD" />
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#333",
          marginTop: 12,
        }}
      >
        Bientôt disponible
      </Text>
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused }) => {
          const iconMap = {
            Home: "home",
            Map: "map",
            Messages: "chatbubble",
            Profile: "person",
          };
          return <TabIcon name={iconMap[route.name]} focused={focused} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Messages" component={PlaceholderScreen} />
      <Tab.Screen name="Profile" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // ── Barre principale ───────────────────────
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 0,

    // Ombre iOS
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },

    // Ombre Android
    elevation: 16,

    height: Platform.OS === "ios" ? 72 : 58,
    paddingTop: 0,
    paddingBottom: 0,
  },

  // ── Wrapper icône ──────────────────────────
  iconWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 4 : 2,
    paddingBottom: Platform.OS === "ios" ? 0 : 2,
  },

  // ── Indicateur actif ───────────────────────
  indicator: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    backgroundColor: "transparent",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },

  // ── Bulle icône ────────────────────────────
  iconBubble: {
    width: 48,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconBubbleActive: {
    backgroundColor: "#F0FAF6",
  },
});

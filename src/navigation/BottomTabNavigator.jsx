// src/navigation/BottomTabNavigator.js
// Barre de navigation principale de l'app
// Icônes Ionicons vectorielles (incluses dans Expo)

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

// Icône personnalisée pour chaque onglet
function TabIcon({ name, focused }) {
  return (
    <View style={styles.iconWrap}>
      {/* Trait indicateur vert en haut */}
      <View style={[styles.indicator, focused && styles.indicatorActive]} />
      {/* Bulle fond vert clair si actif */}
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

// Écrans placeholder — à remplacer quand ils seront développés
function PlaceholderScreen({ route }) {
  const icons = { Messages: "chatbubble", Profile: "person" };
  return (
    <View style={styles.placeholder}>
      <Ionicons name={icons[route.name]} size={48} color="#DDD" />
      <Text style={styles.placeholderText}>Bientôt disponible</Text>
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
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
    height: Platform.OS === "ios" ? 72 : 58,
    paddingTop: 0,
    paddingBottom: 0,
  },
  iconWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 4 : 2,
    paddingBottom: Platform.OS === "ios" ? 0 : 2,
  },
  indicator: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    backgroundColor: "transparent",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  indicatorActive: { backgroundColor: colors.primary },
  iconBubble: {
    width: 48,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconBubbleActive: { backgroundColor: "#F0FAF6" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F5",
    gap: 12,
  },
  placeholderText: { fontSize: 16, fontWeight: "600", color: "#333" },
});

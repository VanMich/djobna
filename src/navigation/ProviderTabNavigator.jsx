import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet, View } from "react-native";

import ChatListScreen from "../screens/ChatListScreen";
import HomeProviderScreen from "../screens/HomeProviderScreen";
import ProviderProfileOwnScreen from "../screens/ProviderProfileOwnScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.indicator, focused && styles.indicatorActive]} />
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

export default function ProviderTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused }) => {
          const iconMap = {
            ProviderHome: "briefcase",
            Messages: "chatbubble",
            Profile: "person",
          };
          return <TabIcon name={iconMap[route.name]} focused={focused} />;
        },
      })}
    >
      <Tab.Screen name="ProviderHome" component={HomeProviderScreen} />
      <Tab.Screen name="Messages" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProviderProfileOwnScreen} />
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
});

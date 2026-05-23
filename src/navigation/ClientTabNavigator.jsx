import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import ChatListScreen from "../screens/ChatListScreen";
import ClientProfileScreen from "../screens/ClientProfileScreen";
import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import TabIcon, { tabBarStyle } from "../components/navigation/TabIcon";

const Tab = createBottomTabNavigator();

export default function ClientTabNavigator({ unreadCount = 0 }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle,
        tabBarIcon: ({ focused }) => {
          const iconMap = {
            Home: "home",
            Map: "map",
            Messages: "chatbubble",
            Profile: "person",
          };
          const badge = route.name === "Messages" ? unreadCount : 0;
          return <TabIcon name={iconMap[route.name]} focused={focused} badge={badge} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Messages" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ClientProfileScreen} />
    </Tab.Navigator>
  );
}

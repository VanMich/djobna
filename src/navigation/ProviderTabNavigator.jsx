import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import ChatListScreen from "../screens/ChatListScreen";
import HomeProviderScreen from "../screens/HomeProviderScreen";
import ProviderProfileOwnScreen from "../screens/ProviderProfileOwnScreen";
import TabIcon, { tabBarStyle } from "../components/navigation/TabIcon";

const Tab = createBottomTabNavigator();

export default function ProviderTabNavigator({ unreadCount = 0 }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle,
        tabBarIcon: ({ focused }) => {
          const iconMap = {
            ProviderHome: "briefcase",
            Messages: "chatbubble",
            Profile: "person",
          };
          const badge = route.name === "Messages" ? unreadCount : 0;
          return <TabIcon name={iconMap[route.name]} focused={focused} badge={badge} />;
        },
      })}
    >
      <Tab.Screen name="ProviderHome" component={HomeProviderScreen} />
      <Tab.Screen name="Messages" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProviderProfileOwnScreen} />
    </Tab.Navigator>
  );
}

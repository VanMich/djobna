// App.js
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BottomTabNavigator from "./src/navigation/BottomTabNavigator";
import ChatScreen from "./src/screens/ChatScreen";
import OTPScreen from "./src/screens/OTPScreen";
import PhoneScreen from "./src/screens/PhoneScreen";
import ProfileSetupScreen from "./src/screens/ProfileSetupScreen";
import ProviderProfileScreen from "./src/screens/ProviderProfileScreen";
import SplashScreen from "./src/screens/SplashScreen";
import HomeProviderScreen from "./src/screens/HomeProviderScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        {/* ── Authentification ── */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Phone" component={PhoneScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

        {/* ── App principale ──
            BottomTabNavigator contient HomeScreen, MapScreen,
            ChatListScreen et ProfileScreen en onglets
            On l'appelle 'MainApp' pour être explicite         */}
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />

        {/* ── Profil du prestataire ── */}
        <Stack.Screen
          name="ProviderProfile"
          component={ProviderProfileScreen}
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ animation: "slide_from_right" }}
        />

        <Stack.Screen name="HomeProvider" component={HomeProviderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

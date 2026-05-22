// App.js
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppNavigator from "./src/navigation/AppNavigator";
import ChatScreen from "./src/screens/ChatScreen";
import MissionHistoryScreen from "./src/screens/MissionHistoryScreen";
import MyRequestsScreen from "./src/screens/MyRequestsScreen";
import OTPScreen from "./src/screens/OTPScreen";
import PhoneScreen from "./src/screens/PhoneScreen";
import ProfileSetupScreen from "./src/screens/ProfileSetupScreen";
import ProviderProfileScreen from "./src/screens/ProviderProfileScreen";
import ProviderSetupScreen from "./src/screens/ProviderSetupScreen";
import RequestDetailScreen from "./src/screens/RequestDetailScreen";
import VerificationPendingScreen from "./src/screens/VerificationPendingScreen";
import SplashScreen from "./src/screens/SplashScreen";

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

        {/* App principale: choisit la tab bar selon le role utilisateur */}
        <Stack.Screen name="MainApp" component={AppNavigator} />

        {/* ── Création compte prestataire ── */}
        <Stack.Screen
          name="ProviderSetup"
          component={ProviderSetupScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="VerificationPending"
          component={VerificationPendingScreen}
          options={{ gestureEnabled: false }}
        />

        {/* ── Profil public du prestataire ── */}
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
        <Stack.Screen
          name="RequestDetail"
          component={RequestDetailScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="MissionHistory"
          component={MissionHistoryScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="MyRequests"
          component={MyRequestsScreen}
          options={{ animation: "slide_from_right" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

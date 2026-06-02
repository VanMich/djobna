// App.js
import { useEffect, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import * as SplashScreen from "expo-splash-screen";

import AppNavigator from "./src/navigation/AppNavigator";
import ChatScreen from "./src/screens/ChatScreen";
import EarningsScreen from "./src/screens/EarningsScreen";
import MissionHistoryScreen from "./src/screens/MissionHistoryScreen";
import MyRequestsScreen from "./src/screens/MyRequestsScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import OTPScreen from "./src/screens/OTPScreen";
import PaymentScreen from "./src/screens/PaymentScreen";
import PhoneScreen from "./src/screens/PhoneScreen";
import ProfileSetupScreen from "./src/screens/ProfileSetupScreen";
import ProviderProfileScreen from "./src/screens/ProviderProfileScreen";
import ProviderSetupScreen from "./src/screens/ProviderSetupScreen";
import RequestDetailScreen from "./src/screens/RequestDetailScreen";
import TrackingScreen from "./src/screens/TrackingScreen";
import VerificationPendingScreen from "./src/screens/VerificationPendingScreen";
import SplashScreenComponent from "./src/screens/SplashScreen";

// Empêche le splash screen natif de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  // Tant que les fonts ne sont pas chargées, on reste sur le splash natif
  if (!fontsLoaded && !fontError) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        {/* ── Authentification ── */}
        <Stack.Screen name="Splash" component={SplashScreenComponent} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
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

        {/* ── Palier 3 — écrans additionnels ── */}
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="Tracking"
          component={TrackingScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="Earnings"
          component={EarningsScreen}
          options={{ animation: "slide_from_right" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

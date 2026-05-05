import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "./src/screens/HomeScreen";
import OTPScreen from "./src/screens/OTPScreen";
import PhoneScreen from "./src/screens/PhoneScreen";
import SplashScreen from "./src/screens/SplashScreen";
import ProfileSetupScreen from "./src/screens/ProfileSetupScreen";

export default function App() {
  const Stack = createNativeStackNavigator();
  // createNativeStackNavigator() crée un "gestionnaire d'écrans"
  // Chaque <Stack.Screen> est une page de l'app

  return (
    <NavigationContainer>
      {/* NavigationContainer contenu obligatoire de toute navigation */}
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
        // headerShown: false → on supprime la barre de navigation par défaut
        // On va créer nos propres headers custom dans chaque écran
      >
        <Stack.Screen name="Splash" component={SplashScreen}></Stack.Screen>
        <Stack.Screen name="Phone" component={PhoneScreen}></Stack.Screen>
        <Stack.Screen name="OTP" component={OTPScreen}></Stack.Screen>
        <Stack.Screen name="Home" component={HomeScreen}></Stack.Screen>
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

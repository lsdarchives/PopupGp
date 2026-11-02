import { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { listenForStripeRedirects } from "../services/stripeRedirect";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope: require("../../assets/fonts/Manrope-Variable.ttf"),
    Inter: require("../../assets/fonts/Inter-Variable.ttf"),
  });

  useEffect(() => listenForStripeRedirects(), []);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(user)" />
        <Stack.Screen name="(host)" />
      </Stack>
    </AuthProvider>
  );
}

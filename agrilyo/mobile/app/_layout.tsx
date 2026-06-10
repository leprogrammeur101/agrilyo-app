/**
 * Root Layout — AGRILYO
 * Chargement des fonts, initialisation du store auth, redirection conditionnelle.
 */

import { useEffect } from "react";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_900Black,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth.store";

// Empêche le splash screen de se fermer avant que tout soit prêt
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const { initialize, isAuthenticated, isInitialized } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    Montserrat_900Black,
    Montserrat_700Bold,
    Montserrat_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  // Initialisation du store auth (vérification du token en SecureStore)
  useEffect(() => {
    initialize();
  }, []);

  // Masquer le splash screen quand tout est prêt
  useEffect(() => {
    if ((fontsLoaded || fontError) && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isInitialized]);


  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          {/* Sprint 2 — Foncier annonces */}
          <Stack.Screen name="foncier/[id]"    options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="foncier/creer"   options={{ animation: "slide_from_bottom" }} />
          {/* Sprint 3 — Messagerie & Contrats */}
          <Stack.Screen name="foncier/thread/[id]"  options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="foncier/contrat/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="foncier/contrat/creer" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="foncier/conversations" options={{ animation: "slide_from_right" }} />
          {/* Sprint 4 - Semences */}
          <Stack.Screen name="semences/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="semences/fournisseur/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="semences/panier" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" backgroundColor="#1A4D2E" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

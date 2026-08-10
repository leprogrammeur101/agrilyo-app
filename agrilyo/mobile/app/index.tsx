import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "../store/auth.store";
import { onboardingStorage } from "../api/client";
import { Colors } from "../constants/colors";

export default function Index() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    onboardingStorage.hasSeen().then(setHasSeenOnboarding);
  }, []);

  // En attente de l'initialisation du store (vérification token SecureStore)
  // et de la lecture du flag onboarding
  if (!isInitialized || hasSeenOnboarding === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.vertForet} />
      </View>
    );
  }

  // Redirection selon l'état d'auth — Redirect est un composant, pas un hook
  // donc il est safe à appeler une fois le navigateur monté
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.cremeIvoire,
  },
});
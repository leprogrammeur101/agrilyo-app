import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "../store/auth.store";
import { Colors } from "../constants/colors";

export default function Index() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // En attente de l'initialisation du store (vérification token SecureStore)
  if (!isInitialized) {
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
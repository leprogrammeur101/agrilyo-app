/**
 * LoadingScreen — écran de chargement plein écran AGRILYO.
 * Réutilisable partout (démarrage app, chargement de données bloquant, etc.)
 */

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing } from "../../constants/theme";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message,
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.vertForet} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.cremeIvoire,
  },
  message: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
  },
});

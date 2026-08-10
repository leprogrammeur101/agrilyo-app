/**
 * Écran Création de mot de passe — AGRILYO
 * Affiché une seule fois, juste après la première vérification OTP réussie.
 * À partir de là, les connexions suivantes se font par numéro + mot de passe.
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { authApi } from "../../api/auth.api";
import { getApiErrorMessage } from "../../api/client";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius } from "../../constants/theme";

const MIN_PASSWORD_LENGTH = 6;

export default function CreatePasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreatePassword = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(
        "Mot de passe trop court",
        `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
      );
      return;
    }
    if (password !== confirm) {
      Alert.alert("Les mots de passe ne correspondent pas", "Vérifiez la confirmation.");
      return;
    }

    setLoading(true);
    try {
      await authApi.setPassword({ password });
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Erreur", getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>AGRILYO</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Créez votre mot de passe</Text>
          <Text style={styles.subtitle}>
            La prochaine fois, vous pourrez vous connecter directement avec
            votre numéro et ce mot de passe — plus besoin de code SMS.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor={Colors.textDesactive}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor={Colors.textDesactive}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreatePassword}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.blanc} />
            ) : (
              <Text style={styles.buttonText}>Confirmer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cremeIvoire },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: Colors.vertForet,
    paddingTop: 80,
    paddingBottom: 48,
    alignItems: "center",
  },
  logo: {
    fontFamily: FontFamily.headingBlack,
    fontSize: 38,
    color: Colors.blanc,
    letterSpacing: 3,
  },
  form: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
    color: Colors.textPrincipal,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textSecondaire,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  input: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: Colors.vertForet,
    borderRadius: BorderRadius.md,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.blanc,
    letterSpacing: 0.5,
  },
});
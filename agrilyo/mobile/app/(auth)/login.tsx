/**
 * Écran Login — Saisie du numéro de téléphone ivoirien.
 * L'auth AGRILYO est entièrement par OTP SMS, pas de mot de passe.
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
import { useAuthStore } from "../../store/auth.store";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius } from "../../constants/theme";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();

  // Normalise la saisie : ajoute +225 si absent
  const normalizePhone = (input: string): string => {
    const digits = input.replace(/\D/g, "");
    if (digits.startsWith("225")) return `+${digits}`;
    if (digits.length === 10) return `+225${digits}`;
    return input;
  };

  const handleSendOTP = async () => {
    const normalized = normalizePhone(phone);
    if (normalized.length < 14) {
      Alert.alert("Numéro invalide", "Entrez votre numéro ivoirien (ex : 07 00 00 00 00)");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.sendOTP({ phone_number: normalized });
      if (response.success) {
        router.push({
          pathname: "/(auth)/verify-otp",
          params: {
            phone: normalized,
            // En dev : pré-remplir l'OTP
            debugCode: response.debug_code || "",
          },
        });
      }
    } catch (err) {
        console.log("LOGIN ERROR:", err);
        const message =
          typeof getApiErrorMessage === "function"
            ? getApiErrorMessage(err)
            : "Impossible d'envoyer le code. Vérifiez votre connexion.";
        Alert.alert("Erreur", message);
      } finally {
        setLoading(false);
      }
  };

  const handlePasswordLogin = async () => {
    const normalized = normalizePhone(phone);
    if (normalized.length < 14) {
      Alert.alert("Numéro invalide", "Entrez votre numéro ivoirien (ex : 07 00 00 00 00)");
      return;
    }
    if (!password) {
      Alert.alert("Mot de passe requis", "Entrez votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.loginWithPassword({
        phone_number: normalized,
        password,
      });
      await setAuth(response.user, response.tokens);
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
        {/* Header vert avec logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>AGRILYO</Text>
          <Text style={styles.tagline}>Terres · Semences · Conseil</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            {mode === "otp"
              ? "Entrez votre numéro de téléphone ivoirien.\nNous vous enverrons un code de vérification."
              : "Entrez votre numéro et votre mot de passe."}
          </Text>

          {/* Toggle SMS / Mot de passe */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "otp" && styles.modeBtnActive]}
              onPress={() => setMode("otp")}
            >
              <Text style={[styles.modeBtnText, mode === "otp" && styles.modeBtnTextActive]}>
                Code SMS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "password" && styles.modeBtnActive]}
              onPress={() => setMode("password")}
            >
              <Text style={[styles.modeBtnText, mode === "password" && styles.modeBtnTextActive]}>
                Mot de passe
              </Text>
            </TouchableOpacity>
          </View>

          {/* Champ téléphone */}
          <View style={styles.inputWrapper}>
            <View style={styles.prefixBox}>
              <Text style={styles.prefixText}>🇨🇮 +225</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="07 00 00 00 00"
              placeholderTextColor={Colors.textDesactive}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
              autoFocus
            />
          </View>

          {/* Champ mot de passe (mode password uniquement) */}
          {mode === "password" && (
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe"
              placeholderTextColor={Colors.textDesactive}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={mode === "otp" ? handleSendOTP : handlePasswordLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.blanc} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "otp" ? "Recevoir mon code" : "Se connecter"}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.legal}>
            En continuant, vous acceptez les{" "}
            <Text style={styles.legalLink}>Conditions d'utilisation</Text> et la{" "}
            <Text style={styles.legalLink}>Politique de confidentialité</Text> d'AGRILYO.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cremeIvoire,
  },
  scroll: {
    flexGrow: 1,
  },
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
  tagline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.orClair,
    marginTop: Spacing.xs,
    letterSpacing: 1.5,
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.vertForetAlpha,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.md - 2,
  },
  modeBtnActive: {
    backgroundColor: Colors.vertForet,
  },
  modeBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.vertForet,
  },
  modeBtnTextActive: {
    color: Colors.blanc,
  },
  passwordInput: {
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
  prefixBox: {
    backgroundColor: Colors.vertForetAlpha,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.grisMoyen,
  },
  prefixText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.vertForet,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.lg,
    color: Colors.textPrincipal,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colors.vertForet,
    borderRadius: BorderRadius.md,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.blanc,
    letterSpacing: 0.5,
  },
  legal: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textDesactive,
    textAlign: "center",
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.vertSavane,
    textDecorationLine: "underline",
  },
});
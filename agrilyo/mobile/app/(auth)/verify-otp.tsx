import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { authApi } from "../../api/auth.api";
import { getApiErrorMessage } from "../../api/client";
import { useAuthStore } from "../../store/auth.store";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius } from "../../constants/theme";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams<{ phone: string; debugCode?: string }>();
  const { phone, debugCode } = params;

  const [otp, setOtp] = useState(debugCode || "");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  const { setAuth } = useAuthStore();
  const inputRef = useRef<TextInput>(null);

  // ── Countdown renvoi ────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── Auto-submit si debugCode pré-rempli ─────────────────────────────────────
  useEffect(() => {
    if (debugCode && debugCode.length === OTP_LENGTH) {
      // Légère attente pour laisser le composant se monter
      const timer = setTimeout(() => handleVerify(debugCode), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Vérification OTP ────────────────────────────────────────────────────────
  // Accepte le code en paramètre direct pour éviter le stale closure
  const handleVerify = async (codeToSend?: string) => {
    const code = codeToSend ?? otp;
    if (code.length !== OTP_LENGTH) return;

    setLoading(true);
    try {
      const response = await authApi.verifyOTP({
        phone_number: phone,
        code,
      });
      await setAuth(response.user, response.tokens);
    } catch (err) {
      Alert.alert("Code incorrect", getApiErrorMessage(err));
      setOtp("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.sendOTP({ phone_number: phone });
      setCountdown(RESEND_COOLDOWN);
      setOtp("");
      Alert.alert("Code renvoyé", "Un nouveau code vous a été envoyé par SMS.");
    } catch (err) {
      Alert.alert("Erreur", getApiErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  const maskedPhone = phone?.replace(
    /(\+225)(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
    "$1 $2 $3 $4 $5 $6"
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>AGRILYO</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>
          Code envoyé par SMS au{"\n"}
          <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
        </Text>

        {/* Cases OTP */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
        >
          <View style={styles.otpContainer}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  i < otp.length && styles.otpBoxFilled,
                  i === otp.length && styles.otpBoxActive,
                ]}
              >
                <Text style={styles.otpChar}>{otp[i] || ""}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Input invisible */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={otp}
          onChangeText={(v) => {
            const digits = v.replace(/\D/g, "").slice(0, OTP_LENGTH);
            setOtp(digits);
            // Passer digits directement pour éviter le stale closure
            if (digits.length === OTP_LENGTH) {
              handleVerify(digits);
            }
          }}
          keyboardType="number-pad"
          autoFocus
          maxLength={OTP_LENGTH}
        />

        {/* Bouton confirmer */}
        <TouchableOpacity
          style={[
            styles.button,
            (loading || otp.length < OTP_LENGTH) && styles.buttonDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={loading || otp.length < OTP_LENGTH}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.blanc} />
          ) : (
            <Text style={styles.buttonText}>Confirmer</Text>
          )}
        </TouchableOpacity>

        {/* Renvoyer */}
        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <Text style={styles.resendCooldown}>
              Renvoyer dans{" "}
              <Text style={styles.resendTimer}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              {resendLoading ? (
                <ActivityIndicator size="small" color={Colors.vertSavane} />
              ) : (
                <Text style={styles.resendLink}>Renvoyer le code</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cremeIvoire },
  header: {
    backgroundColor: Colors.vertForet,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { marginRight: Spacing.md },
  backText: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.orClair,
    fontSize: FontSize.md,
  },
  logo: {
    fontFamily: FontFamily.headingBlack,
    fontSize: FontSize.xl,
    color: Colors.blanc,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    alignItems: "center",
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
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  phoneHighlight: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.vertForet,
  },
  otpContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.grisMoyen,
    backgroundColor: Colors.blanc,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFilled: {
    borderColor: Colors.vertSavane,
    backgroundColor: Colors.vertForetAlpha,
  },
  otpBoxActive: {
    borderColor: Colors.vertForet,
    borderWidth: 2.5,
  },
  otpChar: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    color: Colors.vertForet,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  button: {
    backgroundColor: Colors.vertForet,
    borderRadius: BorderRadius.md,
    paddingVertical: 18,
    width: "100%",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.blanc,
  },
  resendContainer: { marginTop: Spacing.xl, alignItems: "center" },
  resendCooldown: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
  },
  resendTimer: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.vertForet,
  },
  resendLink: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.vertSavane,
    textDecorationLine: "underline",
  },
});
/**
 * Layout du groupe Auth — écrans sans navigation tabs.
 * Login → Vérification OTP → Onboarding (si nouvel utilisateur) → Création mot de passe → Tabs
 */

import { Stack } from "expo-router";
import { Colors } from "../../constants/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cremeIvoire },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="create-password" />
    </Stack>
  );
}
/**
 * Écran Choix de rôle(s) + identité — AGRILYO
 * Affiché une seule fois, juste après la première vérification OTP réussie
 * (requires_role_setup === true dans la réponse verify-otp).
 * Suite du flow : create-password (si requis) → tabs.
 */

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authApi, SelectableRole } from "../../api/auth.api";
import { getApiErrorMessage } from "../../api/client";
import { useAuthStore } from "../../store/auth.store";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, CI_REGIONS } from "../../constants/theme";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

interface RoleOption {
  value: SelectableRole;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "AGRICULTEUR",
    label: "Agriculteur",
    description: "Je cultive et je gère mes terres et récoltes",
    icon: "leaf",
    color: Colors.vertForet,
  },
  {
    value: "BAILLEUR",
    label: "Bailleur",
    description: "Je propose des terres agricoles à la location",
    icon: "map",
    color: Colors.foncier,
  },
  {
    value: "SEMENCIER",
    label: "Fournisseur de semences",
    description: "Je vends des semences et intrants agricoles",
    icon: "storefront",
    color: Colors.semences,
  },
  {
    value: "AGRONOME",
    label: "Agronome / Conseiller",
    description: "J'accompagne les agriculteurs avec mon expertise",
    icon: "school",
    color: Colors.conseil,
  },
];

export default function RoleSetupScreen() {
  const { requiresPasswordSetup } = useLocalSearchParams<{ requiresPasswordSetup?: string }>();
  const { updateUser } = useAuthStore();

  const [selectedRoles, setSelectedRoles] = useState<SelectableRole[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: SelectableRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleContinuer = async () => {
    if (selectedRoles.length === 0) {
      Alert.alert("Rôle requis", "Sélectionnez au moins un rôle qui vous correspond.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Identité requise", "Renseignez votre prénom et votre nom.");
      return;
    }
    if (!region) {
      Alert.alert("Région requise", "Sélectionnez votre région.");
      return;
    }

    setLoading(true);
    try {
      const user = await authApi.completeProfile({
        roles: selectedRoles,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        region,
      });
      updateUser(user);

      if (requiresPasswordSetup === "true") {
        router.replace("/(auth)/create-password");
      } else {
        router.replace("/(tabs)");
      }
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>AGRILYO</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Bienvenue !</Text>
          <Text style={styles.subtitle}>
            Dites-nous qui vous êtes — vous pouvez sélectionner plusieurs profils.
          </Text>

          <View style={styles.rolesGrid}>
            {ROLE_OPTIONS.map((option) => {
              const isSelected = selectedRoles.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.roleCard,
                    isSelected && { borderColor: option.color, backgroundColor: `${option.color}0D` },
                  ]}
                  onPress={() => toggleRole(option.value)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.roleIconCircle,
                      { backgroundColor: isSelected ? option.color : Colors.grisLeger },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={isSelected ? Colors.blanc : Colors.textSecondaire}
                    />
                  </View>
                  <Text style={styles.roleLabel}>{option.label}</Text>
                  <Text style={styles.roleDescription}>{option.description}</Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: option.color }]}>
                      <Ionicons name="checkmark" size={12} color={Colors.blanc} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Prénom"
            placeholder="Ex : Awa"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Input
            label="Nom"
            placeholder="Ex : Koné"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.label}>
            Région<Text style={styles.required}> *</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
            <View style={styles.pillRow}>
              {CI_REGIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, region === r && styles.pillActif]}
                  onPress={() => setRegion(r)}
                >
                  <Text style={[styles.pillText, region === r && styles.pillTextActif]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Button
            label="Continuer"
            onPress={handleContinuer}
            loading={loading}
            icon="arrow-forward"
            iconPosition="right"
          />
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
    paddingTop: 70,
    paddingBottom: 36,
    alignItems: "center",
  },
  logo: {
    fontFamily: FontFamily.headingBlack,
    fontSize: 34,
    color: Colors.blanc,
    letterSpacing: 3,
  },
  form: { padding: Spacing.lg, paddingTop: Spacing.xl },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
    color: Colors.textPrincipal,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textSecondaire,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  roleCard: {
    width: "47%",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    padding: Spacing.md,
    position: "relative",
  },
  roleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  roleLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    marginBottom: 3,
  },
  roleDescription: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondaire,
    lineHeight: 16,
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    marginBottom: Spacing.sm,
  },
  required: { color: Colors.erreur },
  regionScroll: { marginBottom: Spacing.xl },
  pillRow: { flexDirection: "row", gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.blanc,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
  },
  pillActif: { backgroundColor: Colors.vertForet, borderColor: Colors.vertForet },
  pillText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
  },
  pillTextActif: { color: Colors.blanc },
});
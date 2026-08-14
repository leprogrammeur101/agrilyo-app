/**
 * Onglet Profil — AGRILYO
 * Vue du profil connecté : avatar, identité, rôles, statut, déconnexion.
 */

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../constants/theme";
import { useAuthStore } from "../../store/auth.store";
import Button from "../../components/ui/Button";

const ROLE_LABELS: Record<string, string> = {
  AGRICULTEUR: "Agriculteur",
  BAILLEUR: "Bailleur",
  SEMENCIER: "Fournisseur de semences",
  AGRONOME: "Agronome / Conseiller",
  ADMIN: "Administrateur",
};

const STATUT_LABELS: Record<string, string> = {
  PENDING: "En attente de vérification",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  BANNED: "Banni",
};

const STATUT_COLORS: Record<string, string> = {
  PENDING: Colors.alerte,
  ACTIVE: Colors.succes,
  SUSPENDED: Colors.erreur,
  BANNED: Colors.erreur,
};

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace("+225", "");
  return digits.match(/.{1,2}/g)?.join(" ") ?? phone;
}

export default function ProfilScreen() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const handleDeconnexion = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={Colors.blanc} />
            </View>
          )}
          <Text style={styles.name}>
            {user.first_name || user.last_name
              ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
              : user.display_name || "Utilisateur AGRILYO"}
          </Text>
          <Text style={styles.phone}>{formatPhoneDisplay(user.phone_number)}</Text>

          <View style={[styles.statutBadge, { backgroundColor: `${STATUT_COLORS[user.status]}1A` }]}>
            <View style={[styles.statutDot, { backgroundColor: STATUT_COLORS[user.status] }]} />
            <Text style={[styles.statutText, { color: STATUT_COLORS[user.status] }]}>
              {STATUT_LABELS[user.status] ?? user.status}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Rôles</Text>
          <View style={styles.rolesRow}>
            {user.roles.length === 0 && <Text style={styles.emptyText}>Aucun rôle défini</Text>}
            {user.roles.map((role) => (
              <View key={role} style={styles.roleChip}>
                <Text style={styles.roleChipText}>{ROLE_LABELS[role] ?? role}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={Colors.textSecondaire} />
            <Text style={styles.infoText}>{user.region || "Région non renseignée"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="language-outline" size={18} color={Colors.textSecondaire} />
            <Text style={styles.infoText}>{user.language === "fr" ? "Français" : user.language}</Text>
          </View>
          {user.bio && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={18} color={Colors.textSecondaire} />
              <Text style={styles.infoText}>{user.bio}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            label="Modifier le profil"
            variant="primary"
            icon="create-outline"
            onPress={() => router.push("/profil/edit")}
          />
          <Button
            label="Déconnexion"
            variant="outline"
            icon="log-out-outline"
            onPress={handleDeconnexion}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: Spacing.lg },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: Spacing.sm },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.vertForet,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  name: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, color: Colors.textPrincipal },
  phone: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
    marginTop: 2,
  },
  statutBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.sm,
  },
  statutDot: { width: 6, height: 6, borderRadius: 3 },
  statutText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs },
  card: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textDesactive,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: {
    backgroundColor: Colors.vertForetAlpha,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  roleChipText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.vertForet },
  emptyText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textDesactive },
  infoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: 6 },
  infoText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textPrincipal },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
});
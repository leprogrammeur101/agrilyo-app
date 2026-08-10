/**
 * Écran Profil agronome — /conseil/agronome/[id]
 * Lecture seule pour tous ; actions de validation admin si l'utilisateur est ADMIN.
 */

import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../../constants/theme";
import { StatutAgronome } from "../../../api/conseil.api";
import { useConseilStore } from "../../../store/conseil.store";
import { useAuthStore } from "../../../store/auth.store";
import { conseilApi } from "../../../api/conseil.api";
import { getApiErrorMessage } from "../../../api/client";
import Button from "../../../components/ui/Button";
import LoadingScreen from "../../../components/ui/LoadingScreen";

const STATUT_LABELS: Record<StatutAgronome, string> = {
  EN_ATTENTE: "En attente de validation",
  VERIFIE: "Vérifié",
  SUSPENDU: "Suspendu",
  REJETE: "Rejeté",
};

const STATUT_COLORS: Record<StatutAgronome, string> = {
  EN_ATTENTE: Colors.alerte,
  VERIFIE: Colors.succes,
  SUSPENDU: Colors.erreur,
  REJETE: Colors.textDesactive,
};

function InfoChipList({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.chipSection}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {items.map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProfilAgronomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes("ADMIN") ?? false;

  const { agronomeSelectionne: agronome, isLoadingDetail, chargerAgronome } = useConseilStore();

  useEffect(() => {
    if (id) chargerAgronome(id);
  }, [id]);

  if (isLoadingDetail || !agronome) {
    return <LoadingScreen message="Chargement du profil..." />;
  }

  const handleStatut = async (statut: StatutAgronome) => {
    try {
      await conseilApi.mettreAJourStatutAgronome(agronome.id, { statut });
      chargerAgronome(agronome.id);
    } catch (error) {
      Alert.alert("Erreur", getApiErrorMessage(error));
    }
  };

  const confirmerStatut = (statut: StatutAgronome, message: string) => {
    Alert.alert("Confirmer", message, [
      { text: "Annuler", style: "cancel" },
      { text: "Confirmer", onPress: () => handleStatut(statut) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Profil agronome
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Ionicons name="school" size={32} color={Colors.conseil} />
          </View>
          <Text style={styles.titre}>{agronome.titre}</Text>
          {agronome.organisation && <Text style={styles.organisation}>{agronome.organisation}</Text>}

          <View style={[styles.badge, { backgroundColor: `${STATUT_COLORS[agronome.statut]}1A` }]}>
            <Text style={[styles.badgeText, { color: STATUT_COLORS[agronome.statut] }]}>
              {STATUT_LABELS[agronome.statut]}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{agronome.annees_experience}</Text>
              <Text style={styles.statLabel}>ans d'exp.</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{agronome.note_moyenne.toFixed(1)}</Text>
              <Text style={styles.statLabel}>note moy.</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{agronome.nombre_sessions}</Text>
              <Text style={styles.statLabel}>sessions</Text>
            </View>
          </View>
        </View>

        {agronome.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.bioText}>{agronome.bio}</Text>
          </View>
        )}

        <View style={styles.section}>
          <InfoChipList label="Cultures" items={agronome.cultures} />
          <InfoChipList label="Régions couvertes" items={agronome.regions_couvertes} />
          <InfoChipList label="Spécialités" items={agronome.specialites} />
          <InfoChipList label="Langues" items={agronome.langues} />
        </View>

        {agronome.tarif_session != null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarif indicatif</Text>
            <Text style={styles.tarifText}>{agronome.tarif_session.toLocaleString("fr-FR")} FCFA / session</Text>
          </View>
        )}

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions administrateur</Text>
            <View style={styles.adminActions}>
              {agronome.statut !== "VERIFIE" && (
                <Button
                  label="Valider ce profil"
                  variant="primary"
                  icon="checkmark-circle"
                  onPress={() =>
                    confirmerStatut("VERIFIE", "Ce profil agronome sera visible et assignable aux demandes.")
                  }
                />
              )}
              {agronome.statut !== "SUSPENDU" && (
                <Button
                  label="Suspendre ce profil"
                  variant="outline"
                  icon="pause-circle-outline"
                  onPress={() =>
                    confirmerStatut("SUSPENDU", "Ce profil ne sera plus visible ni assignable.")
                  }
                />
              )}
              {agronome.statut !== "REJETE" && (
                <Button
                  label="Rejeter ce profil"
                  variant="ghost"
                  icon="close-circle-outline"
                  onPress={() => confirmerStatut("REJETE", "Ce profil sera définitivement rejeté.")}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },
  header: {
    backgroundColor: Colors.conseil,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, color: Colors.blanc },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.lg },
  card: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadow.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.vertForetAlpha,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  titre: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
    color: Colors.textPrincipal,
    textAlign: "center",
  },
  organisation: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
    marginTop: 2,
  },
  badge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  badgeText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  stat: { alignItems: "center", minWidth: 64 },
  statValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md, color: Colors.textPrincipal },
  statLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textDesactive },
  divider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: Colors.grisMoyen },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },
  bioText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    lineHeight: 21,
  },
  chipSection: { marginBottom: Spacing.md },
  chipLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textDesactive,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: Colors.vertForetAlpha,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  chipText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.conseil },
  tarifText: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.textPrincipal },
  adminActions: { gap: Spacing.sm },
});
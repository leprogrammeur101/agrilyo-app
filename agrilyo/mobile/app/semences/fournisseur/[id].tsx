/**
 * Fiche fournisseur Semences - /semences/fournisseur/[id]
 */

import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LabelIvoireBadge from "../../../components/ui/LabelIvoireBadge";
import { useSemencesStore } from "../../../store/semences.store";
import { Colors } from "../../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../../constants/theme";

function InfoLine({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={17} color={Colors.orProfond} />
      <Text style={styles.infoLineText}>{value}</Text>
    </View>
  );
}

export default function FicheFournisseurScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    fournisseurSelectionne,
    isLoadingFournisseur,
    chargerDetailFournisseur,
    clearFournisseurSelectionne,
  } = useSemencesStore();

  useEffect(() => {
    if (id) chargerDetailFournisseur(id);
    return () => clearFournisseurSelectionne();
  }, [id]);

  if (isLoadingFournisseur || !fournisseurSelectionne) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.orProfond} />
      </View>
    );
  }

  const fournisseur = fournisseurSelectionne;
  const location = fournisseur.ville
    ? `${fournisseur.ville}, ${fournisseur.region}`
    : fournisseur.region;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Fournisseur
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{fournisseur.nom_commercial.slice(0, 1)}</Text>
          </View>
          <Text style={styles.name}>{fournisseur.nom_commercial}</Text>
          <Text style={styles.location}>{location}</Text>
          <LabelIvoireBadge niveau={fournisseur.label_ivoire} />
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fournisseur.note_moyenne.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fournisseur.nombre_avis}</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fournisseur.nombre_produits_actifs}</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>
        </View>

        {fournisseur.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Presentation</Text>
            <Text style={styles.description}>{fournisseur.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <InfoLine icon="location-outline" value={fournisseur.adresse_complete || location} />
          <InfoLine icon="call-outline" value={fournisseur.telephone_pro} />
          <InfoLine icon="mail-outline" value={fournisseur.email_pro} />
          <InfoLine icon="globe-outline" value={fournisseur.site_web} />
        </View>

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.orProfond} />
          <Text style={styles.noticeText}>
            Les fournisseurs verifies sont controles par AGRILYO avant publication du
            catalogue.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.cremeIvoire, flex: 1 },
  loading: {
    alignItems: "center",
    backgroundColor: Colors.cremeIvoire,
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: Colors.orProfond,
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { padding: 4 },
  headerTitle: {
    color: Colors.blanc,
    flex: 1,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  profileCard: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#FBF4E5",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    marginBottom: Spacing.md,
    width: 72,
  },
  avatarText: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
    textTransform: "uppercase",
  },
  name: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    textAlign: "center",
  },
  location: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    marginTop: 4,
  },
  stats: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  statLabel: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  statDivider: { backgroundColor: Colors.grisMoyen, width: 1 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
  },
  description: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  infoLine: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  infoLineText: {
    color: Colors.textPrincipal,
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
  },
  notice: {
    alignItems: "flex-start",
    backgroundColor: "#FFF8E1",
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  noticeText: {
    color: Colors.textSecondaire,
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});

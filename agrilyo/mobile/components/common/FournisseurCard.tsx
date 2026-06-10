/**
 * FournisseurCard - Carte fournisseur Semences.
 */

import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FournisseurResume } from "../../api/semences.api";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../constants/theme";
import LabelIvoireBadge from "../ui/LabelIvoireBadge";

interface FournisseurCardProps {
  fournisseur: FournisseurResume;
  onPress: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function FournisseurCard({
  fournisseur,
  onPress,
}: FournisseurCardProps) {
  const location = fournisseur.ville
    ? `${fournisseur.ville}, ${fournisseur.region}`
    : fournisseur.region;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.logoWrap}>
        {fournisseur.logo_url ? (
          <Image source={{ uri: fournisseur.logo_url }} style={styles.logo} resizeMode="cover" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>{getInitials(fournisseur.nom_commercial)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {fournisseur.nom_commercial}
          </Text>
          <LabelIvoireBadge niveau={fournisseur.label_ivoire} size="sm" compact />
        </View>

        <Text style={styles.location} numberOfLines={1}>
          {location}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fournisseur.note_moyenne.toFixed(1)}</Text>
            <Text style={styles.statLabel}>note</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fournisseur.nombre_avis}</Text>
            <Text style={styles.statLabel}>avis</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fournisseur.nombre_produits_actifs}</Text>
            <Text style={styles.statLabel}>produits</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 112,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  logoWrap: {
    height: 72,
    width: 72,
  },
  logo: {
    borderRadius: BorderRadius.md,
    height: "100%",
    width: "100%",
  },
  logoPlaceholder: {
    alignItems: "center",
    backgroundColor: "#FBF4E5",
    borderRadius: BorderRadius.md,
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  logoText: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  name: {
    color: Colors.textPrincipal,
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.md,
  },
  location: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  statsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  stat: {
    minWidth: 42,
  },
  statValue: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
  },
  statLabel: {
    color: Colors.textDesactive,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  divider: {
    backgroundColor: Colors.grisMoyen,
    height: 28,
    width: StyleSheet.hairlineWidth,
  },
});

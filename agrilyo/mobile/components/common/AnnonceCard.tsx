/**
 * AnnonceCard — Carte d'une annonce foncière dans la liste
 */

import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { AnnonceResume, TYPE_ACCES_LABELS } from "../../api/foncier.api";
import BadgeFoncier from "../ui/Badge";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../constants/theme";

interface AnnonceCardProps {
  annonce: AnnonceResume;
  onPress: () => void;
}

/** Formate un prix FCFA en version lisible : 150000 → "150 000 FCFA" */
function formatFCFA(amount: number): string {
  return amount.toLocaleString("fr-FR") + " FCFA";
}

export default function AnnonceCard({ annonce, onPress }: AnnonceCardProps) {
  const typeLabel = TYPE_ACCES_LABELS[annonce.type_acces];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Photo ou placeholder */}
      <View style={styles.photoContainer}>
        {annonce.photo_url ? (
          <Image
            source={{ uri: annonce.photo_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderIcon}>🌾</Text>
          </View>
        )}

        {/* Tag type d'accès en overlay */}
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{typeLabel}</Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Localisation */}
        <Text style={styles.localisation} numberOfLines={1}>
          📍 {annonce.sous_prefecture
            ? `${annonce.sous_prefecture}, ${annonce.region}`
            : annonce.region}
        </Text>

        {/* Superficie */}
        <Text style={styles.superficie}>
          {annonce.superficie_ha} ha
        </Text>

        {/* Prix */}
        {annonce.prix_indicatif ? (
          <Text style={styles.prix}>
            {formatFCFA(annonce.prix_indicatif)}
            {annonce.type_acces === "LOCATION" ? "/ha/an" : ""}
          </Text>
        ) : (
          <Text style={styles.prixNc}>Prix à négocier</Text>
        )}

        {/* Badge + vues */}
        <View style={styles.footer}>
          <BadgeFoncier badge={annonce.badge} size="sm" />
          <Text style={styles.vues}>{annonce.vues} vue{annonce.vues !== 1 ? "s" : ""}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    ...Shadow.sm,
  },
  photoContainer: {
    position: "relative",
    height: 160,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.vertForetAlpha,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderIcon: {
    fontSize: 48,
  },
  typeTag: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.vertForet,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  typeTagText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.blanc,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  content: {
    padding: Spacing.md,
  },
  localisation: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
    marginBottom: 4,
  },
  superficie: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    color: Colors.textPrincipal,
    marginBottom: 2,
  },
  prix: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.vertSavane,
    marginBottom: Spacing.sm,
  },
  prixNc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textDesactive,
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vues: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textDesactive,
  },
});
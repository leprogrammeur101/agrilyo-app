/**
 * ProduitCard - Carte catalogue Semences & Plants.
 */

import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  LABEL_IVOIRE_LABELS,
  ProduitResume,
  TYPE_PRODUIT_LABELS,
  UNITE_STOCK_LABELS,
} from "../../api/semences.api";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../constants/theme";
import LabelIvoireBadge from "../ui/LabelIvoireBadge";
import StockBadge from "../ui/StockBadge";

interface ProduitCardProps {
  produit: ProduitResume;
  onPress: () => void;
  onAddToCart?: () => void;
}

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export default function ProduitCard({
  produit,
  onPress,
  onAddToCart,
}: ProduitCardProps) {
  const typeLabel = TYPE_PRODUIT_LABELS[produit.type_produit];
  const uniteLabel = UNITE_STOCK_LABELS[produit.unite_stock];
  const isAvailable = produit.statut === "ACTIF" && produit.stock_disponible > 0;
  const labelIvoire = produit.fournisseur.label_ivoire;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.imageWrap}>
        {produit.photo_principale_url ? (
          <Image
            source={{ uri: produit.photo_principale_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{produit.culture.slice(0, 2).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{typeLabel}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {produit.nom}
          </Text>
          <StockBadge statut={produit.statut} stock={produit.stock_disponible} size="sm" />
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {produit.variete ? `${produit.culture} - ${produit.variete}` : produit.culture}
        </Text>

        <Text style={styles.price}>
          {formatFCFA(produit.prix_unitaire)}
          <Text style={styles.unit}> / {uniteLabel}</Text>
        </Text>

        <View style={styles.supplierRow}>
          <Text style={styles.supplier} numberOfLines={1}>
            {produit.fournisseur.nom_commercial}
          </Text>
          {labelIvoire ? (
            <Text style={styles.labelText}>{LABEL_IVOIRE_LABELS[labelIvoire]}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.rating}>
            <Text style={styles.ratingValue}>{produit.note_moyenne.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({produit.nombre_avis})</Text>
          </View>

          {labelIvoire ? <LabelIvoireBadge niveau={labelIvoire} size="sm" compact /> : null}

          {onAddToCart ? (
            <TouchableOpacity
              style={[styles.cartButton, !isAvailable && styles.cartButtonDisabled]}
              onPress={onAddToCart}
              disabled={!isAvailable}
              activeOpacity={0.85}
            >
              <Text style={styles.cartButtonText}>+</Text>
            </TouchableOpacity>
          ) : null}
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
  imageWrap: {
    height: 148,
    position: "relative",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: "#FBF4E5",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  placeholderText: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
  },
  typeTag: {
    backgroundColor: Colors.orProfond,
    borderRadius: BorderRadius.pill,
    left: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: "absolute",
    top: Spacing.sm,
  },
  typeTagText: {
    color: Colors.blanc,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    textTransform: "uppercase",
  },
  content: {
    padding: Spacing.md,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    color: Colors.textPrincipal,
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
  },
  meta: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginTop: 4,
    textTransform: "capitalize",
  },
  price: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
    marginTop: Spacing.sm,
  },
  unit: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  supplierRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  supplier: {
    color: Colors.textPrincipal,
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
  },
  labelText: {
    color: Colors.orProfond,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
    marginTop: Spacing.md,
    minHeight: 32,
  },
  rating: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 3,
  },
  ratingValue: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
  },
  ratingCount: {
    color: Colors.textDesactive,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  cartButton: {
    alignItems: "center",
    backgroundColor: Colors.orProfond,
    borderRadius: BorderRadius.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  cartButtonDisabled: {
    backgroundColor: Colors.grisMoyen,
  },
  cartButtonText: {
    color: Colors.blanc,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    lineHeight: 24,
  },
});

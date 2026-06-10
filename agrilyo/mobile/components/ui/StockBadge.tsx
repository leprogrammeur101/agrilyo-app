/**
 * StockBadge - Etat de disponibilite d'un produit Semences.
 */

import { StyleSheet, Text, View } from "react-native";
import { StatutProduit } from "../../api/semences.api";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize } from "../../constants/theme";

interface StockBadgeProps {
  statut: StatutProduit;
  stock: number;
  size?: "sm" | "md";
}

function getStockConfig(statut: StatutProduit, stock: number) {
  if (statut === "ACTIF" && stock > 0) {
    return { bg: "#E8F5E9", text: Colors.succes, label: "En stock" };
  }
  if (statut === "RUPTURE" || stock <= 0) {
    return { bg: "#FFEBEE", text: Colors.erreur, label: "Rupture" };
  }
  if (statut === "EN_ATTENTE") {
    return { bg: "#FFF8E1", text: Colors.alerte, label: "En attente" };
  }
  return { bg: Colors.grisLeger, text: Colors.textSecondaire, label: "Inactif" };
}

export default function StockBadge({ statut, stock, size = "md" }: StockBadgeProps) {
  const config = getStockConfig(statut, stock);
  const isSmall = size === "sm";

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.label, { color: config.text }, isSmall && styles.labelSm]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: BorderRadius.pill,
    flexDirection: "row",
    gap: 5,
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeSm: {
    minHeight: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
  },
  labelSm: {
    fontSize: FontSize.xs,
  },
});

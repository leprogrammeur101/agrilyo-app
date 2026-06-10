/**
 * LabelIvoireBadge - Badge de confiance du module Semences.
 */

import { StyleSheet, Text, View } from "react-native";
import { LABEL_IVOIRE_LABELS, NiveauLabel } from "../../api/semences.api";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize } from "../../constants/theme";

interface LabelIvoireBadgeProps {
  niveau: NiveauLabel | null;
  size?: "sm" | "md";
  compact?: boolean;
}

const LABEL_CONFIG: Record<NiveauLabel, { bg: string; text: string; mark: string }> = {
  BRONZE: { bg: "#F7E9D4", text: "#8A5A20", mark: "B" },
  ARGENT: { bg: "#ECEFF1", text: "#546E7A", mark: "A" },
  OR: { bg: "#FFF4CC", text: Colors.orProfond, mark: "O" },
};

export default function LabelIvoireBadge({
  niveau,
  size = "md",
  compact = false,
}: LabelIvoireBadgeProps) {
  if (!niveau) return null;

  const config = LABEL_CONFIG[niveau];
  const isSmall = size === "sm";

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSm]}>
      <Text style={[styles.mark, { color: config.text }, isSmall && styles.markSm]}>
        {config.mark}
      </Text>
      {!compact ? (
        <Text style={[styles.label, { color: config.text }, isSmall && styles.labelSm]}>
          {LABEL_IVOIRE_LABELS[niveau]}
        </Text>
      ) : null}
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
  mark: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xs,
  },
  markSm: {
    fontSize: 10,
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
  },
  labelSm: {
    fontSize: FontSize.xs,
  },
});

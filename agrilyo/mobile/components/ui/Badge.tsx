import { View, Text, StyleSheet } from "react-native";
import { BadgeSecurite, BADGE_LABELS } from "../../api/foncier.api";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, BorderRadius } from "../../constants/theme";

interface BadgeFoncierProps {
  badge: BadgeSecurite;
  size?: "sm" | "md";
}

const BADGE_CONFIG: Record<BadgeSecurite, { bg: string; text: string; icon: string }> = {
  NON_VERIFIE:       { bg: "#F5F5F5",              text: "#757575", icon: "○" },
  COUTUMIER_DECLARE: { bg: "#FFF8E1",              text: "#F57C00", icon: "◐" },
  CF_VERIFIE:        { bg: "#E8F5E9",              text: "#2E7D32", icon: "✓" },
  TF_VERIFIE:        { bg: Colors.vertForetAlpha,  text: Colors.vertForet, icon: "✓✓" },
};

export default function BadgeFoncier({ badge, size = "md" }: BadgeFoncierProps) {
  // Fallback sur NON_VERIFIE si valeur inconnue reçue du backend
  const config = BADGE_CONFIG[badge] ?? BADGE_CONFIG["NON_VERIFIE"];
  const label  = BADGE_LABELS[badge]  ?? badge ?? "Non vérifié";
  const isSmall = size === "sm";

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSm]}>
      <Text style={[styles.icon, { color: config.text }, isSmall && styles.iconSm]}>
        {config.icon}
      </Text>
      <Text style={[styles.label, { color: config.text }, isSmall && styles.labelSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.pill, alignSelf: "flex-start",
  },
  badgeSm:   { paddingHorizontal: 7, paddingVertical: 3 },
  icon:      { fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm },
  iconSm:    { fontSize: FontSize.xs },
  label:     { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm },
  labelSm:   { fontSize: FontSize.xs },
});
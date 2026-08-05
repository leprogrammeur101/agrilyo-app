/**
 * AgronomeCard - Carte profil agronome M3 Conseil.
 */

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AgronomeResume } from "../../api/conseil.api";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../constants/theme";

interface AgronomeCardProps {
  agronome: AgronomeResume;
  onPress?: () => void;
}

function firstItems(values: string[], fallback: string): string {
  if (!values.length) return fallback;
  return values.slice(0, 3).join(" · ");
}

export default function AgronomeCard({ agronome, onPress }: AgronomeCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.avatar}>
        <Ionicons name="school-outline" size={24} color={Colors.conseil} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {agronome.titre}
          </Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={Colors.succes} />
            <Text style={styles.verifiedText}>Verifie</Text>
          </View>
        </View>

        {agronome.organisation ? (
          <Text style={styles.organisation} numberOfLines={1}>
            {agronome.organisation}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="leaf-outline" size={14} color={Colors.conseil} />
          <Text style={styles.metaText} numberOfLines={1}>
            {firstItems(agronome.cultures, "Cultures a preciser")}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={Colors.conseil} />
          <Text style={styles.metaText} numberOfLines={1}>
            {firstItems(agronome.regions_couvertes, "Regions a preciser")}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{agronome.annees_experience}</Text>
            <Text style={styles.statLabel}>ans exp.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{agronome.note_moyenne.toFixed(1)}</Text>
            <Text style={styles.statLabel}>note</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{agronome.nombre_sessions}</Text>
            <Text style={styles.statLabel}>sessions</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 128,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: Colors.vertForetAlpha,
    borderRadius: BorderRadius.md,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  content: { flex: 1 },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    color: Colors.textPrincipal,
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.md,
  },
  verifiedBadge: {
    alignItems: "center",
    borderColor: Colors.succes,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  verifiedText: {
    color: Colors.succes,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
  },
  organisation: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: 7,
  },
  metaText: {
    color: Colors.textSecondaire,
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  statsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  stat: { minWidth: 48 },
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
    height: 26,
    width: StyleSheet.hairlineWidth,
  },
});
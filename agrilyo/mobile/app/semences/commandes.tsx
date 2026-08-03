/**
 * Historique commandes Semences - Sprint 5 sans paiement.
 */

import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommandeResume, StatutCommandeSemences } from "../../api/semences.api";
import { useSemencesStore } from "../../store/semences.store";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../constants/theme";

const STATUT_LABELS: Record<StatutCommandeSemences, string> = {
  BROUILLON: "Brouillon",
  CONFIRMEE: "Confirmee",
  EN_ATTENTE_PAIEMENT: "Paiement attendu",
  PAYEE: "Payee",
  ANNULEE: "Annulee",
  ECHEC_PAIEMENT: "Paiement echoue",
  EN_PREPARATION: "En preparation",
  LIVREE: "Livree",
};

const STATUT_COLORS: Partial<Record<StatutCommandeSemences, string>> = {
  CONFIRMEE: Colors.orProfond,
  EN_PREPARATION: Colors.info,
  LIVREE: Colors.succes,
  ANNULEE: Colors.erreur,
};

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CommandeCard({ commande }: { commande: CommandeResume }) {
  const color = STATUT_COLORS[commande.statut] ?? Colors.textSecondaire;

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={styles.card}
      onPress={() => router.push(`/semences/commandes/${commande.id}` as never)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.reference}>{commande.reference}</Text>
          <Text style={styles.date}>{formatDate(commande.created_at)}</Text>
        </View>
        <View style={[styles.badge, { borderColor: color }]}>
          <Text style={[styles.badgeText, { color }]}>{STATUT_LABELS[commande.statut]}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.metaLabel}>Total</Text>
          <Text style={styles.total}>{formatFCFA(commande.montant_total)}</Text>
        </View>
        <View style={styles.linesCount}>
          <Ionicons name="leaf-outline" size={16} color={Colors.orProfond} />
          <Text style={styles.linesText}>
            {commande.nombre_lignes} ligne{commande.nombre_lignes !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CommandesSemencesScreen() {
  const { commandes, chargerCommandes, isLoadingCommandes, error } = useSemencesStore();

  useEffect(() => {
    chargerCommandes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerCommandes();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Commandes</Text>
          <Text style={styles.headerSub}>Suivi semences & plants</Text>
        </View>
        <TouchableOpacity onPress={chargerCommandes} style={styles.iconButton}>
          <Ionicons name="refresh" size={21} color={Colors.blanc} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={commandes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommandeCard commande={item} />}
        contentContainerStyle={styles.list}
        refreshing={isLoadingCommandes && commandes.length > 0}
        onRefresh={chargerCommandes}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() =>
          isLoadingCommandes ? (
            <ActivityIndicator color={Colors.orProfond} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={54} color={Colors.orProfond} />
              <Text style={styles.emptyTitle}>Aucune commande</Text>
              <Text style={styles.emptySubtitle}>
                {error || "Confirmez un panier pour retrouver son suivi ici."}
              </Text>
              <TouchableOpacity
                style={styles.catalogButton}
                onPress={() => router.replace("/(tabs)/semences" as never)}
              >
                <Text style={styles.catalogButtonText}>Voir le catalogue</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.orProfond, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: Colors.orProfond,
    flexDirection: "row",
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  iconButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerText: { flex: 1 },
  headerTitle: {
    color: Colors.blanc,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
  },
  headerSub: {
    color: "#FFF4CC",
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  list: {
    backgroundColor: Colors.cremeIvoire,
    flexGrow: 1,
    padding: Spacing.md,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  cardTitleGroup: { flex: 1 },
  reference: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.lg,
  },
  date: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  badge: {
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
  },
  cardFooter: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  metaLabel: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  total: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
  },
  linesCount: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  linesText: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
  },
  loader: { marginTop: Spacing.xl },
  empty: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 90,
  },
  emptyTitle: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  catalogButton: {
    backgroundColor: Colors.orProfond,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  catalogButtonText: {
    color: Colors.blanc,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
  },
});

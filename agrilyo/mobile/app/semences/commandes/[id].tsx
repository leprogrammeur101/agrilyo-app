/**
 * Detail commande Semences - suivi sans paiement.
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
import { StatutCommandeSemences, UNITE_STOCK_LABELS } from "../../../api/semences.api";
import { useSemencesStore } from "../../../store/semences.store";
import { Colors } from "../../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../../constants/theme";

const ETAPES: StatutCommandeSemences[] = ["CONFIRMEE", "EN_PREPARATION", "LIVREE"];

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

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DetailCommandeSemencesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { commandeSelectionnee, chargerCommande, isLoadingCommandes, error } = useSemencesStore();

  useEffect(() => {
    if (id) chargerCommande(id);
  }, [id]);

  const commande = commandeSelectionnee;
  const stepIndex = commande ? ETAPES.indexOf(commande.statut) : -1;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Suivi commande</Text>
          <Text style={styles.headerSub}>{commande?.reference ?? "Semences & plants"}</Text>
        </View>
      </View>

      {isLoadingCommandes && !commande ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.orProfond} />
        </View>
      ) : !commande ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.erreur} />
          <Text style={styles.emptyTitle}>{error || "Commande introuvable"}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <Text style={styles.reference}>{commande.reference}</Text>
            <Text style={styles.date}>{formatDate(commande.created_at)}</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatFCFA(commande.montant_total)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progression</Text>
            {commande.statut === "ANNULEE" ? (
              <View style={styles.cancelled}>
                <Ionicons name="close-circle-outline" size={22} color={Colors.erreur} />
                <Text style={styles.cancelledText}>Commande annulee</Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {ETAPES.map((statut, index) => {
                  const active = index <= stepIndex;
                  return (
                    <View key={statut} style={styles.step}>
                      <View style={[styles.stepDot, active && styles.stepDotActive]}>
                        {active ? (
                          <Ionicons name="checkmark" size={13} color={Colors.blanc} />
                        ) : null}
                      </View>
                      <Text style={[styles.stepText, active && styles.stepTextActive]}>
                        {STATUT_LABELS[statut]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produits</Text>
            {commande.lignes.map((ligne) => (
              <View key={ligne.id} style={styles.line}>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineTitle} numberOfLines={2}>
                    {ligne.produit_nom_snapshot}
                  </Text>
                  <Text style={styles.lineMeta} numberOfLines={1}>
                    {ligne.fournisseur_nom_snapshot}
                  </Text>
                  <Text style={styles.lineMeta}>
                    {ligne.quantite} {UNITE_STOCK_LABELS[ligne.unite_stock_snapshot]} x{" "}
                    {formatFCFA(ligne.prix_unitaire_snapshot)}
                  </Text>
                </View>
                <Text style={styles.lineAmount}>{formatFCFA(ligne.montant_ligne)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livraison</Text>
            <Text style={styles.infoText}>
              {commande.nom_contact || "Contact non precise"}
              {commande.telephone_contact ? ` - ${commande.telephone_contact}` : ""}
            </Text>
            <Text style={styles.infoText}>
              {[commande.region_livraison, commande.ville_livraison, commande.adresse_livraison]
                .filter(Boolean)
                .join(", ") || "Adresse a confirmer avec le fournisseur"}
            </Text>
          </View>
        </ScrollView>
      )}
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
  center: {
    alignItems: "center",
    backgroundColor: Colors.cremeIvoire,
    flex: 1,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  content: {
    backgroundColor: Colors.cremeIvoire,
    flexGrow: 1,
    padding: Spacing.md,
    paddingBottom: 96,
  },
  summary: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  reference: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  date: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  totalLabel: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
  },
  totalValue: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.lg,
    marginBottom: Spacing.sm,
  },
  timeline: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  step: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 34,
  },
  stepDot: {
    alignItems: "center",
    backgroundColor: Colors.grisMoyen,
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  stepDotActive: {
    backgroundColor: Colors.orProfond,
  },
  stepText: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
  },
  stepTextActive: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.bodyBold,
  },
  cancelled: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cancelledText: {
    color: Colors.erreur,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
  },
  line: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  lineInfo: { flex: 1 },
  lineTitle: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
  },
  lineMeta: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  lineAmount: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
  },
  infoText: {
    backgroundColor: Colors.blanc,
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
    marginTop: Spacing.md,
    textAlign: "center",
  },
});

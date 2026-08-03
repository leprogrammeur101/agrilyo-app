/**
 * Panier Semences - preparation Sprint 5 commandes.
 */

import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { UNITE_STOCK_LABELS } from "../../api/semences.api";
import { PanierItem, useSemencesStore } from "../../store/semences.store";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../constants/theme";

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function PanierRow({ item }: { item: PanierItem }) {
  const { modifierQuantite, retirerDuPanier } = useSemencesStore();
  const produit = item.produit;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {produit.nom}
          </Text>
          <Text style={styles.itemMeta} numberOfLines={1}>
            {produit.fournisseur.nom_commercial}
          </Text>
        </View>
        <TouchableOpacity onPress={() => retirerDuPanier(produit.id)} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={18} color={Colors.erreur} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemFooter}>
        <View>
          <Text style={styles.unitPrice}>
            {formatFCFA(produit.prix_unitaire)} / {UNITE_STOCK_LABELS[produit.unite_stock]}
          </Text>
          <Text style={styles.lineTotal}>{formatFCFA(produit.prix_unitaire * item.quantite)}</Text>
        </View>

        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => modifierQuantite(produit.id, item.quantite - 1)}
          >
            <Ionicons name="remove" size={18} color={Colors.orProfond} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantite}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => modifierQuantite(produit.id, item.quantite + 1)}
          >
            <Ionicons name="add" size={18} color={Colors.orProfond} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function PanierSemencesScreen() {
  const {
    panier,
    nombreArticles,
    totalPanier,
    viderPanier,
    confirmerCommandeDepuisPanier,
    isSubmittingCommande,
  } = useSemencesStore();

  const handleConfirmerCommande = async () => {
    const commande = await confirmerCommandeDepuisPanier();
    if (!commande) return;

    Alert.alert(
      "Commande confirmee",
      `Reference ${commande.reference}. Le fournisseur pourra preparer votre commande.`,
      [{ text: "OK", onPress: () => router.replace("/(tabs)/semences" as never) }]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Panier</Text>
          <Text style={styles.headerSub}>
            {nombreArticles} article{nombreArticles !== 1 ? "s" : ""}
          </Text>
        </View>
        {panier.length > 0 ? (
          <TouchableOpacity onPress={viderPanier} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.blanc} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={panier}
        keyExtractor={(item) => item.produit.id}
        renderItem={({ item }) => <PanierRow item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="basket-outline" size={56} color={Colors.orProfond} />
            <Text style={styles.emptyTitle}>Panier vide</Text>
            <Text style={styles.emptySubtitle}>
              Ajoutez des semences ou plants depuis le catalogue.
            </Text>
            <TouchableOpacity
              style={styles.catalogButton}
              onPress={() => router.replace("/(tabs)/semences" as never)}
            >
              <Text style={styles.catalogButtonText}>Voir le catalogue</Text>
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {panier.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total estimatif</Text>
            <Text style={styles.totalValue}>{formatFCFA(totalPanier)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, isSubmittingCommande && styles.checkoutButtonDisabled]}
            activeOpacity={0.85}
            disabled={isSubmittingCommande}
            onPress={handleConfirmerCommande}
          >
            {isSubmittingCommande ? (
              <ActivityIndicator color={Colors.blanc} />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.blanc} />
            )}
            <Text style={styles.checkoutButtonText}>
              {isSubmittingCommande ? "Confirmation..." : "Confirmer la commande"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.cremeIvoire, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: Colors.orProfond,
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { padding: 4 },
  headerText: { flex: 1 },
  headerTitle: {
    color: Colors.blanc,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  headerSub: {
    color: "#FFF4CC",
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  list: {
    flexGrow: 1,
    padding: Spacing.md,
    paddingBottom: 140,
  },
  itemCard: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  itemHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  itemInfo: { flex: 1 },
  itemName: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.md,
  },
  itemMeta: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  removeButton: { padding: 4 },
  itemFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  unitPrice: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  lineTotal: {
    color: Colors.orProfond,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    marginTop: 2,
  },
  stepper: {
    alignItems: "center",
    backgroundColor: "#FBF4E5",
    borderRadius: BorderRadius.pill,
    flexDirection: "row",
    minHeight: 36,
  },
  stepperButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  quantity: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    minWidth: 28,
    textAlign: "center",
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 96,
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
  },
  catalogButtonText: {
    color: Colors.blanc,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
  },
  footer: {
    backgroundColor: Colors.blanc,
    borderTopColor: Colors.grisMoyen,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    position: "absolute",
    right: 0,
  },
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  totalLabel: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  totalValue: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  checkoutButton: {
    alignItems: "center",
    backgroundColor: Colors.orProfond,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    paddingVertical: 16,
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: Colors.blanc,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
  },
});

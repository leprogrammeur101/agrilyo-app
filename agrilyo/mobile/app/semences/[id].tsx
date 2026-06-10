/**
 * Fiche produit Semences - /semences/[id]
 */

import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LabelIvoireBadge from "../../components/ui/LabelIvoireBadge";
import StockBadge from "../../components/ui/StockBadge";
import {
  TYPE_PRODUIT_LABELS,
  UNITE_STOCK_LABELS,
} from "../../api/semences.api";
import { useSemencesStore } from "../../store/semences.store";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../constants/theme";

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function FicheProduitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    produitSelectionne,
    isLoadingDetail,
    chargerDetailProduit,
    clearDetailProduit,
    ajouterAuPanier,
  } = useSemencesStore();

  useEffect(() => {
    if (id) chargerDetailProduit(id);
    return () => clearDetailProduit();
  }, [id]);

  if (isLoadingDetail || !produitSelectionne) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.orProfond} />
      </View>
    );
  }

  const produit = produitSelectionne;
  const photo = produit.photos.find((p) => p.est_principale) ?? produit.photos[0];
  const isAvailable = produit.statut === "ACTIF" && produit.stock_disponible > 0;
  const certificationsVerifiees = produit.certifications.filter((c) => c.est_verifie);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {produit.nom}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/semences/panier" as never)}
          style={styles.headerButton}
        >
          <Ionicons name="basket-outline" size={22} color={Colors.blanc} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {photo ? (
            <Image source={{ uri: photo.url_stockage }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderText}>
                {produit.culture.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{TYPE_PRODUIT_LABELS[produit.type_produit]}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{produit.nom}</Text>
              <Text style={styles.subtitle}>
                {produit.variete ? `${produit.culture} - ${produit.variete}` : produit.culture}
              </Text>
            </View>
            <StockBadge statut={produit.statut} stock={produit.stock_disponible} />
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.price}>{formatFCFA(produit.prix_unitaire)}</Text>
            <Text style={styles.priceUnit}>/ {UNITE_STOCK_LABELS[produit.unite_stock]}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilite</Text>
            <InfoRow
              label="Stock"
              value={`${produit.stock_disponible} ${UNITE_STOCK_LABELS[produit.unite_stock]}`}
            />
            <InfoRow
              label="Commande minimale"
              value={`${produit.stock_minimum_commande} ${UNITE_STOCK_LABELS[produit.unite_stock]}`}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caracteristiques</Text>
            <InfoRow
              label="Germination"
              value={
                produit.duree_germination_jours
                  ? `${produit.duree_germination_jours} jours`
                  : null
              }
            />
            <InfoRow label="Rendement potentiel" value={produit.rendement_potentiel} />
            <InfoRow label="Zones d'adaptation" value={produit.zones_adaptation} />
            <InfoRow label="Saison de semis" value={produit.saison_semis} />
          </View>

          {produit.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{produit.description}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.supplierCard}
            onPress={() =>
              router.push(`/semences/fournisseur/${produit.fournisseur.id}` as never)
            }
            activeOpacity={0.86}
          >
            <View style={styles.supplierAvatar}>
              <Text style={styles.supplierAvatarText}>
                {produit.fournisseur.nom_commercial.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.supplierInfo}>
              <Text style={styles.supplierName}>{produit.fournisseur.nom_commercial}</Text>
              <Text style={styles.supplierMeta}>{produit.fournisseur.region}</Text>
            </View>
            <LabelIvoireBadge niveau={produit.fournisseur.label_ivoire} size="sm" compact />
            <Ionicons name="chevron-forward" size={18} color={Colors.textDesactive} />
          </TouchableOpacity>

          {certificationsVerifiees.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              {certificationsVerifiees.map((certification) => (
                <View key={certification.id} style={styles.certification}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.succes} />
                  <Text style={styles.certificationText}>
                    {certification.type_certification}
                    {certification.organisme_delivreur
                      ? ` - ${certification.organisme_delivreur}`
                      : ""}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.ratingCard}>
            <Text style={styles.ratingValue}>{produit.note_moyenne.toFixed(1)}</Text>
            <Text style={styles.ratingText}>
              {produit.nombre_avis} avis publie{produit.nombre_avis !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, !isAvailable && styles.addButtonDisabled]}
          disabled={!isAvailable}
          onPress={() => ajouterAuPanier(produit)}
          activeOpacity={0.9}
        >
          <Ionicons name="basket" size={20} color={Colors.blanc} />
          <Text style={styles.addButtonText}>
            {isAvailable ? "Ajouter au panier" : "Indisponible"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.cremeIvoire, flex: 1 },
  loading: {
    alignItems: "center",
    backgroundColor: Colors.cremeIvoire,
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: Colors.orProfond,
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerButton: { padding: 4 },
  headerTitle: {
    color: Colors.blanc,
    flex: 1,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 104 },
  hero: { height: 220, position: "relative" },
  heroImage: { height: "100%", width: "100%" },
  heroPlaceholder: {
    alignItems: "center",
    backgroundColor: "#FBF4E5",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  heroPlaceholderText: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxxl,
  },
  typeTag: {
    backgroundColor: Colors.orProfond,
    borderRadius: BorderRadius.pill,
    bottom: Spacing.md,
    left: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 5,
    position: "absolute",
  },
  typeTagText: {
    color: Colors.blanc,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
  },
  body: { padding: Spacing.lg },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  titleBlock: { flex: 1 },
  title: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
  },
  subtitle: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    marginTop: 2,
    textTransform: "capitalize",
  },
  priceCard: {
    alignItems: "baseline",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.xs,
    marginVertical: Spacing.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  price: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  priceUnit: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    borderBottomColor: Colors.grisMoyen,
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    color: Colors.textDesactive,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  infoValue: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    marginTop: 2,
  },
  description: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  supplierCard: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  supplierAvatar: {
    alignItems: "center",
    backgroundColor: "#FBF4E5",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  supplierAvatarText: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
  },
  supplierInfo: { flex: 1 },
  supplierName: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
  },
  supplierMeta: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  certification: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  certificationText: {
    color: Colors.textPrincipal,
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
  },
  ratingCard: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  ratingValue: {
    color: Colors.orProfond,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
  },
  ratingText: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  footer: {
    backgroundColor: Colors.blanc,
    borderTopColor: Colors.grisMoyen,
    borderTopWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: Colors.orProfond,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    paddingVertical: 16,
  },
  addButtonDisabled: { backgroundColor: Colors.grisFonce },
  addButtonText: {
    color: Colors.blanc,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
  },
});

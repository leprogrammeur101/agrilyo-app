/**
 * Ecran Semences - Catalogue M2.
 */

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ProduitCard from "../../components/common/ProduitCard";
import { TypeProduit, TYPE_PRODUIT_LABELS } from "../../api/semences.api";
import { useSemencesStore } from "../../store/semences.store";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../constants/theme";

const TYPES_FILTRES: { value: TypeProduit | null; label: string }[] = [
  { value: null, label: "Tous" },
  { value: "SEMENCE", label: TYPE_PRODUIT_LABELS.SEMENCE },
  { value: "PLANT", label: TYPE_PRODUIT_LABELS.PLANT },
  { value: "BOUTURE", label: TYPE_PRODUIT_LABELS.BOUTURE },
  { value: "TUBERCULE", label: TYPE_PRODUIT_LABELS.TUBERCULE },
];

export default function SemencesScreen() {
  const {
    produits,
    totalProduits,
    isLoadingProduits,
    isRefreshingProduits,
    error,
    nombreArticles,
    chargerProduits,
    rafraichirProduits,
    chargerProduitsSuivants,
    setFiltresProduits,
    ajouterAuPanier,
  } = useSemencesStore();

  const [recherche, setRecherche] = useState("");
  const [typeActif, setTypeActif] = useState<TypeProduit | null>(null);
  const [stockOnly, setStockOnly] = useState(true);

  useEffect(() => {
    chargerProduits(true);
  }, []);

  const handleRecherche = (text: string) => {
    setRecherche(text);
    setFiltresProduits({
      culture: text.trim() || undefined,
      region: text.trim() || undefined,
    });
  };

  const handleTypeFiltre = (type: TypeProduit | null) => {
    setTypeActif(type);
    setFiltresProduits({ type_produit: type ?? undefined });
  };

  const toggleStock = () => {
    const next = !stockOnly;
    setStockOnly(next);
    setFiltresProduits({ en_stock: next ? true : undefined });
  };

  const ListHeader = () => (
    <View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textDesactive} />
        <TextInput
          style={styles.searchInput}
          placeholder="Culture ou region..."
          placeholderTextColor={Colors.textDesactive}
          value={recherche}
          onChangeText={handleRecherche}
        />
        {recherche.length > 0 ? (
          <TouchableOpacity onPress={() => handleRecherche("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textDesactive} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtresScroll}
        contentContainerStyle={styles.filtresContent}
      >
        {TYPES_FILTRES.map((filtre) => (
          <TouchableOpacity
            key={filtre.label}
            style={[
              styles.filtrePill,
              typeActif === filtre.value && styles.filtrePillActif,
            ]}
            onPress={() => handleTypeFiltre(filtre.value)}
          >
            <Text
              style={[
                styles.filtrePillText,
                typeActif === filtre.value && styles.filtrePillTextActif,
              ]}
            >
              {filtre.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.filtrePill, stockOnly && styles.filtrePillActif]}
          onPress={toggleStock}
        >
          <Text style={[styles.filtrePillText, stockOnly && styles.filtrePillTextActif]}>
            En stock
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {!isLoadingProduits ? (
        <Text style={styles.compteur}>
          {totalProduits} produit{totalProduits !== 1 ? "s" : ""} disponible
          {totalProduits !== 1 ? "s" : ""}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Semences</Text>
          <Text style={styles.headerSub}>Catalogue certifie</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/semences/commandes" as never)}
            activeOpacity={0.86}
          >
            <Ionicons name="receipt-outline" size={21} color={Colors.orProfond} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/semences/panier" as never)}
            activeOpacity={0.86}
          >
            <Ionicons name="basket-outline" size={21} color={Colors.orProfond} />
            {nombreArticles > 0 ? (
              <View style={styles.cartCount}>
                <Text style={styles.cartCountText}>{nombreArticles}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={produits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProduitCard
            produit={item}
            onPress={() => router.push(`/semences/${item.id}` as never)}
            onAddToCart={() => ajouterAuPanier(item)}
          />
        )}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() =>
          isLoadingProduits ? null : (
            <View style={styles.vide}>
              <Ionicons name="leaf-outline" size={48} color={Colors.orProfond} />
              <Text style={styles.videTitle}>Aucun produit</Text>
              <Text style={styles.videSubtitle}>
                {error || "Aucune semence ne correspond a vos filtres."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={() =>
          isLoadingProduits && produits.length > 0 ? (
            <ActivityIndicator color={Colors.orProfond} style={styles.footerLoader} />
          ) : null
        }
        onRefresh={rafraichirProduits}
        refreshing={isRefreshingProduits}
        onEndReached={chargerProduitsSuivants}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: Colors.orProfond,
    flex: 1,
  },
  header: {
    alignItems: "flex-end",
    backgroundColor: Colors.orProfond,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
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
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    position: "relative",
    width: 40,
  },
  cartCount: {
    alignItems: "center",
    backgroundColor: Colors.erreur,
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 18,
  },
  cartCountText: {
    color: Colors.blanc,
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
  },
  liste: {
    backgroundColor: Colors.cremeIvoire,
    flexGrow: 1,
    padding: Spacing.md,
    paddingBottom: 96,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Shadow.sm,
  },
  searchInput: {
    color: Colors.textPrincipal,
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
  },
  filtresScroll: {
    marginBottom: Spacing.sm,
  },
  filtresContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  filtrePill: {
    backgroundColor: Colors.blanc,
    borderColor: Colors.grisMoyen,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  filtrePillActif: {
    backgroundColor: Colors.orProfond,
    borderColor: Colors.orProfond,
  },
  filtrePillText: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
  },
  filtrePillTextActif: {
    color: Colors.blanc,
  },
  compteur: {
    color: Colors.textDesactive,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  vide: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
  },
  videTitle: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    marginTop: Spacing.md,
  },
  videSubtitle: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  footerLoader: {
    marginVertical: Spacing.lg,
  },
});

/**
 * Écran Foncier — Liste des annonces M1
 * Pull-to-refresh · Pagination infinie · Filtres rapides
 */

import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AnnonceCard from "../../components/common/AnnonceCard";
import { useFoncierStore } from "../../store/foncier.store";
import { TypeAcces, TYPE_ACCES_LABELS } from "../../api/foncier.api";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../constants/theme";

const TYPES_FILTRES: { value: TypeAcces | null; label: string }[] = [
  { value: null,         label: "Tous" },
  { value: "LOCATION",   label: "Location" },
  { value: "VENTE",      label: "Vente" },
  { value: "METAYAGE",   label: "Métayage" },
  { value: "AMODIATION", label: "Amodiation" },
];

export default function FoncierScreen() {
  const {
    annonces, total, isLoading, isRefreshing, error,
    chargerAnnonces, rafraichir, chargerSuivant, setFiltres,
  } = useFoncierStore();

  const [recherche, setRecherche] = useState("");
  const [typeActif, setTypeActif] = useState<TypeAcces | null>(null);

  useEffect(() => {
    chargerAnnonces(true);
  }, []);

  const handleRecherche = (text: string) => {
    setRecherche(text);
    setFiltres({ region: text || undefined });
  };

  const handleTypeFiltre = (type: TypeAcces | null) => {
    setTypeActif(type);
    setFiltres({ type_acces: type ?? undefined });
  };

  const ListHeader = () => (
    <View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textDesactive} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par région..."
          placeholderTextColor={Colors.textDesactive}
          value={recherche}
          onChangeText={handleRecherche}
        />
        {recherche.length > 0 && (
          <TouchableOpacity onPress={() => handleRecherche("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textDesactive} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtresScroll}
        contentContainerStyle={styles.filtresContent}
      >
        {TYPES_FILTRES.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filtrePill, typeActif === f.value && styles.filtrePillActif]}
            onPress={() => handleTypeFiltre(f.value)}
          >
            <Text style={[styles.filtrePillText, typeActif === f.value && styles.filtrePillTextActif]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {!isLoading && (
        <Text style={styles.compteur}>
          {total} annonce{total !== 1 ? "s" : ""} trouvée{total !== 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Foncier</Text>
          <Text style={styles.headerSub}>Terres disponibles</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push("/foncier/conversations" as never)}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={Colors.vertForet} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mesAnnoncesBtn}
            onPress={() => router.push("/foncier/mes-annonces" as never)}
          >
            <Ionicons name="list" size={18} color={Colors.vertForet} />
            <Text style={styles.mesAnnoncesBtnText}>Mes annonces</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={annonces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnnonceCard
            annonce={item}
            onPress={() => router.push(`/foncier/${item.id}` as never)}
          />
        )}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() =>
          isLoading ? null : (
            <View style={styles.vide}>
              <Text style={styles.videIcon}>🌍</Text>
              <Text style={styles.videTitle}>Aucune annonce</Text>
              <Text style={styles.videSubtitle}>
                {error || "Aucune annonce disponible pour le moment."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={() =>
          isLoading && annonces.length > 0 ? (
            <ActivityIndicator color={Colors.vertForet} style={{ marginVertical: Spacing.lg }} />
          ) : null
        }
        onRefresh={rafraichir}
        refreshing={isRefreshing}
        onEndReached={chargerSuivant}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fabBtn}
        onPress={() => router.push("/foncier/creer" as never)}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color={Colors.blanc} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.vertForet },
  header: {
    backgroundColor: Colors.vertForet,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xxl, color: Colors.blanc },
  headerSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.orClair },
  headerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerActionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.blanc, alignItems: "center", justifyContent: "center",
  },
  mesAnnoncesBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.blanc, paddingHorizontal: Spacing.md,
    paddingVertical: 8, borderRadius: BorderRadius.pill,
  },
  mesAnnoncesBtnText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.vertForet },
  liste: { padding: Spacing.md, paddingBottom: 100, backgroundColor: Colors.cremeIvoire, flexGrow: 1 },
  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10,
    gap: Spacing.sm, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.textPrincipal },
  filtresScroll: { marginBottom: Spacing.sm },
  filtresContent: { gap: Spacing.sm, paddingRight: Spacing.sm },
  filtrePill: {
    paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.blanc, borderWidth: 1.5, borderColor: Colors.grisMoyen,
  },
  filtrePillActif: { backgroundColor: Colors.vertForet, borderColor: Colors.vertForet },
  filtrePillText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textSecondaire },
  filtrePillTextActif: { color: Colors.blanc },
  compteur: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textDesactive, marginBottom: Spacing.sm },
  vide: { alignItems: "center", paddingTop: 80 },
  videIcon: { fontSize: 56, marginBottom: Spacing.md },
  videTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, color: Colors.textPrincipal, marginBottom: Spacing.sm },
  videSubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.textSecondaire, textAlign: "center" },
  fabBtn: {
    position: "absolute", bottom: 90, right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.vertForet,
    alignItems: "center", justifyContent: "center", ...Shadow.lg,
  },
});

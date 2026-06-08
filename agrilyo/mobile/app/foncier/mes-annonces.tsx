/**
 * Écran Mes Annonces — /foncier/mes-annonces
 * Liste les annonces du bailleur connecté (tous statuts).
 */

import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { foncierApi, AnnonceResume, TYPE_ACCES_LABELS } from "../../api/foncier.api";
import { getApiErrorMessage } from "../../api/client";
import BadgeFoncier from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../constants/theme";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<string, { couleur: string; label: string; icone: string }> = {
  ACTIVE:     { couleur: Colors.succes,    label: "Active",     icone: "checkmark-circle" },
  EN_ATTENTE: { couleur: Colors.alerte,    label: "En attente", icone: "time" },
  INACTIVE:   { couleur: Colors.grisFonce, label: "Inactive",   icone: "pause-circle" },
  LOUE:       { couleur: Colors.info,      label: "Louée",      icone: "key" },
};

function formatFCFA(v: number) {
  return v.toLocaleString("fr-FR") + " FCFA";
}

// ── Carte annonce bailleur ────────────────────────────────────────────────────

function AnnoncesBailleurCard({
  annonce,
  onPress,
}: {
  annonce: AnnonceResume;
  onPress: () => void;
}) {
  const statutConf = STATUT_CONFIG[annonce.statut] || STATUT_CONFIG["INACTIVE"];
  const typeLabel = TYPE_ACCES_LABELS[annonce.type_acces] || annonce.type_acces;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* En-tête */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardSuperficie}>{annonce.superficie_ha} ha</Text>
          <Text style={styles.cardType}>{typeLabel}</Text>
        </View>
        <View style={[styles.statutPill, { backgroundColor: `${statutConf.couleur}20` }]}>
          <Ionicons name={statutConf.icone as any} size={12} color={statutConf.couleur} />
          <Text style={[styles.statutPillText, { color: statutConf.couleur }]}>
            {statutConf.label}
          </Text>
        </View>
      </View>

      {/* Localisation */}
      <View style={styles.cardLoc}>
        <Ionicons name="location-outline" size={14} color={Colors.textDesactive} />
        <Text style={styles.cardLocText}>
          {[annonce.sous_prefecture, annonce.region].filter(Boolean).join(", ") || "—"}
        </Text>
      </View>

      {/* Pied */}
      <View style={styles.cardFooter}>
        <BadgeFoncier badge={annonce.badge} size="sm" />
        <View style={styles.cardFooterRight}>
          {annonce.prix_indicatif ? (
            <Text style={styles.cardPrix}>{formatFCFA(annonce.prix_indicatif)}/ha/an</Text>
          ) : (
            <Text style={styles.cardPrixNc}>Prix à négocier</Text>
          )}
          <View style={styles.cardVues}>
            <Ionicons name="eye-outline" size={12} color={Colors.textDesactive} />
            <Text style={styles.cardVuesText}>{annonce.vues}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function MesAnnoncesScreen() {
  const [annonces, setAnnonces] = useState<AnnonceResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingPlus, setLoadingPlus] = useState(false);

  const charger = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (!reset) setLoadingPlus(true);
    try {
      const res = await foncierApi.mesAnnonces(p);
      setAnnonces(reset ? res.items : (prev) => [...prev, ...res.items]);
      setPage(res.page);
      setPages(res.pages);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingPlus(false);
    }
  }, [page]);

  useEffect(() => {
    charger(true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    charger(true);
  };

  const chargerSuivant = () => {
    if (!loadingPlus && page < pages) {
      setPage((p) => p + 1);
      charger(false);
    }
  };

  const stats = {
    actives:   annonces.filter((a) => a.statut === "ACTIVE").length,
    enAttente: annonces.filter((a) => a.statut === "EN_ATTENTE").length,
    louees:    annonces.filter((a) => a.statut === "LOUE").length,
  };

  const ListHeader = () => (
    <View>
      {annonces.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.succes }]}>{stats.actives}</Text>
            <Text style={styles.statLabel}>Actives</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.alerte }]}>{stats.enAttente}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.info }]}>{stats.louees}</Text>
            <Text style={styles.statLabel}>Louées</Text>
          </View>
        </View>
      )}
      <Text style={styles.compteur}>
        {annonces.length} annonce{annonces.length !== 1 ? "s" : ""}
      </Text>
    </View>
  );

  const ListVide = () => (
    <View style={styles.vide}>
      <Text style={styles.videIcon}>🌍</Text>
      <Text style={styles.videTitle}>Aucune annonce</Text>
      <Text style={styles.videSubtitle}>
        {error || "Vous n'avez pas encore publié d'annonce."}
      </Text>
      <TouchableOpacity
        style={styles.videBtn}
        onPress={() => router.push("/foncier/creer" as never)}
      >
        <Ionicons name="add-circle-outline" size={18} color={Colors.blanc} />
        <Text style={styles.videBtnText}>Publier une annonce</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Mes annonces</Text>
          <Text style={styles.headerSub}>Bailleur</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/foncier/creer" as never)}
        >
          <Ionicons name="add" size={24} color={Colors.blanc} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.vertForet} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={annonces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AnnoncesBailleurCard
              annonce={item}
              onPress={() =>
                router.push({
                  pathname: "/foncier/[id]",
                  params: { id: item.id },
                } as never)
              }
            />
          )}
          contentContainerStyle={styles.liste}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListVide}
          ListFooterComponent={() =>
            loadingPlus ? (
              <ActivityIndicator color={Colors.vertForet} style={{ marginVertical: Spacing.lg }} />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.vertForet]}
              tintColor={Colors.vertForet}
            />
          }
          onEndReached={chargerSuivant}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },

  header: {
    backgroundColor: Colors.vertForet,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerText: { flex: 1 },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    color: Colors.blanc,
  },
  headerSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.orClair,
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  loadingBox: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md,
  },
  loadingText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textSecondaire,
  },

  liste: { padding: Spacing.md, paddingBottom: 100, flexGrow: 1 },

  statsBar: {
    flexDirection: "row",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl },
  statLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondaire,
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: Colors.grisMoyen, marginVertical: 4 },

  compteur: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textDesactive,
    marginBottom: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  cardHeaderLeft: { flex: 1 },
  cardSuperficie: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    color: Colors.textPrincipal,
  },
  cardType: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
  },
  statutPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statutPillText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs },
  cardLoc: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  cardLocText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textDesactive,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.grisMoyen,
  },
  cardFooterRight: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  cardPrix: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    color: Colors.vertSavane,
  },
  cardPrixNc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textDesactive,
    fontStyle: "italic",
  },
  cardVues: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardVuesText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textDesactive,
  },

  vide: { alignItems: "center", paddingTop: 80, paddingHorizontal: Spacing.xl },
  videIcon: { fontSize: 56, marginBottom: Spacing.md },
  videTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    color: Colors.textPrincipal,
    marginBottom: Spacing.sm,
  },
  videSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textSecondaire,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  videBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.vertForet,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  videBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: Colors.blanc,
  },
});
/**
 * Écran Détail d'une demande de conseil — /conseil/demande/[id]
 * Affiche la demande + les résultats du matching agronome.
 * Le choix effectif d'un agronome (assignation) est réservé aux admins
 * côté backend (POST /demandes/{id}/assigner) — l'agriculteur voit les
 * suggestions en lecture seule et un message d'attente.
 */

import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../../constants/theme";
import { TYPE_CONSEIL_LABELS, StatutDemandeConseil } from "../../../api/conseil.api";
import { useConseilStore } from "../../../store/conseil.store";
import { useAuthStore } from "../../../store/auth.store";
import AgronomeCard from "../../../components/common/AgronomeCard";
import LoadingScreen from "../../../components/ui/LoadingScreen";

const STATUT_LABELS: Record<StatutDemandeConseil, string> = {
  NOUVELLE: "Nouvelle",
  ASSIGNEE: "Agronome assigné",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

const STATUT_COLORS: Record<StatutDemandeConseil, string> = {
  NOUVELLE: Colors.info,
  ASSIGNEE: Colors.conseil,
  EN_COURS: Colors.alerte,
  TERMINEE: Colors.succes,
  ANNULEE: Colors.textDesactive,
};

export default function DetailDemandeConseilScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes("ADMIN") ?? false;

  const {
    demandeSelectionnee: demande,
    suggestions,
    isLoadingDemandes,
    isLoadingMatching,
    isAssigning,
    chargerDemande,
    chargerMatching,
    assignerAgronome,
  } = useConseilStore();

  useEffect(() => {
    if (id) {
      chargerDemande(id);
      chargerMatching(id);
    }
  }, [id]);

  if (isLoadingDemandes || !demande) {
    return <LoadingScreen message="Chargement de la demande..." />;
  }

  const showMatching = demande.statut === "NOUVELLE" && suggestions.length > 0;

  const handleChoisir = async (agronomeId: string, score: number) => {
    const ok = await assignerAgronome(demande.id, agronomeId, score);
    if (ok) {
      router.replace({ pathname: "/conseil/demande/[id]", params: { id: demande.id } });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {demande.titre}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte résumé de la demande */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={[styles.badge, { backgroundColor: `${STATUT_COLORS[demande.statut]}1A` }]}>
              <Text style={[styles.badgeText, { color: STATUT_COLORS[demande.statut] }]}>
                {STATUT_LABELS[demande.statut]}
              </Text>
            </View>
            {demande.urgence && (
              <View style={styles.urgentBadge}>
                <Ionicons name="alert-circle" size={13} color={Colors.erreur} />
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </View>

          <Text style={styles.type}>{TYPE_CONSEIL_LABELS[demande.type_conseil]}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="leaf-outline" size={15} color={Colors.conseil} />
            <Text style={styles.metaText}>
              {demande.culture}
              {demande.variete ? ` · ${demande.variete}` : ""}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={15} color={Colors.conseil} />
            <Text style={styles.metaText}>
              {demande.region}
              {demande.ville ? ` · ${demande.ville}` : ""}
            </Text>
          </View>

          <Text style={styles.description}>{demande.description}</Text>
        </View>

        {/* Résultats du matching */}
        {demande.statut === "NOUVELLE" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agronomes suggérés</Text>

            {isLoadingMatching && (
              <ActivityIndicator color={Colors.conseil} style={{ marginTop: Spacing.md }} />
            )}

            {!isLoadingMatching && suggestions.length === 0 && (
              <Text style={styles.emptyText}>
                Aucun agronome disponible ne correspond encore à votre demande. Réessayez plus tard.
              </Text>
            )}

            {!isAdmin && showMatching && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
                <Text style={styles.infoBoxText}>
                  Notre équipe va vous assigner l'un de ces agronomes sous peu.
                </Text>
              </View>
            )}

            {suggestions.map((suggestion) => (
              <View key={suggestion.agronome.id}>
                <AgronomeCard
                  agronome={suggestion.agronome}
                  onPress={() =>
                    router.push({
                      pathname: "/conseil/agronome/[id]",
                      params: { id: suggestion.agronome.id },
                    })
                  }
                />
                <View style={styles.scoreRow}>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>{Math.round(suggestion.score)}% de match</Text>
                  </View>
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.choisirBtn}
                      onPress={() => handleChoisir(suggestion.agronome.id, suggestion.score)}
                      disabled={isAssigning}
                    >
                      {isAssigning ? (
                        <ActivityIndicator size="small" color={Colors.blanc} />
                      ) : (
                        <Text style={styles.choisirBtnText}>Choisir</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Demande déjà assignée / en cours */}
        {demande.agronome_id && demande.statut !== "NOUVELLE" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suivi</Text>
            <TouchableOpacity
              style={styles.suiviCard}
              onPress={() =>
                router.push({
                  pathname: "/conseil/agronome/[id]",
                  params: { id: demande.agronome_id! },
                })
              }
            >
              <Ionicons name="school-outline" size={20} color={Colors.conseil} />
              <Text style={styles.suiviText}>Voir le profil de l'agronome assigné</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondaire} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },
  header: {
    backgroundColor: Colors.conseil,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.lg,
    color: Colors.blanc,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  badgeText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    backgroundColor: "#FDECEA",
  },
  urgentText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs, color: Colors.erreur },
  type: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
    marginTop: Spacing.sm,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: 7 },
  metaText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textSecondaire },
  description: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    lineHeight: 21,
    marginTop: Spacing.md,
  },
  section: { marginTop: Spacing.xl },
  sectionTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
    marginTop: Spacing.sm,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#E3F2FD",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  infoBoxText: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.info,
    lineHeight: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  scorePill: {
    backgroundColor: Colors.vertForetAlpha,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  scorePillText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs, color: Colors.vertForet },
  choisirBtn: {
    backgroundColor: Colors.conseil,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    minWidth: 88,
    alignItems: "center",
  },
  choisirBtnText: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.sm, color: Colors.blanc },
  suiviCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  suiviText: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textPrincipal },
});
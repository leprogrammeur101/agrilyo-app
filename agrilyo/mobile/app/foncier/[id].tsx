import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BadgeFoncier from "../../components/ui/Badge";
import { useFoncierStore } from "../../store/foncier.store";
import { STATUT_JURIDIQUE_LABELS, TYPE_ACCES_LABELS } from "../../api/foncier.api";
import { contratApi } from "../../api/contrat.api";
import { getApiErrorMessage } from "../../api/client";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../constants/theme";

// Helper — évite toUpperCase() sur undefined
function safeUpper(value: string | undefined | null): string {
  return String(value || "").toUpperCase();
}

// Helper — formate FCFA
function formatFCFA(amount: number): string {
  return amount.toLocaleString("fr-FR") + " FCFA";
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

export default function FicheAnnonceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contactLoading, setContactLoading] = useState(false);
  const { annonceSelectionnee, isLoadingDetail, chargerDetail, clearDetail } =
    useFoncierStore();

  useEffect(() => {
    if (id) chargerDetail(id);
    return () => clearDetail();
  }, [id]);

  if (isLoadingDetail || !annonceSelectionnee) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.vertForet} />
      </View>
    );
  }

  const a = annonceSelectionnee;

  // Accès sécurisés — bailleur peut être null si la relation n'est pas chargée
  const typeLabel = TYPE_ACCES_LABELS[a.type_acces] || a.type_acces || "—";
  const statutJuridiqueLabel = STATUT_JURIDIQUE_LABELS[a.statut_juridique] || a.statut_juridique || "—";
  const nomBailleur =
    a.bailleur?.display_name ||
    [a.bailleur?.first_name, a.bailleur?.last_name].filter(Boolean).join(" ") ||
    "Bailleur";
  const avatarLetter = nomBailleur.charAt(0) || "B";

  const ouvrirConversation = async () => {
    if (!id) return;
    setContactLoading(true);
    try {
      const thread = await contratApi.ouvrirThread(
        id,
        `Bonjour, je suis intéressé par votre annonce de ${a.superficie_ha} ha à ${a.region}.`
      );
      router.push({
        pathname: "/foncier/thread/[id]",
        params: { id: thread.id, titre: nomBailleur },
      } as never);
    } catch (err) {
      Alert.alert("Erreur", getApiErrorMessage(err));
    } finally {
      setContactLoading(false);
    }
  };

  const handleContacter = () => {
    Alert.alert(
      "Contacter le bailleur",
      `Voulez-vous contacter ${nomBailleur} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer un message",
          onPress: ouvrirConversation,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {typeLabel} — {a.superficie_ha} ha
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bannière */}
        <View style={styles.photoBanner}>
          <Text style={styles.photoBannerIcon}>🌾</Text>
          <View style={styles.typeOverlay}>
            <Text style={styles.typeOverlayText}>
              {safeUpper(typeLabel)}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Titre + badge */}
          <View style={styles.titreRow}>
            <Text style={styles.superficie}>{a.superficie_ha} ha</Text>
            <BadgeFoncier badge={a.badge} size="md" />
          </View>

          {/* Localisation */}
          <Text style={styles.localisation}>
            📍 {[a.village, a.sous_prefecture, a.region].filter(Boolean).join(", ") || "—"}
          </Text>

          {/* Prix */}
          <View style={styles.prixBox}>
            {a.prix_indicatif ? (
              <>
                <Text style={styles.prixMontant}>{formatFCFA(a.prix_indicatif)}</Text>
                {a.type_acces === "LOCATION" && (
                  <Text style={styles.prixUnite}>/ha/an</Text>
                )}
              </>
            ) : (
              <Text style={styles.prixNc}>Prix à négocier</Text>
            )}
          </View>

          {/* Informations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <InfoRow icon="📋" label="Type d'accès" value={typeLabel} />
            <InfoRow icon="⚖️" label="Statut juridique" value={statutJuridiqueLabel} />
            <InfoRow icon="📐" label="Superficie" value={`${a.superficie_ha} hectares`} />
            {a.culture_anterieure ? (
              <InfoRow icon="🌱" label="Culture antérieure" value={a.culture_anterieure} />
            ) : null}
            {a.equipements ? (
              <InfoRow icon="🏗️" label="Équipements" value={a.equipements} />
            ) : null}
          </View>

          {/* Description */}
          {a.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{a.description}</Text>
            </View>
          ) : null}

          {/* Bailleur */}
          {a.bailleur ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bailleur</Text>
              <View style={styles.bailleurCard}>
                <View style={styles.bailleurAvatar}>
                  <Text style={styles.bailleurAvatarText}>
                    {safeUpper(avatarLetter)}
                  </Text>
                </View>
                <View style={styles.bailleurInfo}>
                  <Text style={styles.bailleurNom}>{nomBailleur}</Text>
                  {a.bailleur.region ? (
                    <Text style={styles.bailleurRegion}>📍 {a.bailleur.region}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          {/* Note badge */}
          {a.badge_note ? (
            <View style={styles.badgeNote}>
              <Ionicons name="information-circle" size={16} color={Colors.info} />
              <Text style={styles.badgeNoteText}>{a.badge_note}</Text>
            </View>
          ) : null}

          <Text style={styles.meta}>
            {a.vues} vue{a.vues !== 1 ? "s" : ""} · Publiée le{" "}
            {new Date(a.created_at).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      </ScrollView>

      {/* Bouton contacter */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.contactBtn, contactLoading && styles.contactBtnDisabled]}
          onPress={handleContacter}
          disabled={contactLoading}
          activeOpacity={0.9}
        >
          {contactLoading ? (
            <ActivityIndicator color={Colors.blanc} />
          ) : (
            <>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.blanc} />
              <Text style={styles.contactBtnText}>Contacter le bailleur</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.cremeIvoire },
  header: {
    backgroundColor: Colors.vertForet,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.blanc },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  photoBanner: {
    height: 200, backgroundColor: Colors.vertForetAlpha,
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  photoBannerIcon: { fontSize: 64 },
  typeOverlay: {
    position: "absolute", bottom: Spacing.md, left: Spacing.md,
    backgroundColor: Colors.vertForet, paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: BorderRadius.pill,
  },
  typeOverlayText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs, color: Colors.blanc, letterSpacing: 1 },
  body: { padding: Spacing.lg },
  titreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  superficie: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xxxl, color: Colors.textPrincipal },
  localisation: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.textSecondaire, marginBottom: Spacing.md },
  prixBox: {
    flexDirection: "row", alignItems: "baseline", gap: 4,
    backgroundColor: Colors.blanc, padding: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.lg, ...Shadow.sm,
  },
  prixMontant: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, color: Colors.vertSavane },
  prixUnite: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textSecondaire },
  prixNc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.textDesactive, fontStyle: "italic" },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.textPrincipal, marginBottom: Spacing.sm },
  infoRow: {
    flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.grisMoyen,
  },
  infoIcon: { fontSize: 16, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textDesactive },
  infoValue: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.textPrincipal },
  description: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.textSecondaire, lineHeight: 22 },
  bailleurCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.blanc, padding: Spacing.md, borderRadius: BorderRadius.md, ...Shadow.sm,
  },
  bailleurAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.vertForet, alignItems: "center", justifyContent: "center",
  },
  bailleurAvatarText: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg, color: Colors.blanc },
  bailleurInfo: { flex: 1 },
  bailleurNom: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.textPrincipal },
  bailleurRegion: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textSecondaire },
  badgeNote: {
    flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm,
    backgroundColor: "#E3F2FD", padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md,
  },
  badgeNoteText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.info },
  meta: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textDesactive, textAlign: "center" },
  footer: {
    padding: Spacing.lg, paddingBottom: Spacing.xl,
    backgroundColor: Colors.blanc, borderTopWidth: 1, borderTopColor: Colors.grisMoyen,
  },
  contactBtn: {
    backgroundColor: Colors.vertForet, borderRadius: BorderRadius.md,
    paddingVertical: 16, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: Spacing.sm,
  },
  contactBtnDisabled: { opacity: 0.7 },
  contactBtnText: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.blanc },
});

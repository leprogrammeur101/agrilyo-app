/**
 * Écran Détail session de conseil — /conseil/session/[id]
 * Permet à l'agronome de démarrer / terminer la session (compte-rendu obligatoire).
 */

import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../../constants/theme";
import { CanalSessionConseil, StatutSessionConseil } from "../../../api/conseil.api";
import { useConseilStore } from "../../../store/conseil.store";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import LoadingScreen from "../../../components/ui/LoadingScreen";

const CANAL_LABELS: Record<CanalSessionConseil, string> = {
  CHAT: "Chat",
  AUDIO: "Appel audio",
  VIDEO: "Appel vidéo",
  TERRAIN: "Visite terrain",
};

const CANAL_ICONS: Record<CanalSessionConseil, keyof typeof Ionicons.glyphMap> = {
  CHAT: "chatbubble-outline",
  AUDIO: "call-outline",
  VIDEO: "videocam-outline",
  TERRAIN: "walk-outline",
};

const STATUT_LABELS: Record<StatutSessionConseil, string> = {
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

const STATUT_COLORS: Record<StatutSessionConseil, string> = {
  PLANIFIEE: Colors.info,
  EN_COURS: Colors.alerte,
  TERMINEE: Colors.succes,
  ANNULEE: Colors.textDesactive,
};

function formatDate(iso: string | null): string {
  if (!iso) return "Non planifiée";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DetailSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [compteRendu, setCompteRendu] = useState("");
  const [showTerminerForm, setShowTerminerForm] = useState(false);

  const {
    sessionSelectionnee: session,
    isLoadingSession,
    isUpdatingSession,
    chargerSession,
    demarrerSession,
    terminerSession,
  } = useConseilStore();

  useEffect(() => {
    if (id && (!session || session.id !== id)) {
      chargerSession(id);
    }
  }, [id]);

  if (isLoadingSession || !session) {
    return <LoadingScreen message="Chargement de la session..." />;
  }

  const handleDemarrer = async () => {
    await demarrerSession(session.id);
  };

  const handleTerminer = async () => {
    if (compteRendu.trim().length < 5) {
      Alert.alert("Compte-rendu requis", "Décrivez brièvement ce qui a été discuté (5 caractères min).");
      return;
    }
    await terminerSession(session.id, { compte_rendu: compteRendu.trim() });
    setShowTerminerForm(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session de conseil</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: `${STATUT_COLORS[session.statut]}1A` }]}>
            <Text style={[styles.badgeText, { color: STATUT_COLORS[session.statut] }]}>
              {STATUT_LABELS[session.statut]}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name={CANAL_ICONS[session.canal]} size={16} color={Colors.conseil} />
            <Text style={styles.metaText}>{CANAL_LABELS[session.canal]}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.conseil} />
            <Text style={styles.metaText}>Planifiée : {formatDate(session.scheduled_at)}</Text>
          </View>

          {session.started_at && (
            <View style={styles.metaRow}>
              <Ionicons name="play-outline" size={16} color={Colors.conseil} />
              <Text style={styles.metaText}>Démarrée : {formatDate(session.started_at)}</Text>
            </View>
          )}

          {session.ended_at && (
            <View style={styles.metaRow}>
              <Ionicons name="checkmark-done-outline" size={16} color={Colors.conseil} />
              <Text style={styles.metaText}>
                Terminée : {formatDate(session.ended_at)}
                {session.duree_minutes ? ` (${session.duree_minutes} min)` : ""}
              </Text>
            </View>
          )}
        </View>

        {session.compte_rendu && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compte-rendu</Text>
            <View style={styles.card}>
              <Text style={styles.compteRenduText}>{session.compte_rendu}</Text>
            </View>
          </View>
        )}

        {session.statut === "PLANIFIEE" && (
          <Button
            label="Démarrer la session"
            onPress={handleDemarrer}
            loading={isUpdatingSession}
            icon="play"
            variant="primary"
          />
        )}

        {session.statut === "EN_COURS" && !showTerminerForm && (
          <Button
            label="Terminer la session"
            onPress={() => setShowTerminerForm(true)}
            icon="checkmark-done"
            variant="primary"
          />
        )}

        {session.statut === "EN_COURS" && showTerminerForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compte-rendu de session</Text>
            <Input
              placeholder="Résumez les échanges, recommandations, points clés..."
              value={compteRendu}
              onChangeText={setCompteRendu}
              multiline
              numberOfLines={5}
              inputStyle={styles.textArea}
              textAlignVertical="top"
            />
            <Button
              label="Valider et clôturer"
              onPress={handleTerminer}
              loading={isUpdatingSession}
              icon="checkmark"
            />
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
  headerTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, color: Colors.blanc },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  card: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.sm,
  },
  badgeText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: 7 },
  metaText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textSecondaire },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },
  compteRenduText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    lineHeight: 21,
  },
  textArea: { height: 110, paddingTop: 14 },
});
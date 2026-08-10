/**
 * Écran Planning cultural + liste d'opérations — /conseil/planning/[id]
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../../constants/theme";
import { OperationPlanning, StatutOperationPlanning } from "../../../api/conseil.api";
import { useConseilStore } from "../../../store/conseil.store";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import LoadingScreen from "../../../components/ui/LoadingScreen";

const STATUT_LABELS: Record<StatutOperationPlanning, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  REPORTEE: "Reportée",
};

const STATUT_COLORS: Record<StatutOperationPlanning, string> = {
  A_FAIRE: Colors.textSecondaire,
  EN_COURS: Colors.alerte,
  TERMINEE: Colors.succes,
  REPORTEE: Colors.erreur,
};

const STATUT_ICONS: Record<StatutOperationPlanning, keyof typeof Ionicons.glyphMap> = {
  A_FAIRE: "ellipse-outline",
  EN_COURS: "time-outline",
  TERMINEE: "checkmark-circle",
  REPORTEE: "arrow-redo-circle-outline",
};

function formatDate(iso: string | null): string {
  if (!iso) return "Sans date";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function OperationRow({
  operation,
  onToggleStatut,
  onDelete,
}: {
  operation: OperationPlanning;
  onToggleStatut: () => void;
  onDelete: () => void;
}) {
  const isTerminee = operation.statut === "TERMINEE";
  return (
    <View style={styles.opRow}>
      <TouchableOpacity onPress={onToggleStatut} style={styles.opCheckbox}>
        <Ionicons
          name={STATUT_ICONS[operation.statut]}
          size={24}
          color={STATUT_COLORS[operation.statut]}
        />
      </TouchableOpacity>

      <View style={styles.opContent}>
        <Text style={[styles.opTitre, isTerminee && styles.opTitreTerminee]}>{operation.titre}</Text>
        {operation.description && <Text style={styles.opDescription}>{operation.description}</Text>}
        <View style={styles.opMetaRow}>
          <Text style={[styles.opStatutText, { color: STATUT_COLORS[operation.statut] }]}>
            {STATUT_LABELS[operation.statut]}
          </Text>
          <Text style={styles.opDate}>· {formatDate(operation.date_prevue)}</Text>
          {operation.rappel_sms && (
            <Ionicons name="notifications-outline" size={13} color={Colors.textDesactive} />
          )}
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.opDelete}>
        <Ionicons name="trash-outline" size={18} color={Colors.textDesactive} />
      </TouchableOpacity>
    </View>
  );
}

function AjouterOperationModal({
  visible,
  onClose,
  onSubmit,
  isSaving,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (titre: string, description: string, rappelSms: boolean) => void;
  isSaving: boolean;
}) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");

  const handleValider = () => {
    if (!titre.trim()) {
      Alert.alert("Titre requis", "Donnez un titre à cette opération (ex : Semis, Traitement...)");
      return;
    }
    onSubmit(titre.trim(), description.trim(), true);
    setTitre("");
    setDescription("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle opération</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.textSecondaire} />
            </TouchableOpacity>
          </View>

          <Input
            label="Titre"
            placeholder="Ex : Semis, Traitement phytosanitaire..."
            value={titre}
            onChangeText={setTitre}
          />
          <Input
            label="Description (optionnel)"
            placeholder="Précisions sur l'opération"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            inputStyle={styles.modalTextArea}
          />

          <Button label="Ajouter" onPress={handleValider} loading={isSaving} icon="add" />
        </View>
      </View>
    </Modal>
  );
}

export default function DetailPlanningScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modalVisible, setModalVisible] = useState(false);

  const {
    planningSelectionne: planning,
    isLoadingPlannings,
    isSavingOperation,
    chargerPlanning,
    ajouterOperation,
    modifierOperation,
    supprimerOperation,
  } = useConseilStore();

  useEffect(() => {
    if (id) chargerPlanning(id);
  }, [id]);

  if (isLoadingPlannings || !planning) {
    return <LoadingScreen message="Chargement du planning..." />;
  }

  const operationsTriees = [...planning.operations].sort((a, b) => a.ordre - b.ordre);
  const nombreTerminees = planning.operations.filter((op) => op.statut === "TERMINEE").length;
  const progression = planning.operations.length
    ? Math.round((nombreTerminees / planning.operations.length) * 100)
    : 0;

  const handleAjouter = async (titre: string, description: string, rappelSms: boolean) => {
    const ok = await ajouterOperation(planning.id, {
      titre,
      description: description || null,
      rappel_sms: rappelSms,
      ordre: planning.operations.length,
    });
    if (ok) setModalVisible(false);
  };

  const handleToggleStatut = (operation: OperationPlanning) => {
    const prochainStatut: StatutOperationPlanning =
      operation.statut === "TERMINEE" ? "A_FAIRE" : "TERMINEE";
    modifierOperation(operation.id, {
      statut: prochainStatut,
      date_realisee: prochainStatut === "TERMINEE" ? new Date().toISOString().slice(0, 10) : null,
    });
  };

  const handleSupprimer = (operation: OperationPlanning) => {
    Alert.alert("Supprimer cette opération ?", operation.titre, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => supprimerOperation(operation.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {planning.titre}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Ionicons name="leaf-outline" size={15} color={Colors.conseil} />
            <Text style={styles.metaText}>
              {planning.culture}
              {planning.variete ? ` · ${planning.variete}` : ""}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={15} color={Colors.conseil} />
            <Text style={styles.metaText}>{planning.region}</Text>
          </View>
          {planning.superficie_ha != null && (
            <View style={styles.metaRow}>
              <Ionicons name="resize-outline" size={15} color={Colors.conseil} />
              <Text style={styles.metaText}>{planning.superficie_ha} ha</Text>
            </View>
          )}

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progression}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {nombreTerminees}/{planning.operations.length} opérations terminées ({progression}%)
          </Text>
        </View>

        <View style={styles.opsHeader}>
          <Text style={styles.sectionTitle}>Opérations</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={18} color={Colors.blanc} />
          </TouchableOpacity>
        </View>

        {operationsTriees.length === 0 ? (
          <Text style={styles.emptyText}>Aucune opération planifiée pour l'instant.</Text>
        ) : (
          <View style={styles.card}>
            {operationsTriees.map((operation, index) => (
              <View key={operation.id}>
                <OperationRow
                  operation={operation}
                  onToggleStatut={() => handleToggleStatut(operation)}
                  onDelete={() => handleSupprimer(operation)}
                />
                {index < operationsTriees.length - 1 && <View style={styles.opDivider} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AjouterOperationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAjouter}
        isSaving={isSavingOperation}
      />
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
  metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: 4 },
  metaText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textSecondaire },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.grisLeger,
    marginTop: Spacing.md,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Colors.conseil, borderRadius: 4 },
  progressText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textSecondaire,
    marginTop: 6,
  },
  opsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },
  addBtn: {
    backgroundColor: Colors.conseil,
    borderRadius: BorderRadius.pill,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
  },
  opRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: Spacing.sm, gap: Spacing.sm },
  opCheckbox: { paddingTop: 2 },
  opContent: { flex: 1 },
  opTitre: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textPrincipal },
  opTitreTerminee: { textDecorationLine: "line-through", color: Colors.textDesactive },
  opDescription: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondaire,
    marginTop: 2,
  },
  opMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  opStatutText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs },
  opDate: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textDesactive },
  opDelete: { padding: 4 },
  opDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.grisMoyen, marginLeft: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.blanc,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, color: Colors.textPrincipal },
  modalTextArea: { height: 80, paddingTop: 12 },
});
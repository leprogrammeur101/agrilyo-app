/**
 * Écran Créer Contrat — /foncier/contrat/creer
 * Permet au bailleur d'initier un contrat avec un locataire.
 * Accessible depuis la fiche annonce (bailleur uniquement).
 */

import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { contratApi, TYPE_CONTRAT_LABELS } from "../../../api/contrat.api";
import { getApiErrorMessage } from "../../../api/client";
import { Colors } from "../../../constants/colors";
import {
  FontFamily, FontSize, Spacing, BorderRadius, Shadow,
} from "../../../constants/theme";

// ── Constantes ────────────────────────────────────────────────────────────────

type TypeContrat = "BAIL_RURAL" | "METAYAGE" | "AMODIATION" | "PROMESSE_VENTE";

const TYPES_CONTRAT: { value: TypeContrat; label: string; description: string }[] = [
  {
    value: "BAIL_RURAL",
    label: "Bail rural",
    description: "Location classique avec durée et loyer définis",
  },
  {
    value: "METAYAGE",
    label: "Métayage",
    description: "Partage de la récolte entre bailleur et exploitant",
  },
  {
    value: "AMODIATION",
    label: "Amodiation",
    description: "Location à long terme avec redevance fixe",
  },
  {
    value: "PROMESSE_VENTE",
    label: "Promesse de vente",
    description: "Engagement de céder la propriété à terme",
  },
];

// ── Composants internes ───────────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function ChampTexte({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  hint,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  hint?: string;
}) {
  return (
    <View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDesactive}
        keyboardType={keyboardType}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function TypeContratCard({
  item,
  selectionne,
  onSelect,
}: {
  item: (typeof TYPES_CONTRAT)[0];
  selectionne: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.typeCard, selectionne && styles.typeCardSelectionne]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.typeCardLeft}>
        <View style={[styles.typeRadio, selectionne && styles.typeRadioSelectionne]}>
          {selectionne && <View style={styles.typeRadioDot} />}
        </View>
      </View>
      <View style={styles.typeCardContent}>
        <Text style={[styles.typeCardLabel, selectionne && styles.typeCardLabelSelectionne]}>
          {item.label}
        </Text>
        <Text style={styles.typeCardDesc}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function CreerContratScreen() {
  const { annonce_id, locataire_id, locataire_nom } =
    useLocalSearchParams<{
      annonce_id: string;
      locataire_id: string;
      locataire_nom?: string;
    }>();

  const [typeContrat, setTypeContrat] = useState<TypeContrat>("BAIL_RURAL");
  const [montant, setMontant] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────

  const parseDate = (s: string): string | null => {
    if (!s.trim()) return null;
    const parties = s.includes("/") ? s.split("/").reverse() : s.split("-");
    if (parties.length !== 3) return null;
    const iso = parties.join("-");
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const validerFormulaire = (): boolean => {
    if (!annonce_id || !locataire_id) {
      Alert.alert("Erreur", "Données de l'annonce manquantes.");
      return false;
    }
    if (montant && isNaN(parseFloat(montant))) {
      Alert.alert("Erreur", "Le montant doit être un nombre valide.");
      return false;
    }
    if (dateDebut && !parseDate(dateDebut)) {
      Alert.alert("Erreur", "Date de début invalide. Format attendu : JJ/MM/AAAA");
      return false;
    }
    if (dateFin && !parseDate(dateFin)) {
      Alert.alert("Erreur", "Date de fin invalide. Format attendu : JJ/MM/AAAA");
      return false;
    }
    return true;
  };

  // ── Soumission ─────────────────────────────────────────────────────────────

  const handleCreer = async () => {
    if (!validerFormulaire()) return;

    Alert.alert(
      "Confirmer la création",
      `Créer un contrat de type "${TYPE_CONTRAT_LABELS[typeContrat]}" avec ${locataire_nom || "ce locataire"} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Créer",
          onPress: async () => {
            setLoading(true);
            try {
              const contrat = await contratApi.creerContrat({
                annonce_id: annonce_id!,
                locataire_id: locataire_id!,
                type_contrat: typeContrat,
                montant_fcfa: montant ? parseFloat(montant) : null,
                date_debut: dateDebut ? parseDate(dateDebut) : null,
                date_fin: dateFin ? parseDate(dateFin) : null,
              });

              Alert.alert(
                "Contrat créé ✓",
                "Le contrat a été créé. Les deux parties doivent maintenant le signer.",
                [
                  {
                    text: "Voir le contrat",
                    onPress: () => {
                      router.replace({
                        pathname: "/foncier/contrat/[id]",
                        params: { id: contrat.id },
                      } as never);
                    },
                  },
                ]
              );
            } catch (err) {
              Alert.alert("Erreur", getApiErrorMessage(err));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Créer un contrat</Text>
          <Text style={styles.headerSub}>M1 Foncier</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Locataire */}
          {locataire_nom && (
            <View style={styles.locataireCard}>
              <Ionicons name="person-circle-outline" size={28} color={Colors.vertForet} />
              <View>
                <Text style={styles.locataireLabel}>Locataire</Text>
                <Text style={styles.locataireNom}>{locataire_nom}</Text>
              </View>
            </View>
          )}

          {/* Type de contrat */}
          <View style={styles.section}>
            <Label text="Type de contrat" required />
            <View style={styles.typesGrid}>
              {TYPES_CONTRAT.map((item) => (
                <TypeContratCard
                  key={item.value}
                  item={item}
                  selectionne={typeContrat === item.value}
                  onSelect={() => setTypeContrat(item.value)}
                />
              ))}
            </View>
          </View>

          {/* Montant */}
          <View style={styles.section}>
            <Label text="Montant (FCFA)" />
            <ChampTexte
              value={montant}
              onChangeText={setMontant}
              placeholder="Ex. 250000"
              keyboardType="numeric"
              hint={
                typeContrat === "BAIL_RURAL"
                  ? "Loyer annuel en FCFA"
                  : typeContrat === "PROMESSE_VENTE"
                  ? "Prix de vente total en FCFA"
                  : "Redevance en FCFA"
              }
            />
          </View>

          {/* Dates */}
          <View style={styles.datesRow}>
            <View style={{ flex: 1 }}>
              <Label text="Date de début" />
              <ChampTexte
                value={dateDebut}
                onChangeText={setDateDebut}
                placeholder="JJ/MM/AAAA"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Date de fin" />
              <ChampTexte
                value={dateFin}
                onChangeText={setDateFin}
                placeholder="JJ/MM/AAAA"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Encart informatif */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.vertSavane} />
            <Text style={styles.infoText}>
              Après création, les deux parties devront signer le contrat par
              code OTP. Le contrat sera horodaté et archivé définitivement.
            </Text>
          </View>

          {/* Bouton */}
          <TouchableOpacity
            style={[styles.creerBtn, loading && styles.creerBtnDisabled]}
            onPress={handleCreer}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.blanc} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={20} color={Colors.blanc} />
                <Text style={styles.creerBtnText}>Créer le contrat</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 60 },

  locataireCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  locataireLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textDesactive,
  },
  locataireNom: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },

  section: { marginBottom: Spacing.lg },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    marginBottom: 8,
  },
  required: { color: Colors.erreur },

  typesGrid: { gap: Spacing.sm },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.grisMoyen,
    ...Shadow.sm,
  },
  typeCardSelectionne: {
    borderColor: Colors.vertForet,
    backgroundColor: "#F0F7F3",
  },
  typeCardLeft: { justifyContent: "center" },
  typeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.grisFonce,
    alignItems: "center",
    justifyContent: "center",
  },
  typeRadioSelectionne: { borderColor: Colors.vertForet },
  typeRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.vertForet,
  },
  typeCardContent: { flex: 1 },
  typeCardLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },
  typeCardLabelSelectionne: { color: Colors.vertForet },
  typeCardDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
    marginTop: 2,
  },

  input: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textDesactive,
    marginTop: 4,
  },

  datesRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },

  infoBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: "#EDF7EE",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.vertSavane,
    lineHeight: 20,
  },

  creerBtn: {
    backgroundColor: Colors.vertForet,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadow.md,
  },
  creerBtnDisabled: { opacity: 0.6 },
  creerBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.lg,
    color: Colors.blanc,
  },
});
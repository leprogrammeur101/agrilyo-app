/**
 * Écran Créer Annonce — /foncier/creer
 * Formulaire de création d'une annonce foncière.
 */

import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { foncierApi, TypeAcces, StatutJuridique, TYPE_ACCES_LABELS } from "../../api/foncier.api";
import { getApiErrorMessage } from "../../api/client";
import { useFoncierStore } from "../../store/foncier.store";
import { CI_REGIONS } from "../../constants/theme";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../constants/theme";

// ── Composants de formulaire ─────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}{required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function Input({
  value, onChangeText, placeholder, keyboardType = "default", multiline = false,
}: {
  value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textDesactive}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlignVertical={multiline ? "top" : "center"}
    />
  );
}

function SelectPill<T extends string>({
  options, value, onChange, label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={styles.selectGroup}>
      <Label text={label} required />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.pillRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pill, value === opt.value && styles.pillActif]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.pillText, value === opt.value && styles.pillTextActif]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Types formulaire ─────────────────────────────────────────────────────────

interface FormData {
  type_acces: TypeAcces;
  superficie_ha: string;
  prix_indicatif: string;
  region: string;
  sous_prefecture: string;
  village: string;
  statut_juridique: StatutJuridique;
  description: string;
  culture_anterieure: string;
  equipements: string;
}

const FORM_DEFAUT: FormData = {
  type_acces: "LOCATION",
  superficie_ha: "",
  prix_indicatif: "",
  region: "",
  sous_prefecture: "",
  village: "",
  statut_juridique: "INCONNU",
  description: "",
  culture_anterieure: "",
  equipements: "",
};

const TYPES_OPTIONS = Object.entries(TYPE_ACCES_LABELS).map(([v, l]) => ({
  value: v as TypeAcces, label: l,
}));

const STATUTS_OPTIONS: { value: StatutJuridique; label: string }[] = [
  { value: "INCONNU",   label: "Non précisé" },
  { value: "COUTUMIER", label: "Coutumier" },
  { value: "CF",        label: "Cert. foncier" },
  { value: "TF",        label: "Titre foncier" },
];

// ── Écran ────────────────────────────────────────────────────────────────────

export default function CreerAnnonceScreen() {
  const [form, setForm] = useState<FormData>(FORM_DEFAUT);
  const [loading, setLoading] = useState(false);
  const { chargerAnnonces } = useFoncierStore();

  const setField = (field: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const valider = (): string | null => {
    if (!form.superficie_ha || isNaN(parseFloat(form.superficie_ha))) {
      return "La superficie est obligatoire et doit être un nombre.";
    }
    if (parseFloat(form.superficie_ha) <= 0) {
      return "La superficie doit être supérieure à 0.";
    }
    if (!form.region.trim()) {
      return "La région est obligatoire.";
    }
    return null;
  };

  const handleSoumettre = async () => {
    const erreur = valider();
    if (erreur) {
      Alert.alert("Champ manquant", erreur);
      return;
    }

    setLoading(true);
    try {
      await foncierApi.creerAnnonce({
        type_acces: form.type_acces,
        superficie_ha: parseFloat(form.superficie_ha),
        prix_indicatif: form.prix_indicatif ? parseFloat(form.prix_indicatif) : null,
        region: form.region.trim(),
        sous_prefecture: form.sous_prefecture.trim() || null,
        village: form.village.trim() || null,
        statut_juridique: form.statut_juridique,
        description: form.description.trim() || null,
        culture_anterieure: form.culture_anterieure.trim() || null,
        equipements: form.equipements.trim() || null,
      });

      // Rafraîchir la liste
      await chargerAnnonces(true);

      Alert.alert(
        "Annonce soumise ✓",
        "Votre annonce est en attente de validation par notre équipe. Elle sera publiée sous 48h.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert("Erreur", getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle annonce</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type d'accès */}
          <SelectPill
            label="Type d'accès"
            options={TYPES_OPTIONS}
            value={form.type_acces}
            onChange={(v) => setForm((p) => ({ ...p, type_acces: v }))}
          />

          {/* Superficie */}
          <View style={styles.field}>
            <Label text="Superficie (ha)" required />
            <Input
              value={form.superficie_ha}
              onChangeText={setField("superficie_ha")}
              placeholder="Ex: 5.5"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Prix */}
          <View style={styles.field}>
            <Label
              text={
                form.type_acces === "VENTE"
                  ? "Prix total (FCFA)"
                  : "Prix indicatif (FCFA/ha/an)"
              }
            />
            <Input
              value={form.prix_indicatif}
              onChangeText={setField("prix_indicatif")}
              placeholder="Laisser vide si prix à négocier"
              keyboardType="number-pad"
            />
          </View>

          {/* Région */}
          <View style={styles.field}>
            <Label text="Région" required />
            <Input
              value={form.region}
              onChangeText={setField("region")}
              placeholder="Ex: Gbêkê, Abidjan, Poro..."
            />
            {/* Suggestions rapides */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.pillRow}>
                {CI_REGIONS.slice(0, 8).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={styles.suggestion}
                    onPress={() => setField("region")(r)}
                  >
                    <Text style={styles.suggestionText}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Sous-préfecture */}
          <View style={styles.field}>
            <Label text="Sous-préfecture / Commune" />
            <Input
              value={form.sous_prefecture}
              onChangeText={setField("sous_prefecture")}
              placeholder="Ex: Bouaké, Korhogo..."
            />
          </View>

          {/* Village */}
          <View style={styles.field}>
            <Label text="Village (optionnel)" />
            <Input
              value={form.village}
              onChangeText={setField("village")}
              placeholder="Nom du village"
            />
          </View>

          {/* Statut juridique */}
          <SelectPill
            label="Statut juridique"
            options={STATUTS_OPTIONS}
            value={form.statut_juridique}
            onChange={(v) => setForm((p) => ({ ...p, statut_juridique: v }))}
          />

          {/* Culture antérieure */}
          <View style={styles.field}>
            <Label text="Culture antérieure" />
            <Input
              value={form.culture_anterieure}
              onChangeText={setField("culture_anterieure")}
              placeholder="Ex: Maïs, Cacao, Maraîchage..."
            />
          </View>

          {/* Équipements */}
          <View style={styles.field}>
            <Label text="Équipements disponibles" />
            <Input
              value={form.equipements}
              onChangeText={setField("equipements")}
              placeholder="Ex: Puits, Hangar, Clôture..."
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Label text="Description" />
            <Input
              value={form.description}
              onChangeText={setField("description")}
              placeholder="Décrivez la parcelle, le sol, l'accès..."
              multiline
            />
          </View>

          {/* Note info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
            <Text style={styles.infoBoxText}>
              Votre annonce sera visible après validation par notre équipe (sous 48h).
              Un badge sécurité sera attribué après vérification de vos documents.
            </Text>
          </View>
        </ScrollView>

        {/* Bouton soumettre */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSoumettre}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={Colors.blanc} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.blanc} />
                <Text style={styles.submitBtnText}>Soumettre l'annonce</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },
  header: {
    backgroundColor: Colors.vertForet,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, color: Colors.blanc },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
  field: { marginBottom: Spacing.md },
  selectGroup: { marginBottom: Spacing.md },
  label: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textPrincipal, marginBottom: 6 },
  required: { color: Colors.erreur },
  input: {
    backgroundColor: Colors.blanc, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.grisMoyen,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, color: Colors.textPrincipal,
  },
  inputMultiline: { height: 100, paddingTop: 12 },
  pillRow: { flexDirection: "row", gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.blanc, borderWidth: 1.5, borderColor: Colors.grisMoyen,
  },
  pillActif: { backgroundColor: Colors.vertForet, borderColor: Colors.vertForet },
  pillText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textSecondaire },
  pillTextActif: { color: Colors.blanc },
  suggestion: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    backgroundColor: Colors.vertForetAlpha, borderRadius: BorderRadius.sm,
  },
  suggestionText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.vertForet },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm,
    backgroundColor: "#E3F2FD", padding: Spacing.md, borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  infoBoxText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.info, lineHeight: 20 },
  footer: {
    padding: Spacing.lg, paddingBottom: Spacing.xl,
    backgroundColor: Colors.blanc, borderTopWidth: 1, borderTopColor: Colors.grisMoyen,
  },
  submitBtn: {
    backgroundColor: Colors.vertForet, borderRadius: BorderRadius.md,
    paddingVertical: 16, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.blanc },
});
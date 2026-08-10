/**
 * Écran Nouvelle demande de conseil — /conseil/demande/creer
 */

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, CI_REGIONS } from "../../../constants/theme";
import { TYPE_CONSEIL_LABELS, TypeConseil } from "../../../api/conseil.api";
import { useConseilStore } from "../../../store/conseil.store";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function SelectPill<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={styles.field}>
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

const TYPE_OPTIONS = Object.entries(TYPE_CONSEIL_LABELS).map(([value, label]) => ({
  value: value as TypeConseil,
  label,
}));

interface FormState {
  type_conseil: TypeConseil;
  culture: string;
  variete: string;
  region: string;
  ville: string;
  titre: string;
  description: string;
  urgence: boolean;
}

const FORM_DEFAUT: FormState = {
  type_conseil: "DIAGNOSTIC",
  culture: "",
  variete: "",
  region: "",
  ville: "",
  titre: "",
  description: "",
  urgence: false,
};

export default function CreerDemandeConseilScreen() {
  const [form, setForm] = useState<FormState>(FORM_DEFAUT);
  const { creerDemande, isSubmittingDemande } = useConseilStore();

  const setField = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const valider = (): string | null => {
    if (!form.culture.trim()) return "La culture concernée est obligatoire.";
    if (!form.region.trim()) return "La région est obligatoire.";
    if (!form.titre.trim()) return "Le titre de la demande est obligatoire.";
    if (!form.description.trim() || form.description.trim().length < 10) {
      return "Décrivez votre besoin en quelques mots (10 caractères minimum).";
    }
    return null;
  };

  const handleSoumettre = async () => {
    const erreur = valider();
    if (erreur) {
      Alert.alert("Champ manquant", erreur);
      return;
    }

    const demande = await creerDemande({
      type_conseil: form.type_conseil,
      culture: form.culture.trim(),
      variete: form.variete.trim() || null,
      region: form.region.trim(),
      ville: form.ville.trim() || null,
      titre: form.titre.trim(),
      description: form.description.trim(),
      urgence: form.urgence,
    });

    if (demande) {
      router.replace({ pathname: "/conseil/demande/[id]", params: { id: demande.id } });
    } else {
      Alert.alert("Erreur", "Impossible d'envoyer votre demande. Réessayez.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demander un conseil</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SelectPill
          label="Type de conseil"
          options={TYPE_OPTIONS}
          value={form.type_conseil}
          onChange={(v) => setForm((p) => ({ ...p, type_conseil: v }))}
        />

        <Input
          label="Culture concernée"
          icon="leaf-outline"
          placeholder="Ex : Cacao, Hévéa, Anacarde..."
          value={form.culture}
          onChangeText={setField("culture")}
        />

        <Input
          label="Variété (optionnel)"
          placeholder="Ex : Mercedes, PA150..."
          value={form.variete}
          onChangeText={setField("variete")}
        />

        <View style={styles.field}>
          <Label text="Région" required />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pillRow}>
              {CI_REGIONS.map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[styles.pill, form.region === region && styles.pillActif]}
                  onPress={() => setForm((p) => ({ ...p, region }))}
                >
                  <Text
                    style={[
                      styles.pillText,
                      form.region === region && styles.pillTextActif,
                    ]}
                  >
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <Input
          label="Ville / localité (optionnel)"
          icon="location-outline"
          placeholder="Ex : Soubré"
          value={form.ville}
          onChangeText={setField("ville")}
        />

        <Input
          label="Titre de la demande"
          placeholder="Ex : Taches brunes sur les feuilles"
          value={form.titre}
          onChangeText={setField("titre")}
        />

        <Input
          label="Description"
          placeholder="Décrivez ce que vous observez, depuis quand, sur quelle surface..."
          value={form.description}
          onChangeText={setField("description")}
          multiline
          numberOfLines={5}
          inputStyle={styles.textArea}
          textAlignVertical="top"
        />

        <View style={styles.urgenceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.urgenceLabel}>Demande urgente</Text>
            <Text style={styles.urgenceHint}>
              Signalez une urgence phytosanitaire pour une prise en charge prioritaire.
            </Text>
          </View>
          <Switch
            value={form.urgence}
            onValueChange={(v) => setForm((p) => ({ ...p, urgence: v }))}
            trackColor={{ false: Colors.grisMoyen, true: Colors.conseil }}
            thumbColor={Colors.blanc}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Envoyer ma demande"
          onPress={handleSoumettre}
          loading={isSubmittingDemande}
          icon="send"
        />
      </View>
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
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.lg,
    color: Colors.blanc,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
  field: { marginBottom: Spacing.md },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    marginBottom: 6,
  },
  required: { color: Colors.erreur },
  pillRow: { flexDirection: "row", gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.blanc,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
  },
  pillActif: { backgroundColor: Colors.conseil, borderColor: Colors.conseil },
  pillText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
  },
  pillTextActif: { color: Colors.blanc },
  textArea: { height: 110, paddingTop: 14 },
  urgenceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    padding: Spacing.md,
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  urgenceLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    marginBottom: 2,
  },
  urgenceHint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondaire,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.blanc,
    borderTopWidth: 1,
    borderTopColor: Colors.grisMoyen,
  },
});
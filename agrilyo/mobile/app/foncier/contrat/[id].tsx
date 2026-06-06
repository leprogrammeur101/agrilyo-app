/**
 * Écran Contrat — /foncier/contrat/[id]
 * Détail du contrat + signature OTP + horodatage SHA-256
 */

import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  contratApi, ContratDetail, TYPE_CONTRAT_LABELS,
} from "../../../api/contrat.api";
import { getApiErrorMessage } from "../../../api/client";
import { useAuthStore } from "../../../store/auth.store";
import { Colors } from "../../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../../constants/theme";

function formatFCFA(v: number) {
  return v.toLocaleString("fr-FR") + " FCFA";
}

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    BROUILLON: { bg: "#F5F5F5", color: "#757575", label: "Brouillon" },
    SIGNE:     { bg: "#E8F5E9", color: "#2E7D32", label: "Signé ✓" },
    EXPIRE:    { bg: "#FFF3E0", color: "#E65100", label: "Expiré" },
    RESILIE:   { bg: "#FFEBEE", color: "#C62828", label: "Résilié" },
  };
  const c = config[statut] || config["BROUILLON"];
  return (
    <View style={[styles.statutBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.statutBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export default function ContratScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [contrat, setContrat] = useState<ContratDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpEnvoye, setOtpEnvoye] = useState(false);
  const [codeOtp, setCodeOtp] = useState("");
  const [debugCode, setDebugCode] = useState<string | undefined>();
  const [signing, setSigning] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    chargerContrat();
  }, [id]);

  const chargerContrat = async () => {
    if (!id) return;
    try {
      const data = await contratApi.getContrat(id);
      setContrat(data);
    } catch (err) {
      Alert.alert("Erreur", getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemanderOTP = async () => {
    if (!id) return;
    setSendingOtp(true);
    try {
      const res = await contratApi.demanderOTP(id);
      setOtpEnvoye(true);
      if (res.debug_code) setDebugCode(res.debug_code);
      Alert.alert("Code envoyé", "Un code OTP a été envoyé par SMS.");
    } catch (err) {
      Alert.alert("Erreur", getApiErrorMessage(err));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSigner = async () => {
    if (!id || codeOtp.length !== 6) return;
    setSigning(true);
    try {
      const res = await contratApi.signer(id, codeOtp);
      setContrat(res.contrat);
      setOtpEnvoye(false);
      setCodeOtp("");
      Alert.alert(
        res.est_completement_signe ? "Contrat signé ✓" : "Signature enregistrée",
        res.message
      );
    } catch (err) {
      Alert.alert("Erreur de signature", getApiErrorMessage(err));
    } finally {
      setSigning(false);
    }
  };

  if (loading || !contrat) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.vertForet} />
      </View>
    );
  }

  const estBailleur = user?.id === contrat.bailleur_id;
  const aDejaSigné = estBailleur ? contrat.signe_bailleur : contrat.signe_locataire;
  const peutSigner = contrat.statut !== "SIGNE" && !aDejaSigné;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contrat</Text>
        <StatutBadge statut={contrat.statut} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type de contrat */}
        <View style={styles.section}>
          <Text style={styles.typeContrat}>
            {TYPE_CONTRAT_LABELS[contrat.type_contrat] || contrat.type_contrat}
          </Text>
          {contrat.montant_fcfa && (
            <Text style={styles.montant}>{formatFCFA(contrat.montant_fcfa)}</Text>
          )}
        </View>

        {/* Détails */}
        <View style={styles.card}>
          {contrat.date_debut && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date de début</Text>
              <Text style={styles.rowValue}>
                {new Date(contrat.date_debut).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          )}
          {contrat.date_fin && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date de fin</Text>
              <Text style={styles.rowValue}>
                {new Date(contrat.date_fin).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Créé le</Text>
            <Text style={styles.rowValue}>
              {new Date(contrat.created_at).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          <View style={styles.signaturesGrid}>
            <View style={styles.signatureItem}>
              <Ionicons
                name={contrat.signe_bailleur ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={contrat.signe_bailleur ? Colors.succes : Colors.grisFonce}
              />
              <Text style={styles.signatureLabel}>Bailleur</Text>
              <Text style={[
                styles.signatureStatut,
                { color: contrat.signe_bailleur ? Colors.succes : Colors.grisFonce }
              ]}>
                {contrat.signe_bailleur ? "Signé" : "En attente"}
              </Text>
            </View>
            <View style={styles.signatureItem}>
              <Ionicons
                name={contrat.signe_locataire ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={contrat.signe_locataire ? Colors.succes : Colors.grisFonce}
              />
              <Text style={styles.signatureLabel}>Locataire</Text>
              <Text style={[
                styles.signatureStatut,
                { color: contrat.signe_locataire ? Colors.succes : Colors.grisFonce }
              ]}>
                {contrat.signe_locataire ? "Signé" : "En attente"}
              </Text>
            </View>
          </View>
        </View>

        {/* Horodatage SHA-256 */}
        {contrat.statut === "SIGNE" && contrat.hash_sha256 && (
          <View style={styles.hashBox}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.succes} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hashTitle}>Contrat horodaté et certifié</Text>
              {contrat.horodatage && (
                <Text style={styles.hashDate}>
                  {new Date(contrat.horodatage).toLocaleString("fr-FR")}
                </Text>
              )}
              <Text style={styles.hashValue} numberOfLines={2}>
                SHA-256 : {contrat.hash_sha256}
              </Text>
            </View>
          </View>
        )}

        {/* Signature OTP */}
        {peutSigner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Signer le contrat</Text>

            {!otpEnvoye ? (
              <TouchableOpacity
                style={styles.otpBtn}
                onPress={handleDemanderOTP}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <ActivityIndicator color={Colors.blanc} />
                ) : (
                  <>
                    <Ionicons name="phone-portrait-outline" size={20} color={Colors.blanc} />
                    <Text style={styles.otpBtnText}>Recevoir le code de signature</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.otpInfo}>
                  Entrez le code reçu par SMS{debugCode ? ` (dev: ${debugCode})` : ""} :
                </Text>
                <TextInput
                  style={styles.otpInput}
                  value={codeOtp}
                  onChangeText={(v) => setCodeOtp(v.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="123456"
                  placeholderTextColor={Colors.textDesactive}
                />
                <TouchableOpacity
                  style={[styles.signerBtn, (codeOtp.length !== 6 || signing) && styles.signerBtnDisabled]}
                  onPress={handleSigner}
                  disabled={codeOtp.length !== 6 || signing}
                >
                  {signing ? (
                    <ActivityIndicator color={Colors.blanc} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={Colors.blanc} />
                      <Text style={styles.signerBtnText}>Confirmer la signature</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOtpEnvoye(false)} style={styles.annulerBtn}>
                  <Text style={styles.annulerBtnText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.cremeIvoire },
  header: {
    backgroundColor: Colors.vertForet, flexDirection: "row",
    alignItems: "center", paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, color: Colors.blanc },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill },
  statutBadgeText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 60 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.textPrincipal, marginBottom: Spacing.sm },
  typeContrat: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xxl, color: Colors.vertForet },
  montant: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.lg, color: Colors.textSecondaire, marginTop: 4 },
  card: { backgroundColor: Colors.blanc, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg, ...Shadow.sm },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.grisMoyen },
  rowLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textDesactive },
  rowValue: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textPrincipal },
  signaturesGrid: { flexDirection: "row", gap: Spacing.md },
  signatureItem: {
    flex: 1, backgroundColor: Colors.blanc, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: "center", gap: 6, ...Shadow.sm,
  },
  signatureLabel: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textPrincipal },
  signatureStatut: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  hashBox: {
    flexDirection: "row", gap: Spacing.sm, backgroundColor: "#E8F5E9",
    padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg,
  },
  hashTitle: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm, color: Colors.succes },
  hashDate: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textSecondaire, marginTop: 2 },
  hashValue: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.textDesactive, marginTop: 4 },
  otpBtn: {
    backgroundColor: Colors.vertForet, borderRadius: BorderRadius.md,
    paddingVertical: 16, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: Spacing.sm,
  },
  otpBtnText: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.blanc },
  otpInfo: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textSecondaire, marginBottom: Spacing.sm },
  otpInput: {
    backgroundColor: Colors.blanc, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.vertForet,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontFamily: FontFamily.headingBold, fontSize: FontSize.xxl,
    color: Colors.vertForet, letterSpacing: 8, textAlign: "center",
    marginBottom: Spacing.md,
  },
  signerBtn: {
    backgroundColor: Colors.succes, borderRadius: BorderRadius.md,
    paddingVertical: 16, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: Spacing.sm,
  },
  signerBtnDisabled: { opacity: 0.5 },
  signerBtnText: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.blanc },
  annulerBtn: { alignItems: "center", marginTop: Spacing.md },
  annulerBtnText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textDesactive },
});
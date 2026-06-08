/**
 * Écran Thread — /foncier/thread/[id]
 * Messagerie entre agriculteur et bailleur.
 * Le bailleur voit un bouton "Créer un contrat" pour formaliser l'accord.
 */

import { useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { contratApi, MessageItem, ThreadDetail } from "../../../api/contrat.api";
import { getApiErrorMessage } from "../../../api/client";
import { useAuthStore } from "../../../store/auth.store";
import { Colors } from "../../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius } from "../../../constants/theme";

export default function ThreadScreen() {
  const { id, titre } = useLocalSearchParams<{ id: string; titre?: string }>();
  const { user } = useAuthStore();

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [texte, setTexte] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    chargerMessages();
  }, [id]);

  const chargerMessages = async () => {
    if (!id) return;
    try {
      const threadDetail = await contratApi.getThread(id);
      setThread(threadDetail);
      setMessages(threadDetail.messages);
    } catch (err) {
      console.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEnvoyer = async () => {
    if (!texte.trim() || !id) return;
    const contenu = texte.trim();
    setTexte("");
    setSending(true);
    try {
      await contratApi.envoyerMessage(id, contenu);
      await chargerMessages();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  // ── Bailleur : créer un contrat avec le demandeur ─────────────────────────

  const estBailleur = user?.id === thread?.bailleur_id;

  const handleCreerContrat = () => {
    if (!thread) return;
    Alert.alert(
      "Créer un contrat",
      "Vous allez formaliser un contrat avec ce locataire. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          onPress: () =>
            router.push({
              pathname: "/foncier/contrat/creer",
              params: {
                annonce_id: thread.annonce_id,
                locataire_id: thread.demandeur_id,
                locataire_nom: titre || "Locataire",
              },
            } as never),
        },
      ]
    );
  };

  // ── Rendu message ─────────────────────────────────────────────────────────

  const renderMessage = ({ item }: { item: MessageItem }) => (
    <View style={[styles.messageRow, item.est_moi && styles.messageRowMoi]}>
      {!item.est_moi && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.auteur_nom || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={[styles.bulle, item.est_moi && styles.bulleMoi]}>
        {!item.est_moi && (
          <Text style={styles.auteurNom}>{item.auteur_nom || "Inconnu"}</Text>
        )}
        <Text style={[styles.contenu, item.est_moi && styles.contenuMoi]}>
          {item.contenu}
        </Text>
        <Text style={[styles.heure, item.est_moi && styles.heureMoi]}>
          {new Date(item.created_at).toLocaleTimeString("fr-FR", {
            hour: "2-digit", minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );

  // ── Rendu principal ───────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {titre || "Conversation"}
          </Text>
          <Text style={styles.headerSub}>M1 Foncier — Messagerie</Text>
        </View>
        {/* Bouton contrat — visible uniquement pour le bailleur */}
        {estBailleur && (
          <TouchableOpacity
            style={styles.contratBtn}
            onPress={handleCreerContrat}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text-outline" size={16} color={Colors.orProfond} />
            <Text style={styles.contratBtnText}>Contrat</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.vertForet} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listeMessages}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={() => (
              <View style={styles.vide}>
                <Text style={styles.videTexte}>
                  Aucun message. Commencez la conversation.
                </Text>
              </View>
            )}
          />
        )}

        {/* Bannière bailleur */}
        {estBailleur && messages.length > 0 && (
          <View style={styles.banniereBailleur}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.orProfond} />
            <Text style={styles.banniereBailleurText}>
              Accord trouvé ? Formalisez-le avec un contrat sécurisé.
            </Text>
            <TouchableOpacity onPress={handleCreerContrat}>
              <Text style={styles.banniereBailleurLien}>Créer →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Saisie */}
        <View style={styles.saisieBar}>
          <TextInput
            style={styles.saisieInput}
            value={texte}
            onChangeText={setTexte}
            placeholder="Votre message..."
            placeholderTextColor={Colors.textDesactive}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!texte.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleEnvoyer}
            disabled={!texte.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.blanc} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.blanc} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.vertForet },

  header: {
    backgroundColor: Colors.vertForet,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerTitle: {
    fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, color: Colors.blanc,
  },
  headerSub: {
    fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.orClair,
  },
  contratBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(200,151,42,0.15)",
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1, borderColor: Colors.orProfond,
  },
  contratBtnText: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs, color: Colors.orProfond,
  },

  loading: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: Colors.cremeIvoire,
  },

  listeMessages: {
    padding: Spacing.md, paddingBottom: Spacing.lg,
    backgroundColor: Colors.cremeIvoire, flexGrow: 1,
  },

  messageRow: {
    flexDirection: "row", alignItems: "flex-end",
    marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  messageRowMoi: { flexDirection: "row-reverse" },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.vertSavane,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.sm, color: Colors.blanc,
  },
  bulle: {
    maxWidth: "72%", backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.lg, borderBottomLeftRadius: 4,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
    elevation: 1,
  },
  bulleMoi: {
    backgroundColor: Colors.vertForet,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
  },
  auteurNom: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs,
    color: Colors.vertSavane, marginBottom: 2,
  },
  contenu: {
    fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md,
    color: Colors.textPrincipal, lineHeight: 20,
  },
  contenuMoi: { color: Colors.blanc },
  heure: {
    fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs,
    color: Colors.textDesactive, marginTop: 4, textAlign: "right",
  },
  heureMoi: { color: "rgba(255,255,255,0.6)" },

  vide: { flex: 1, alignItems: "center", paddingTop: 60 },
  videTexte: {
    fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md,
    color: Colors.textDesactive, textAlign: "center",
  },

  banniereBailleur: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: "rgba(200,151,42,0.08)",
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: "rgba(200,151,42,0.2)",
  },
  banniereBailleurText: {
    flex: 1, fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs, color: Colors.orProfond,
  },
  banniereBailleurLien: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs, color: Colors.orProfond,
  },

  saisieBar: {
    flexDirection: "row", alignItems: "flex-end",
    padding: Spacing.md, gap: Spacing.sm,
    backgroundColor: Colors.blanc,
    borderTopWidth: 1, borderTopColor: Colors.grisMoyen,
  },
  saisieInput: {
    flex: 1, backgroundColor: Colors.grisLeger,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: 10, maxHeight: 100,
    fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.vertForet,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
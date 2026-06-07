/**
 * Ecran Conversations — /foncier/conversations
 * Liste des threads fonciers de l'utilisateur connecte.
 */

import { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { contratApi, ThreadResume } from "../../api/contrat.api";
import { getApiErrorMessage } from "../../api/client";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../constants/theme";

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function ConversationsScreen() {
  const [threads, setThreads] = useState<ThreadResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chargerThreads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await contratApi.mesThreads();
      setThreads(data);
    } catch (err) {
      Alert.alert("Erreur", getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    chargerThreads();
  }, [chargerThreads]);

  const rafraichir = () => {
    setRefreshing(true);
    chargerThreads(true);
  };

  const ouvrirThread = (thread: ThreadResume) => {
    const titre = thread.annonce_region
      ? `${thread.annonce_region} • ${thread.annonce_superficie ?? "-"} ha`
      : "Conversation";
    router.push({
      pathname: "/foncier/thread/[id]",
      params: { id: thread.id, titre },
    } as never);
  };

  const renderThread = ({ item }: { item: ThreadResume }) => (
    <TouchableOpacity
      style={styles.threadCard}
      onPress={() => ouvrirThread(item)}
      activeOpacity={0.85}
    >
      <View style={styles.threadIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.vertForet} />
      </View>
      <View style={styles.threadInfo}>
        <View style={styles.threadTop}>
          <Text style={styles.threadTitle} numberOfLines={1}>
            {item.annonce_region || "Annonce fonciere"}
          </Text>
          <Text style={styles.threadDate}>{formatDate(item.updated_at)}</Text>
        </View>
        <Text style={styles.threadMeta}>
          {item.annonce_superficie ? `${item.annonce_superficie} ha` : "Superficie non precisee"}
        </Text>
        <Text style={styles.threadMessage} numberOfLines={2}>
          {item.dernier_message || "Aucun message pour le moment."}
        </Text>
      </View>
      {item.messages_non_lus > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.messages_non_lus}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.textDesactive} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Conversations</Text>
          <Text style={styles.headerSub}>M1 Foncier</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.vertForet} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={rafraichir}
              tintColor={Colors.vertForet}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={52} color={Colors.vertSavane} />
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptyText}>
                Les echanges avec les bailleurs apparaitront ici.
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

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
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, color: Colors.blanc },
  headerSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.orClair },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: Spacing.md, paddingBottom: Spacing.xl, flexGrow: 1 },
  threadCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  threadIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.vertForetAlpha,
    alignItems: "center",
    justifyContent: "center",
  },
  threadInfo: { flex: 1 },
  threadTop: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  threadTitle: { flex: 1, fontFamily: FontFamily.bodyBold, fontSize: FontSize.md, color: Colors.textPrincipal },
  threadDate: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, color: Colors.textDesactive },
  threadMeta: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.vertSavane, marginTop: 2 },
  threadMessage: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: Colors.textSecondaire, marginTop: 4 },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.orProfond,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  unreadText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.xs, color: Colors.blanc },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.xl },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, color: Colors.textPrincipal, marginTop: Spacing.md },
  emptyText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textSecondaire,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});

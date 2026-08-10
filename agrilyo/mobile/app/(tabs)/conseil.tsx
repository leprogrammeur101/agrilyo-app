/**
 * Ecran Conseil - M3 agronomes & demandes.
 */

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AgronomeCard from "../../components/common/AgronomeCard";
import { useConseilStore } from "../../store/conseil.store";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Shadow, Spacing } from "../../constants/theme";

export default function ConseilScreen() {
  const {
    agronomes,
    totalAgronomes,
    isLoadingAgronomes,
    isRefreshingAgronomes,
    error,
    chargerAgronomes,
    rafraichirAgronomes,
    chargerAgronomesSuivants,
    setFiltresAgronomes,
    resetFiltresAgronomes,
  } = useConseilStore();

  const [culture, setCulture] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    chargerAgronomes(true);
  }, []);

  const appliquerFiltres = () => {
    setFiltresAgronomes({
      culture: culture.trim() || undefined,
      region: region.trim() || undefined,
    });
  };

  const nettoyerFiltres = () => {
    setCulture("");
    setRegion("");
    resetFiltresAgronomes();
  };

  const ListHeader = () => (
    <View>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.86}
          onPress={() => router.push("/conseil/demande/creer")}
        >
          <Ionicons name="chatbubbles-outline" size={18} color={Colors.blanc} />
          <Text style={styles.primaryButtonText}>Demander conseil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.86}>
          <Ionicons name="calendar-outline" size={18} color={Colors.vertSavane} />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <View style={styles.inputWrap}>
          <Ionicons name="leaf-outline" size={18} color={Colors.textDesactive} />
          <TextInput
            style={styles.input}
            placeholder="Culture"
            placeholderTextColor={Colors.textDesactive}
            value={culture}
            onChangeText={setCulture}
            returnKeyType="search"
            onSubmitEditing={appliquerFiltres}
          />
        </View>
        <View style={styles.inputWrap}>
          <Ionicons name="location-outline" size={18} color={Colors.textDesactive} />
          <TextInput
            style={styles.input}
            placeholder="Region"
            placeholderTextColor={Colors.textDesactive}
            value={region}
            onChangeText={setRegion}
            returnKeyType="search"
            onSubmitEditing={appliquerFiltres}
          />
        </View>
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.filterButton} onPress={appliquerFiltres}>
            <Ionicons name="search" size={18} color={Colors.blanc} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={nettoyerFiltres}>
            <Ionicons name="close" size={18} color={Colors.vertSavane} />
          </TouchableOpacity>
        </View>
      </View>

      {!isLoadingAgronomes ? (
        <Text style={styles.counter}>
          {totalAgronomes} agronome{totalAgronomes !== 1 ? "s" : ""} disponible
          {totalAgronomes !== 1 ? "s" : ""}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Conseil</Text>
          <Text style={styles.headerSub}>Agronomes verifies</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="school-outline" size={23} color={Colors.vertSavane} />
        </View>
      </View>

      <FlatList
        data={agronomes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AgronomeCard
            agronome={item}
            onPress={() =>
              router.push({ pathname: "/conseil/agronome/[id]", params: { id: item.id } })
            }
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() =>
          isLoadingAgronomes ? null : (
            <View style={styles.empty}>
              <Ionicons name="person-circle-outline" size={56} color={Colors.vertSavane} />
              <Text style={styles.emptyTitle}>Aucun agronome</Text>
              <Text style={styles.emptySubtitle}>
                {error || "Essayez une autre culture ou region."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={() =>
          isLoadingAgronomes && agronomes.length > 0 ? (
            <ActivityIndicator color={Colors.vertSavane} style={styles.footerLoader} />
          ) : null
        }
        onRefresh={rafraichirAgronomes}
        refreshing={isRefreshingAgronomes}
        onEndReached={chargerAgronomesSuivants}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: Colors.vertSavane,
    flex: 1,
  },
  header: {
    alignItems: "flex-end",
    backgroundColor: Colors.vertSavane,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  headerTitle: {
    color: Colors.blanc,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
  },
  headerSub: {
    color: "#DFF3E7",
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  list: {
    backgroundColor: Colors.cremeIvoire,
    flexGrow: 1,
    padding: Spacing.md,
    paddingBottom: 96,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.vertSavane,
    borderRadius: BorderRadius.md,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.blanc,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    width: 48,
    ...Shadow.sm,
  },
  filters: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    ...Shadow.sm,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: Colors.grisLeger,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 42,
    paddingHorizontal: Spacing.sm,
  },
  input: {
    color: Colors.textPrincipal,
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
  },
  filterActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: Colors.vertSavane,
    borderRadius: BorderRadius.sm,
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: Colors.vertForetAlpha,
    borderRadius: BorderRadius.sm,
    height: 40,
    justifyContent: "center",
    width: 48,
  },
  counter: {
    color: Colors.textDesactive,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
  },
  emptyTitle: {
    color: Colors.textPrincipal,
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textSecondaire,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  footerLoader: {
    marginVertical: Spacing.lg,
  },
});
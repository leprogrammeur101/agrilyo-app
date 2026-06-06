/**
 * Écran Accueil — AGRILYO Dashboard
 * Point d'entrée principal après authentification.
 */

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, Shadow } from "../../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

interface ModuleCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  route: string;
  tag: string;
}

const MODULES: ModuleCard[] = [
  {
    id: "foncier",
    title: "Foncier",
    subtitle: "Trouver ou proposer une terre agricole sécurisée",
    icon: "map",
    color: Colors.vertForet,
    route: "/(tabs)/foncier",
    tag: "M1",
  },
  {
    id: "semences",
    title: "Semences",
    subtitle: "Commander des semences certifiées et plants de qualité",
    icon: "leaf",
    color: Colors.orProfond,
    route: "/(tabs)/semences",
    tag: "M2",
  },
  {
    id: "conseil",
    title: "Conseil",
    subtitle: "Être accompagné par un agronome de bout en bout",
    icon: "people",
    color: Colors.vertSavane,
    route: "/(tabs)/conseil",
    tag: "M3",
  },
];

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Bonjour{user?.first_name ? `, ${user.first_name}` : ""} 👋
            </Text>
            <Text style={styles.headerSub}>Que cherchez-vous aujourd'hui ?</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => {}}>
            <Ionicons name="person-circle-outline" size={36} color={Colors.blanc} />
          </TouchableOpacity>
        </View>

        {/* Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos services</Text>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={styles.moduleCard}
              onPress={() => router.push(mod.route as never)}
              activeOpacity={0.88}
            >
              <View style={[styles.moduleIcon, { backgroundColor: mod.color }]}>
                <Ionicons name={mod.icon} size={28} color={Colors.blanc} />
              </View>
              <View style={styles.moduleContent}>
                <View style={styles.moduleTitleRow}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <View style={styles.moduleTag}>
                    <Text style={styles.moduleTagText}>{mod.tag}</Text>
                  </View>
                </View>
                <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.grisFonce} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bannière label Ivoire Semences */}
        <TouchableOpacity style={styles.banner} activeOpacity={0.9}>
          <View>
            <Text style={styles.bannerTitle}>🌾 Label Ivoire Semences</Text>
            <Text style={styles.bannerSub}>
              Découvrez les fournisseurs certifiés AGRILYO
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color={Colors.orClair} />
        </TouchableOpacity>

        {/* Bouton déconnexion (temporaire, à déplacer dans le profil) */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.erreur} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.vertForet,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.cremeIvoire,
  },
  header: {
    backgroundColor: Colors.vertForet,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    color: Colors.blanc,
  },
  headerSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.orClair,
    marginTop: 4,
  },
  avatarBtn: {
    padding: 4,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrincipal,
    marginBottom: Spacing.md,
  },
  moduleCard: {
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  moduleIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 3,
  },
  moduleTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },
  moduleTag: {
    backgroundColor: Colors.vertForetAlpha,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moduleTagText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.vertForet,
  },
  moduleSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
    lineHeight: 18,
  },
  banner: {
    backgroundColor: Colors.vertForet,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  bannerTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.blanc,
    marginBottom: 4,
  },
  bannerSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.orClair,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  logoutText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.erreur,
  },
});
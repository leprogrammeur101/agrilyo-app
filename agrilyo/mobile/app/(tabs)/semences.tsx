import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize } from "../../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SemencesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.orProfond }}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🌾</Text>
        <Text style={styles.title}>Module Semences</Text>
        <Text style={styles.subtitle}>Sprint 4 & 5 — En cours de développement</Text>
        <Text style={styles.desc}>
          Catalogue semences certifiées, label Ivoire Semences, commandes mobile money, canal USSD.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cremeIvoire,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
    color: Colors.orProfond,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.vertSavane,
    marginBottom: 16,
  },
  desc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textSecondaire,
    textAlign: "center",
    lineHeight: 22,
  },
});
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize } from "../../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConseilScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.vertSavane }}>
      <View style={styles.container}>
        <Text style={styles.emoji}>👨‍🌾</Text>
        <Text style={styles.title}>Module Conseil</Text>
        <Text style={styles.subtitle}>Sprint 6 & 7 — En cours de développement</Text>
        <Text style={styles.desc}>
          Matching agronomes, téléconseil audio/vidéo, planning cultural, rappels automatiques.
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
    color: Colors.vertSavane,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.vertForet,
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
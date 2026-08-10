/**
 * Écran Onboarding — AGRILYO
 * Premier écran vu par un utilisateur non authentifié (avant Login).
 * Affiché une seule fois (flag SecureStore), présente les 3 piliers de l'app,
 * puis bouton "Se connecter" vers l'écran de login.
 */

import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "../../constants/colors";
import { onboardingStorage } from "../../api/client";
import { FontFamily, FontSize, Spacing, BorderRadius } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface Slide {
  icon: IoniconName;
  color: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    icon: "leaf",
    color: Colors.vertForet,
    title: "Bienvenue sur AGRILYO",
    description:
      "La plateforme qui accompagne les agriculteurs ivoiriens à chaque étape : la terre, les semences et le conseil, réunis en une seule application.",
  },
  {
    icon: "map",
    color: Colors.foncier,
    title: "Foncier",
    description:
      "Sécurisez vos parcelles : consultez vos titres, suivez vos démarches et gérez vos terres agricoles en toute confiance.",
  },
  {
    icon: "leaf-outline",
    color: Colors.semences,
    title: "Semences",
    description:
      "Commandez des semences certifiées Ivoire Semences, suivez vos livraisons et retrouvez les meilleures variétés pour votre région.",
  },
  {
    icon: "people",
    color: Colors.conseil,
    title: "Conseil",
    description:
      "Échangez avec des conseillers agricoles, obtenez des recommandations adaptées à vos cultures et restez informé des bonnes pratiques.",
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleNext = async () => {
    if (isLastSlide) {
      await onboardingStorage.markSeen();
      router.replace("/(auth)/login");
    } else {
      goToSlide(activeIndex + 1);
    }
  };

  const handleSkip = async () => {
    await onboardingStorage.markSeen();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {activeIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={[styles.iconCircle, { backgroundColor: `${slide.color}1A` }]}>
              <Ionicons name={slide.icon} size={72} color={slide.color} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && [
                  styles.dotActive,
                  { backgroundColor: SLIDES[activeIndex].color },
                ],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: SLIDES[activeIndex].color }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? "Se connecter" : "Suivant"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.blanc} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blanc,
  },
  skipButton: {
    position: "absolute",
    top: 56,
    right: Spacing.lg,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondaire,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xxl,
    color: Colors.textPrincipal,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.md,
    color: Colors.textSecondaire,
    textAlign: "center",
    lineHeight: 23,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.grisMoyen,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 22,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    paddingVertical: 18,
  },
  buttonText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.md,
    color: Colors.blanc,
    letterSpacing: 0.5,
  },
});
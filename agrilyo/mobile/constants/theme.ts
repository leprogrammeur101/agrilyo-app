/**
 * AGRILYO — Design System : espacement, typographie, ombres, border radius
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const FontFamily = {
  // Montserrat — Titres et labels
  headingBlack: "Montserrat_900Black",
  headingBold: "Montserrat_700Bold",
  headingSemiBold: "Montserrat_600SemiBold",
  // DM Sans — Corps de texte
  bodyRegular: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodyBold: "DMSans_700Bold",
} as const;

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: "#1A4D2E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 10,
  },
} as const;

// ── Régions de Côte d'Ivoire (pour les selects) ───────────────────────────────
export const CI_REGIONS = [
  "Abidjan",
  "Agnéby-Tiassa",
  "Bagoué",
  "Bélier",
  "Béré",
  "Bounkani",
  "Cavally",
  "Folon",
  "Gbêkê",
  "Gbôklé",
  "Gôh",
  "Gontougo",
  "Grands Ponts",
  "Guémon",
  "Hambol",
  "Haut-Sassandra",
  "Iffou",
  "Indénié-Djuablin",
  "Kabadougou",
  "La Mé",
  "Lôh-Djiboua",
  "Marahoué",
  "Moronou",
  "Nawa",
  "N'Zi",
  "Poro",
  "San-Pédro",
  "Tchologo",
  "Tonkpi",
  "Worodougou",
  "Yamoussoukro",
] as const;

export type CIRegion = (typeof CI_REGIONS)[number];
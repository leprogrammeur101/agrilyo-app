import type { Config } from "tailwindcss";

// Palette alignée sur constants/colors.ts du mobile, pour une identité visuelle cohérente.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        vertForet: "#1A4D2E",
        vertSavane: "#4A7C59",
        cremeIvoire: "#F6F3ED",
        foncier: "#A0522D",
        semences: "#D4A017",
        conseil: "#2D7A4F",
        erreur: "#D32F2F",
        succes: "#4CAF78",
        alerte: "#F57C00",
        info: "#1976D2",
      },
    },
  },
  plugins: [],
};

export default config;
/**
 * AGRILYO — Palette de couleurs officielle
 * Source : Brand Identity approuvée Avril 2026
 */

export const Colors = {
  // ── Verts (couleurs primaires) ──────────────────────────────────────────────
  vertForet: "#1A4D2E",    // Vert Forêt — fond principal, headers, CTA primary
  vertSavane: "#2D7A4F",   // Vert Savane — sections, boutons secondaires
  vertFeuille: "#4CAF78",  // Vert Feuille — accents, icônes actives, succès

  // ── Ors (couleurs d'accent) ─────────────────────────────────────────────────
  orProfond: "#C8972A",    // Or Profond — badges premium, labels Ivoire Semences
  orClair: "#F0C040",      // Or Clair — étoiles, highlights, tags
  cremeIvoire: "#F6F3ED",  // Crème Ivoire — fonds clairs, cartes, inputs

  // ── Neutres ─────────────────────────────────────────────────────────────────
  blanc: "#FFFFFF",
  grisLeger: "#F5F5F5",
  grisMoyen: "#E0E0E0",
  grisFonce: "#9E9E9E",
  textPrincipal: "#1C1C1C",
  textSecondaire: "#555555",
  textDesactive: "#AAAAAA",

  // ── Sémantiques ─────────────────────────────────────────────────────────────
  succes: "#4CAF78",       // = vertFeuille
  erreur: "#D32F2F",
  alerte: "#F57C00",
  info: "#1976D2",

  // ── Modules (couleur par pilier) ────────────────────────────────────────────
  foncier: "#1A4D2E",      // M1 — Vert Forêt
  semences: "#C8972A",     // M2 — Or Profond
  conseil: "#2D7A4F",      // M3 — Vert Savane

  // ── Transparences ───────────────────────────────────────────────────────────
  overlayDark: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(255,255,255,0.85)",
  vertForetAlpha: "rgba(26,77,46,0.08)",
} as const;

export type ColorKey = keyof typeof Colors;
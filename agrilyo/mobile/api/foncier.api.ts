/**
 * API Foncier — AGRILYO M1
 * Types et appels vers les endpoints /foncier/annonces
 */

import { apiClient } from "./client";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export type TypeAcces = "LOCATION" | "VENTE" | "METAYAGE" | "AMODIATION";
export type StatutJuridique = "COUTUMIER" | "CF" | "TF" | "INCONNU";
export type BadgeSecurite =
  | "NON_VERIFIE"
  | "COUTUMIER_DECLARE"
  | "CF_VERIFIE"
  | "TF_VERIFIE";
export type StatutAnnonce = "ACTIVE" | "INACTIVE" | "EN_ATTENTE" | "LOUE";

export interface BailleurResume {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string;
  region: string | null;
}

export interface DocumentFoncier {
  id: string;
  type_document: string;
  nom_fichier: string;
  url_stockage: string;
  est_public: boolean;
  created_at: string;
}

export interface AnnonceResume {
  id: string;
  type_acces: TypeAcces;
  superficie_ha: number;
  prix_indicatif: number | null;
  region: string;
  sous_prefecture: string | null;
  badge: BadgeSecurite;
  statut_juridique: StatutJuridique;
  statut: StatutAnnonce;
  vues: number;
  created_at: string;
  photo_url: string | null;
}

export interface AnnonceDetail extends AnnonceResume {
  village: string | null;
  latitude: number | null;
  longitude: number | null;
  badge_note: string | null;
  description: string | null;
  culture_anterieure: string | null;
  equipements: string | null;
  updated_at: string;
  bailleur: BailleurResume;
  documents: DocumentFoncier[];
}

export interface AnnonceListResponse {
  items: AnnonceResume[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AnnonceCreate {
  type_acces: TypeAcces;
  superficie_ha: number;
  prix_indicatif?: number | null;
  region: string;
  sous_prefecture?: string | null;
  village?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  statut_juridique?: StatutJuridique;
  description?: string | null;
  culture_anterieure?: string | null;
  equipements?: string | null;
}

export interface FoncierFiltres {
  region?: string;
  type_acces?: TypeAcces;
  badge?: BadgeSecurite;
  superficie_min?: number;
  superficie_max?: number;
  prix_max?: number;
  page?: number;
  size?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Labels affichés à l'utilisateur
// ═══════════════════════════════════════════════════════════════════════════════

export const TYPE_ACCES_LABELS: Record<TypeAcces, string> = {
  LOCATION:   "Location",
  VENTE:      "Vente",
  METAYAGE:   "Métayage",
  AMODIATION: "Amodiation",
};

export const BADGE_LABELS: Record<BadgeSecurite, string> = {
  NON_VERIFIE:       "Non vérifié",
  COUTUMIER_DECLARE: "Droits coutumiers",
  CF_VERIFIE:        "Certificat foncier",
  TF_VERIFIE:        "Titre foncier",
};

export const STATUT_JURIDIQUE_LABELS: Record<StatutJuridique, string> = {
  COUTUMIER: "Droit coutumier",
  CF:        "Certificat foncier",
  TF:        "Titre foncier",
  INCONNU:   "Non précisé",
};

// ═══════════════════════════════════════════════════════════════════════════════
// Appels API
// ═══════════════════════════════════════════════════════════════════════════════

export const foncierApi = {

  listerAnnonces: async (filtres: FoncierFiltres = {}): Promise<AnnonceListResponse> => {
  // Supprimer les clés undefined/null avant envoi
  const params = Object.fromEntries(
    Object.entries(filtres).filter(([_, v]) => v !== undefined && v !== null)
  );
  const { data } = await apiClient.get<AnnonceListResponse>(
    "/foncier/annonces",
    { params }
  );
  return data;
  },

  getAnnonce: async (id: string): Promise<AnnonceDetail> => {
    const { data } = await apiClient.get<AnnonceDetail>(
      `/foncier/annonces/${id}`
    );
    return data;
  },

  creerAnnonce: async (payload: AnnonceCreate): Promise<AnnonceDetail> => {
    const { data } = await apiClient.post<AnnonceDetail>(
      "/foncier/annonces",
      payload
    );
    return data;
  },

  mesAnnonces: async (page = 1): Promise<AnnonceListResponse> => {
    const { data } = await apiClient.get<AnnonceListResponse>(
      "/foncier/annonces/moi/annonces",
      { params: { page } }
    );
    return data;
  },
};
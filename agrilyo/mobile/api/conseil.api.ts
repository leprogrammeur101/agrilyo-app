/**
 * API Conseil - AGRILYO M3
 * Types et appels vers les endpoints /conseil.
 */

import { apiClient } from "./client";

export type StatutAgronome = "EN_ATTENTE" | "VERIFIE" | "SUSPENDU" | "REJETE";
export type TypeConseil =
  | "DIAGNOSTIC"
  | "PLANNING_CULTURAL"
  | "SUIVI_CULTURE"
  | "URGENCE_PHYTOSANITAIRE"
  | "AUTRE";
export type StatutDemandeConseil =
  | "NOUVELLE"
  | "ASSIGNEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULEE";
export type CanalSessionConseil = "CHAT" | "AUDIO" | "VIDEO" | "TERRAIN";
export type StatutSessionConseil = "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
export type StatutOperationPlanning = "A_FAIRE" | "EN_COURS" | "TERMINEE" | "REPORTEE";

export interface AgronomeResume {
  id: string;
  titre: string;
  organisation: string | null;
  specialites: string[];
  cultures: string[];
  regions_couvertes: string[];
  langues: string[];
  annees_experience: number;
  tarif_session: number | null;
  note_moyenne: number;
  nombre_sessions: number;
  statut: StatutAgronome;
}

export interface AgronomeDetail extends AgronomeResume {
  user_id: string;
  bio: string | null;
  numero_agrement: string | null;
  telephone_pro: string | null;
  email_pro: string | null;
  verifie_le: string | null;
  note_admin: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgronomeListResponse {
  items: AgronomeResume[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AgronomeFiltres {
  culture?: string | null;
  region?: string | null;
  specialite?: string | null;
  page?: number;
  size?: number;
}

export interface DemandeConseilCreate {
  type_conseil?: TypeConseil;
  culture: string;
  variete?: string | null;
  region: string;
  ville?: string | null;
  titre: string;
  description: string;
  urgence?: boolean;
  photos_urls?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface DemandeConseilResume {
  id: string;
  agriculteur_id: string;
  agronome_id: string | null;
  type_conseil: TypeConseil;
  statut: StatutDemandeConseil;
  culture: string;
  region: string;
  titre: string;
  urgence: boolean;
  score_matching: number | null;
  created_at: string;
  updated_at: string;
}

export interface DemandeConseilDetail extends DemandeConseilResume {
  variete: string | null;
  ville: string | null;
  description: string;
  photos_urls: string[] | null;
  metadata: Record<string, unknown> | null;
  assigned_at: string | null;
  closed_at: string | null;
}

export interface DemandeConseilListResponse {
  items: DemandeConseilResume[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MatchingSuggestion {
  agronome: AgronomeResume;
  score: number;
  raisons: string[];
}

export interface OperationPlanning {
  id: string;
  planning_id: string;
  titre: string;
  description: string | null;
  date_prevue: string | null;
  date_realisee: string | null;
  statut: StatutOperationPlanning;
  rappel_sms: boolean;
  rappel_envoye_le: string | null;
  ordre: number;
  created_at: string;
  updated_at: string;
}

export interface PlanningCultural {
  id: string;
  agriculteur_id: string;
  agronome_id: string | null;
  demande_id: string | null;
  titre: string;
  description: string | null;
  culture: string;
  variete: string | null;
  region: string;
  superficie_ha: number | null;
  date_debut: string | null;
  date_fin: string | null;
  actif: boolean;
  operations: OperationPlanning[];
  created_at: string;
  updated_at: string;
}

export interface PlanningCulturalListResponse {
  items: PlanningCultural[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const TYPE_CONSEIL_LABELS: Record<TypeConseil, string> = {
  DIAGNOSTIC: "Diagnostic",
  PLANNING_CULTURAL: "Planning cultural",
  SUIVI_CULTURE: "Suivi de culture",
  URGENCE_PHYTOSANITAIRE: "Urgence phytosanitaire",
  AUTRE: "Autre besoin",
};

const cleanParams = <T extends Record<string, unknown>>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

export const conseilApi = {
  listerAgronomes: async (filtres: AgronomeFiltres = {}): Promise<AgronomeListResponse> => {
    const { data } = await apiClient.get<AgronomeListResponse>("/conseil/agronomes", {
      params: cleanParams(filtres as Record<string, unknown>),
    });
    return data;
  },

  getAgronome: async (id: string): Promise<AgronomeDetail> => {
    const { data } = await apiClient.get<AgronomeDetail>(`/conseil/agronomes/${id}`);
    return data;
  },

  creerDemande: async (payload: DemandeConseilCreate): Promise<DemandeConseilDetail> => {
    const { data } = await apiClient.post<DemandeConseilDetail>("/conseil/demandes", payload);
    return data;
  },

  listerDemandes: async (page = 1, size = 20): Promise<DemandeConseilListResponse> => {
    const { data } = await apiClient.get<DemandeConseilListResponse>("/conseil/demandes", {
      params: { page, size },
    });
    return data;
  },

  getDemande: async (id: string): Promise<DemandeConseilDetail> => {
    const { data } = await apiClient.get<DemandeConseilDetail>(`/conseil/demandes/${id}`);
    return data;
  },

  suggererAgronomes: async (demandeId: string, limit = 5): Promise<MatchingSuggestion[]> => {
    const { data } = await apiClient.get<MatchingSuggestion[]>(
      `/conseil/demandes/${demandeId}/matching`,
      { params: { limit } }
    );
    return data;
  },

  listerPlannings: async (page = 1, size = 20): Promise<PlanningCulturalListResponse> => {
    const { data } = await apiClient.get<PlanningCulturalListResponse>("/conseil/plannings", {
      params: { page, size },
    });
    return data;
  },

  getPlanning: async (id: string): Promise<PlanningCultural> => {
    const { data } = await apiClient.get<PlanningCultural>(`/conseil/plannings/${id}`);
    return data;
  },
};

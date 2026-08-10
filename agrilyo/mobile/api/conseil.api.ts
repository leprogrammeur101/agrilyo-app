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

export interface AgronomeStatutUpdatePayload {
  statut: StatutAgronome;
  note_admin?: string | null;
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

export interface SessionConseil {
  id: string;
  demande_id: string;
  agronome_id: string;
  agriculteur_id: string;
  canal: CanalSessionConseil;
  statut: StatutSessionConseil;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  duree_minutes: number | null;
  notes_agronome: string | null;
  compte_rendu: string | null;
  created_at: string;
}

export interface SessionConseilCreatePayload {
  demande_id: string;
  canal?: CanalSessionConseil;
  scheduled_at?: string | null;
}

export interface SessionConseilTerminerPayload {
  compte_rendu: string;
  notes_agronome?: string | null;
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

export interface OperationPlanningCreatePayload {
  titre: string;
  description?: string | null;
  date_prevue?: string | null;
  rappel_sms?: boolean;
  ordre?: number;
}

export interface OperationPlanningUpdatePayload {
  titre?: string;
  description?: string | null;
  date_prevue?: string | null;
  date_realisee?: string | null;
  statut?: StatutOperationPlanning;
  rappel_sms?: boolean;
  ordre?: number;
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
  // ── Agronomes ────────────────────────────────────────────────────────────
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

  /** [Admin] Valider / suspendre / rejeter un profil agronome */
  mettreAJourStatutAgronome: async (
    agronomeId: string,
    payload: AgronomeStatutUpdatePayload
  ): Promise<AgronomeDetail> => {
    const { data } = await apiClient.patch<AgronomeDetail>(
      `/conseil/agronomes/${agronomeId}/statut`,
      payload
    );
    return data;
  },

  // ── Demandes de conseil ──────────────────────────────────────────────────
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

  /** [Admin] Assigner l'agronome choisi à une demande (suite au matching) */
  assignerAgronome: async (
    demandeId: string,
    agronomeId: string,
    scoreMatching?: number
  ): Promise<DemandeConseilDetail> => {
    const { data } = await apiClient.patch<DemandeConseilDetail>(
      `/conseil/demandes/${demandeId}/assigner`,
      { agronome_id: agronomeId, score_matching: scoreMatching ?? null }
    );
    return data;
  },

  mettreAJourStatutDemande: async (
    demandeId: string,
    statut: StatutDemandeConseil
  ): Promise<DemandeConseilDetail> => {
    const { data } = await apiClient.patch<DemandeConseilDetail>(
      `/conseil/demandes/${demandeId}/statut`,
      { statut }
    );
    return data;
  },

  // ── Sessions de conseil ──────────────────────────────────────────────────
  creerSession: async (payload: SessionConseilCreatePayload): Promise<SessionConseil> => {
    const { data } = await apiClient.post<SessionConseil>("/conseil/sessions", payload);
    return data;
  },

  getSession: async (sessionId: string): Promise<SessionConseil> => {
    const { data } = await apiClient.get<SessionConseil>(`/conseil/sessions/${sessionId}`);
    return data;
  },

  demarrerSession: async (sessionId: string): Promise<SessionConseil> => {
    const { data } = await apiClient.post<SessionConseil>(
      `/conseil/sessions/${sessionId}/demarrer`
    );
    return data;
  },

  terminerSession: async (
    sessionId: string,
    payload: SessionConseilTerminerPayload
  ): Promise<SessionConseil> => {
    const { data } = await apiClient.post<SessionConseil>(
      `/conseil/sessions/${sessionId}/terminer`,
      payload
    );
    return data;
  },

  // ── Plannings culturaux ──────────────────────────────────────────────────
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

  // ── Opérations de planning ───────────────────────────────────────────────
  creerOperation: async (
    planningId: string,
    payload: OperationPlanningCreatePayload
  ): Promise<OperationPlanning> => {
    const { data } = await apiClient.post<OperationPlanning>(
      `/conseil/plannings/${planningId}/operations`,
      payload
    );
    return data;
  },

  modifierOperation: async (
    operationId: string,
    payload: OperationPlanningUpdatePayload
  ): Promise<OperationPlanning> => {
    const { data } = await apiClient.patch<OperationPlanning>(
      `/conseil/operations/${operationId}`,
      payload
    );
    return data;
  },

  supprimerOperation: async (operationId: string): Promise<void> => {
    await apiClient.delete(`/conseil/operations/${operationId}`);
  },
};
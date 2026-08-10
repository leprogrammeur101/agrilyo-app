/**
 * Zustand Store Conseil - AGRILYO M3
 * Agronomes, demandes de conseil, matching, sessions, plannings et opérations.
 */

import { create } from "zustand";
import { getApiErrorMessage } from "../api/client";
import {
  AgronomeDetail,
  AgronomeFiltres,
  AgronomeResume,
  DemandeConseilCreate,
  DemandeConseilDetail,
  DemandeConseilResume,
  MatchingSuggestion,
  OperationPlanningCreatePayload,
  OperationPlanningUpdatePayload,
  PlanningCultural,
  SessionConseil,
  SessionConseilCreatePayload,
  SessionConseilTerminerPayload,
  conseilApi,
} from "../api/conseil.api";

interface ConseilState {
  agronomes: AgronomeResume[];
  totalAgronomes: number;
  pageAgronomes: number;
  pagesAgronomes: number;
  filtresAgronomes: AgronomeFiltres;
  agronomeSelectionne: AgronomeDetail | null;
  isLoadingAgronomes: boolean;
  isRefreshingAgronomes: boolean;
  isLoadingDetail: boolean;

  demandes: DemandeConseilResume[];
  demandeSelectionnee: DemandeConseilDetail | null;
  suggestions: MatchingSuggestion[];
  isLoadingDemandes: boolean;
  isSubmittingDemande: boolean;
  isLoadingMatching: boolean;
  isAssigning: boolean;

  sessionSelectionnee: SessionConseil | null;
  isCreatingSession: boolean;
  isLoadingSession: boolean;
  isUpdatingSession: boolean;

  plannings: PlanningCultural[];
  planningSelectionne: PlanningCultural | null;
  isLoadingPlannings: boolean;
  isSavingOperation: boolean;

  error: string | null;

  chargerAgronomes: (reset?: boolean) => Promise<void>;
  rafraichirAgronomes: () => Promise<void>;
  chargerAgronomesSuivants: () => Promise<void>;
  setFiltresAgronomes: (filtres: Partial<AgronomeFiltres>) => void;
  resetFiltresAgronomes: () => void;
  chargerAgronome: (id: string) => Promise<void>;
  clearAgronome: () => void;

  creerDemande: (payload: DemandeConseilCreate) => Promise<DemandeConseilDetail | null>;
  chargerDemandes: () => Promise<void>;
  chargerDemande: (id: string) => Promise<void>;
  chargerMatching: (demandeId: string) => Promise<void>;
  assignerAgronome: (
    demandeId: string,
    agronomeId: string,
    scoreMatching?: number
  ) => Promise<boolean>;

  creerSession: (payload: SessionConseilCreatePayload) => Promise<SessionConseil | null>;
  chargerSession: (sessionId: string) => Promise<void>;
  demarrerSession: (sessionId: string) => Promise<void>;
  terminerSession: (
    sessionId: string,
    payload: SessionConseilTerminerPayload
  ) => Promise<void>;
  clearSession: () => void;

  chargerPlannings: () => Promise<void>;
  chargerPlanning: (id: string) => Promise<void>;
  ajouterOperation: (
    planningId: string,
    payload: OperationPlanningCreatePayload
  ) => Promise<boolean>;
  modifierOperation: (
    operationId: string,
    payload: OperationPlanningUpdatePayload
  ) => Promise<boolean>;
  supprimerOperation: (operationId: string) => Promise<boolean>;

  clearError: () => void;
}

const FILTRES_AGRONOMES_DEFAUT: AgronomeFiltres = {
  page: 1,
  size: 20,
};

export const useConseilStore = create<ConseilState>()((set, get) => ({
  agronomes: [],
  totalAgronomes: 0,
  pageAgronomes: 1,
  pagesAgronomes: 1,
  filtresAgronomes: FILTRES_AGRONOMES_DEFAUT,
  agronomeSelectionne: null,
  isLoadingAgronomes: false,
  isRefreshingAgronomes: false,
  isLoadingDetail: false,

  demandes: [],
  demandeSelectionnee: null,
  suggestions: [],
  isLoadingDemandes: false,
  isSubmittingDemande: false,
  isLoadingMatching: false,
  isAssigning: false,

  sessionSelectionnee: null,
  isCreatingSession: false,
  isLoadingSession: false,
  isUpdatingSession: false,

  plannings: [],
  planningSelectionne: null,
  isLoadingPlannings: false,
  isSavingOperation: false,

  error: null,

  chargerAgronomes: async (reset = false) => {
    const { filtresAgronomes, agronomes } = get();
    const page = reset ? 1 : filtresAgronomes.page ?? 1;
    set({ isLoadingAgronomes: true, error: null });

    try {
      const response = await conseilApi.listerAgronomes({
        ...filtresAgronomes,
        page,
      });
      set({
        agronomes: reset ? response.items : [...agronomes, ...response.items],
        totalAgronomes: response.total,
        pageAgronomes: response.page,
        pagesAgronomes: response.pages,
        filtresAgronomes: { ...filtresAgronomes, page },
        isLoadingAgronomes: false,
      });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoadingAgronomes: false });
    }
  },

  rafraichirAgronomes: async () => {
    set({ isRefreshingAgronomes: true });
    await get().chargerAgronomes(true);
    set({ isRefreshingAgronomes: false });
  },

  chargerAgronomesSuivants: async () => {
    const { pageAgronomes, pagesAgronomes, isLoadingAgronomes, filtresAgronomes } = get();
    if (isLoadingAgronomes || pageAgronomes >= pagesAgronomes) return;
    set({ filtresAgronomes: { ...filtresAgronomes, page: pageAgronomes + 1 } });
    await get().chargerAgronomes(false);
  },

  setFiltresAgronomes: (nouveauxFiltres) => {
    set((state) => ({
      filtresAgronomes: {
        ...state.filtresAgronomes,
        ...nouveauxFiltres,
        page: 1,
      },
    }));
    get().chargerAgronomes(true);
  },

  resetFiltresAgronomes: () => {
    set({ filtresAgronomes: FILTRES_AGRONOMES_DEFAUT });
    get().chargerAgronomes(true);
  },

  chargerAgronome: async (id) => {
    set({ isLoadingDetail: true, agronomeSelectionne: null, error: null });
    try {
      const agronome = await conseilApi.getAgronome(id);
      set({ agronomeSelectionne: agronome, isLoadingDetail: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoadingDetail: false });
    }
  },

  clearAgronome: () => set({ agronomeSelectionne: null }),

  creerDemande: async (payload) => {
    set({ isSubmittingDemande: true, error: null });
    try {
      const demande = await conseilApi.creerDemande(payload);
      set({
        demandeSelectionnee: demande,
        isSubmittingDemande: false,
      });
      await get().chargerDemandes();
      await get().chargerMatching(demande.id);
      return demande;
    } catch (error) {
      set({ error: getApiErrorMessage(error), isSubmittingDemande: false });
      return null;
    }
  },

  chargerDemandes: async () => {
    set({ isLoadingDemandes: true, error: null });
    try {
      const response = await conseilApi.listerDemandes();
      set({ demandes: response.items, isLoadingDemandes: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoadingDemandes: false });
    }
  },

  chargerDemande: async (id) => {
    set({ isLoadingDemandes: true, demandeSelectionnee: null, error: null });
    try {
      const demande = await conseilApi.getDemande(id);
      set({ demandeSelectionnee: demande, isLoadingDemandes: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoadingDemandes: false });
    }
  },

  chargerMatching: async (demandeId) => {
    set({ isLoadingMatching: true, error: null });
    try {
      const suggestions = await conseilApi.suggererAgronomes(demandeId);
      set({ suggestions, isLoadingMatching: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoadingMatching: false });
    }
  },

  assignerAgronome: async (demandeId, agronomeId, scoreMatching) => {
    set({ isAssigning: true, error: null });
    try {
      const demande = await conseilApi.assignerAgronome(demandeId, agronomeId, scoreMatching);
      set({ demandeSelectionnee: demande, isAssigning: false });
      await get().chargerDemandes();
      return true;
    } catch (error) {
      set({ error: getApiErrorMessage(error), isAssigning: false });
      return false;
    }
  },

  creerSession: async (payload) => {
    set({ isCreatingSession: true, error: null });
    try {
      const session = await conseilApi.creerSession(payload);
      set({ sessionSelectionnee: session, isCreatingSession: false });
      return session;
    } catch (error) {
      set({ error: getApiErrorMessage(error), isCreatingSession: false });
      return null;
    }
  },

  chargerSession: async (sessionId) => {
    set({ isLoadingSession: true, error: null });
    try {
      const session = await conseilApi.getSession(sessionId);
      set({ sessionSelectionnee: session, isLoadingSession: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoadingSession: false });
    }
  },

  demarrerSession: async (sessionId) => {
    set({ isUpdatingSession: true, error: null });
    try {
      const session = await conseilApi.demarrerSession(sessionId);
      set({ sessionSelectionnee: session, isUpdatingSession: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isUpdatingSession: false });
    }
  },

  terminerSession: async (sessionId, payload) => {
    set({ isUpdatingSession: true, error: null });
    try {
      const session = await conseilApi.terminerSession(sessionId, payload);
      set({ sessionSelectionnee: session, isUpdatingSession: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isUpdatingSession: false });
    }
  },

  clearSession: () => set({ sessionSelectionnee: null }),

  chargerPlannings: async () => {
    set({ isLoadingPlannings: true, error: null });
    try {
      const response = await conseilApi.listerPlannings();
      set({ plannings: response.items, isLoadingPlannings: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoadingPlannings: false });
    }
  },

  chargerPlanning: async (id) => {
    set({ isLoadingPlannings: true, planningSelectionne: null, error: null });
    try {
      const planning = await conseilApi.getPlanning(id);
      set({ planningSelectionne: planning, isLoadingPlannings: false });
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoadingPlannings: false });
    }
  },

  ajouterOperation: async (planningId, payload) => {
    set({ isSavingOperation: true, error: null });
    try {
      await conseilApi.creerOperation(planningId, payload);
      await get().chargerPlanning(planningId);
      set({ isSavingOperation: false });
      return true;
    } catch (error) {
      set({ error: getApiErrorMessage(error), isSavingOperation: false });
      return false;
    }
  },

  modifierOperation: async (operationId, payload) => {
    const planningId = get().planningSelectionne?.id;
    set({ isSavingOperation: true, error: null });
    try {
      await conseilApi.modifierOperation(operationId, payload);
      if (planningId) await get().chargerPlanning(planningId);
      set({ isSavingOperation: false });
      return true;
    } catch (error) {
      set({ error: getApiErrorMessage(error), isSavingOperation: false });
      return false;
    }
  },

  supprimerOperation: async (operationId) => {
    const planningId = get().planningSelectionne?.id;
    set({ isSavingOperation: true, error: null });
    try {
      await conseilApi.supprimerOperation(operationId);
      if (planningId) await get().chargerPlanning(planningId);
      set({ isSavingOperation: false });
      return true;
    } catch (error) {
      set({ error: getApiErrorMessage(error), isSavingOperation: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
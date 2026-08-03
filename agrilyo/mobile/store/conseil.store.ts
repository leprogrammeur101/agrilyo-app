/**
 * Zustand Store Conseil - AGRILYO M3
 * Agronomes, demandes de conseil, matching et plannings.
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
  PlanningCultural,
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

  plannings: PlanningCultural[];
  planningSelectionne: PlanningCultural | null;
  isLoadingPlannings: boolean;

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

  chargerPlannings: () => Promise<void>;
  chargerPlanning: (id: string) => Promise<void>;
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

  plannings: [],
  planningSelectionne: null,
  isLoadingPlannings: false,

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

  clearError: () => set({ error: null }),
}));
/**
 * Zustand Store Conseil - AGRILYO M3
 * Agronomes, demandes de conseil, matching et plannings.
 */

import { create } from "zustand";
import { getApiErrorMessage } from "../api/client";
import {
  AgronomeDetail,
  AgronomeFiltres,
  AgronomeResume,
  conseilApi,
  DemandeConseilCreate,
  DemandeConseilDetail,
  DemandeConseilResume,
  MatchingSuggestion,
  PlanningCultural,
} from "../api/conseil.api";

interface ConseilState {
  agronomes: AgronomeResume[];
  totalAgronomes: number;
  pageAgronomes: number;
  pagesAgronomes: number;
  filtresAgronomes: AgronomeFiltres;
  agronomeSelectionne: AgronomeDetail | null;

  demandes: DemandeConseilResume[];
  demandeSelectionnee: DemandeConseilDetail | null;
  suggestions: MatchingSuggestion[];

  plannings: PlanningCultural[];
  planningSelectionne: PlanningCultural | null;

  isLoadingAgronomes: boolean;
  isRefreshingAgronomes: boolean;
  isLoadingDetail: boolean;
  isLoadingDemandes: boolean;
  isSubmittingDemande: boolean;
  isLoadingPlannings: boolean;
  error: string | null;

  chargerAgronomes: (reset?: boolean) => Promise<void>;
  rafraichirAgronomes: () => Promise<void>;
  chargerAgronomesSuivants: () => Promise<void>;
  setFiltresAgronomes: (filtres: Partial<AgronomeFiltres>) => void;
  resetFiltresAgronomes: () => void;
  chargerDetailAgronome: (id: string) => Promise<void>;
  clearAgronomeSelectionne: () => void;

  creerDemande: (payload: DemandeConseilCreate) => Promise<DemandeConseilDetail | null>;
  chargerDemandes: () => Promise<void>;
  chargerDemande: (id: string) => Promise<void>;
  chargerMatching: (demandeId: string) => Promise<void>;

  chargerPlannings: () => Promise<void>;
  chargerPlanning: (id: string) => Promise<void>;
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

  demandes: [],
  demandeSelectionnee: null,
  suggestions: [],

  plannings: [],
  planningSelectionne: null,

  isLoadingAgronomes: false,
  isRefreshingAgronomes: false,
  isLoadingDetail: false,
  isLoadingDemandes: false,
  isSubmittingDemande: false,
  isLoadingPlannings: false,
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
      set({
        error: getApiErrorMessage(error),
        isLoadingAgronomes: false,
      });
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

  chargerDetailAgronome: async (id) => {
    set({ isLoadingDetail: true, agronomeSelectionne: null, error: null });
    try {
      const agronome = await conseilApi.getAgronome(id);
      set({ agronomeSelectionne: agronome, isLoadingDetail: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingDetail: false,
      });
    }
  },

  clearAgronomeSelectionne: () => set({ agronomeSelectionne: null }),

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
      set({
        error: getApiErrorMessage(error),
        isSubmittingDemande: false,
      });
      return null;
    }
  },

  chargerDemandes: async () => {
    set({ isLoadingDemandes: true, error: null });
    try {
      const response = await conseilApi.listerDemandes();
      set({ demandes: response.items, isLoadingDemandes: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingDemandes: false,
      });
    }
  },

  chargerDemande: async (id) => {
    set({ isLoadingDemandes: true, demandeSelectionnee: null, error: null });
    try {
      const demande = await conseilApi.getDemande(id);
      set({ demandeSelectionnee: demande, isLoadingDemandes: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingDemandes: false,
      });
    }
  },

  chargerMatching: async (demandeId) => {
    set({ isLoadingAgronomes: true, error: null });
    try {
      const suggestions = await conseilApi.suggererAgronomes(demandeId);
      set({ suggestions, isLoadingAgronomes: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingAgronomes: false,
      });
    }
  },

  chargerPlannings: async () => {
    set({ isLoadingPlannings: true, error: null });
    try {
      const response = await conseilApi.listerPlannings();
      set({ plannings: response.items, isLoadingPlannings: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingPlannings: false,
      });
    }
  },

  chargerPlanning: async (id) => {
    set({ isLoadingPlannings: true, planningSelectionne: null, error: null });
    try {
      const planning = await conseilApi.getPlanning(id);
      set({ planningSelectionne: planning, isLoadingPlannings: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingPlannings: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

/**
 * Zustand Store Foncier — AGRILYO M1
 * Gestion de l'état des annonces foncières et des filtres actifs.
 */

import { create } from "zustand";
import {
  AnnonceDetail,
  AnnonceResume,
  FoncierFiltres,
  TypeAcces,
  foncierApi,
} from "../api/foncier.api";

interface FoncierState {
  // ── Liste ──────────────────────────────────────────────────────────────────
  annonces: AnnonceResume[];
  total: number;
  page: number;
  pages: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // ── Filtres actifs ─────────────────────────────────────────────────────────
  filtres: FoncierFiltres;

  // ── Annonce sélectionnée ──────────────────────────────────────────────────
  annonceSelectionnee: AnnonceDetail | null;
  isLoadingDetail: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  chargerAnnonces: (reset?: boolean) => Promise<void>;
  rafraichir: () => Promise<void>;
  chargerSuivant: () => Promise<void>;
  setFiltres: (filtres: Partial<FoncierFiltres>) => void;
  resetFiltres: () => void;
  chargerDetail: (id: string) => Promise<void>;
  clearDetail: () => void;
}

const FILTRES_DEFAUT: FoncierFiltres = {
  page: 1,
  size: 20,
};

export const useFoncierStore = create<FoncierState>()((set, get) => ({
  annonces: [],
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  isRefreshing: false,
  error: null,
  filtres: FILTRES_DEFAUT,
  annonceSelectionnee: null,
  isLoadingDetail: false,

  /**
   * Charge la liste des annonces.
   * reset=true repart de la page 1 (utilisé pour les filtres et le pull-to-refresh).
   */
  chargerAnnonces: async (reset = false) => {
    const { filtres, annonces } = get();

    const page = reset ? 1 : filtres.page ?? 1;
    set({ isLoading: true, error: null });

    try {
      const response = await foncierApi.listerAnnonces({ ...filtres, page });
      set({
        annonces: reset ? response.items : [...annonces, ...response.items],
        total: response.total,
        page: response.page,
        pages: response.pages,
        filtres: { ...filtres, page },
        isLoading: false,
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let message = "Impossible de charger les annonces";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail[0]?.msg || message;
      }
      set({ error: message, isLoading: false });
    }
  },

  rafraichir: async () => {
    set({ isRefreshing: true });
    await get().chargerAnnonces(true);
    set({ isRefreshing: false });
  },

  chargerSuivant: async () => {
    const { page, pages, isLoading } = get();
    if (isLoading || page >= pages) return;
    const { filtres } = get();
    set({ filtres: { ...filtres, page: page + 1 } });
    await get().chargerAnnonces(false);
  },

  setFiltres: (nouveauxFiltres) => {
    set((state) => ({
      filtres: { ...state.filtres, ...nouveauxFiltres, page: 1 },
    }));
    get().chargerAnnonces(true);
  },

  resetFiltres: () => {
    set({ filtres: FILTRES_DEFAUT });
    get().chargerAnnonces(true);
  },

  chargerDetail: async (id) => {
    set({ isLoadingDetail: true, annonceSelectionnee: null });
    try {
      const annonce = await foncierApi.getAnnonce(id);
      set({ annonceSelectionnee: annonce, isLoadingDetail: false });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let message = "Impossible de charger cette annonce";
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail) && detail.length > 0) message = detail[0]?.msg || message;
      set({ isLoadingDetail: false, error: message });
    }
  },

  clearDetail: () => set({ annonceSelectionnee: null }),
}));
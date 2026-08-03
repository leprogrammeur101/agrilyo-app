/**
 * Zustand Store Semences - AGRILYO M2
 * Catalogue, fournisseurs, profil semencier et panier local.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { getApiErrorMessage } from "../api/client";
import {
  CommandeFromPanierCreate,
  CommandeResponse,
  CommandeResume,
  FournisseurDetail,
  FournisseurFiltres,
  FournisseurResume,
  ProduitDetail,
  ProduitFiltres,
  ProduitResume,
  semencesApi,
} from "../api/semences.api";

export interface PanierItem {
  produit: ProduitResume;
  quantite: number;
}

interface SemencesState {
  // Catalogue
  produits: ProduitResume[];
  totalProduits: number;
  pageProduits: number;
  pagesProduits: number;
  filtresProduits: ProduitFiltres;
  isLoadingProduits: boolean;
  isRefreshingProduits: boolean;

  // Detail produit
  produitSelectionne: ProduitDetail | null;
  isLoadingDetail: boolean;

  // Fournisseurs
  fournisseurs: FournisseurResume[];
  totalFournisseurs: number;
  pageFournisseurs: number;
  pagesFournisseurs: number;
  filtresFournisseurs: FournisseurFiltres;
  fournisseurSelectionne: FournisseurDetail | null;
  monFournisseur: FournisseurDetail | null;
  mesProduitsListe: ProduitResume[];
  isLoadingFournisseurs: boolean;
  isLoadingFournisseur: boolean;

  // Panier Sprint 5-ready
  panier: PanierItem[];
  nombreArticles: number;
  totalPanier: number;
  commandes: CommandeResume[];
  commandeSelectionnee: CommandeResponse | null;
  isLoadingCommandes: boolean;
  isSubmittingCommande: boolean;

  error: string | null;

  // Actions catalogue
  chargerProduits: (reset?: boolean) => Promise<void>;
  rafraichirProduits: () => Promise<void>;
  chargerProduitsSuivants: () => Promise<void>;
  setFiltresProduits: (filtres: Partial<ProduitFiltres>) => void;
  resetFiltresProduits: () => void;
  chargerDetailProduit: (id: string) => Promise<void>;
  clearDetailProduit: () => void;

  // Actions fournisseurs
  chargerFournisseurs: (reset?: boolean) => Promise<void>;
  chargerFournisseursSuivants: () => Promise<void>;
  setFiltresFournisseurs: (filtres: Partial<FournisseurFiltres>) => void;
  resetFiltresFournisseurs: () => void;
  chargerDetailFournisseur: (id: string) => Promise<void>;
  chargerMonFournisseur: () => Promise<void>;
  chargerMesProduits: () => Promise<void>;
  clearFournisseurSelectionne: () => void;

  // Actions panier
  ajouterAuPanier: (produit: ProduitResume, quantite?: number) => void;
  modifierQuantite: (produitId: string, quantite: number) => void;
  retirerDuPanier: (produitId: string) => void;
  viderPanier: () => void;
  confirmerCommandeDepuisPanier: (
    payload?: CommandeFromPanierCreate
  ) => Promise<CommandeResponse | null>;
  chargerCommandes: () => Promise<void>;
  chargerCommande: (id: string) => Promise<void>;
  clearError: () => void;
}

const FILTRES_PRODUITS_DEFAUT: ProduitFiltres = {
  page: 1,
  size: 20,
  tri: "created_at_desc",
};

const FILTRES_FOURNISSEURS_DEFAUT: FournisseurFiltres = {
  page: 1,
  size: 20,
  tri: "note_desc",
};

const calculerPanier = (panier: PanierItem[]) => ({
  nombreArticles: panier.reduce((total, item) => total + item.quantite, 0),
  totalPanier: panier.reduce(
    (total, item) => total + item.quantite * item.produit.prix_unitaire,
    0
  ),
});

const secureStoreStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const useSemencesStore = create<SemencesState>()(
  persist(
    (set, get) => ({
  produits: [],
  totalProduits: 0,
  pageProduits: 1,
  pagesProduits: 1,
  filtresProduits: FILTRES_PRODUITS_DEFAUT,
  isLoadingProduits: false,
  isRefreshingProduits: false,
  produitSelectionne: null,
  isLoadingDetail: false,

  fournisseurs: [],
  totalFournisseurs: 0,
  pageFournisseurs: 1,
  pagesFournisseurs: 1,
  filtresFournisseurs: FILTRES_FOURNISSEURS_DEFAUT,
  fournisseurSelectionne: null,
  monFournisseur: null,
  mesProduitsListe: [],
  isLoadingFournisseurs: false,
  isLoadingFournisseur: false,

  panier: [],
  nombreArticles: 0,
  totalPanier: 0,
  commandes: [],
  commandeSelectionnee: null,
  isLoadingCommandes: false,
  isSubmittingCommande: false,
  error: null,

  chargerProduits: async (reset = false) => {
    const { filtresProduits, produits } = get();
    const page = reset ? 1 : filtresProduits.page ?? 1;
    set({ isLoadingProduits: true, error: null });

    try {
      const response = await semencesApi.listerProduits({
        ...filtresProduits,
        page,
      });
      set({
        produits: reset ? response.items : [...produits, ...response.items],
        totalProduits: response.total,
        pageProduits: response.page,
        pagesProduits: response.pages,
        filtresProduits: { ...filtresProduits, page },
        isLoadingProduits: false,
      });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingProduits: false,
      });
    }
  },

  rafraichirProduits: async () => {
    set({ isRefreshingProduits: true });
    await get().chargerProduits(true);
    set({ isRefreshingProduits: false });
  },

  chargerProduitsSuivants: async () => {
    const { pageProduits, pagesProduits, isLoadingProduits, filtresProduits } = get();
    if (isLoadingProduits || pageProduits >= pagesProduits) return;
    set({ filtresProduits: { ...filtresProduits, page: pageProduits + 1 } });
    await get().chargerProduits(false);
  },

  setFiltresProduits: (nouveauxFiltres) => {
    set((state) => ({
      filtresProduits: {
        ...state.filtresProduits,
        ...nouveauxFiltres,
        page: 1,
      },
    }));
    get().chargerProduits(true);
  },

  resetFiltresProduits: () => {
    set({ filtresProduits: FILTRES_PRODUITS_DEFAUT });
    get().chargerProduits(true);
  },

  chargerDetailProduit: async (id) => {
    set({ isLoadingDetail: true, produitSelectionne: null, error: null });
    try {
      const produit = await semencesApi.getProduit(id);
      set({ produitSelectionne: produit, isLoadingDetail: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingDetail: false,
      });
    }
  },

  clearDetailProduit: () => set({ produitSelectionne: null }),

  chargerFournisseurs: async (reset = false) => {
    const { filtresFournisseurs, fournisseurs } = get();
    const page = reset ? 1 : filtresFournisseurs.page ?? 1;
    set({ isLoadingFournisseurs: true, error: null });

    try {
      const response = await semencesApi.listerFournisseurs({
        ...filtresFournisseurs,
        page,
      });
      set({
        fournisseurs: reset ? response.items : [...fournisseurs, ...response.items],
        totalFournisseurs: response.total,
        pageFournisseurs: response.page,
        pagesFournisseurs: response.pages,
        filtresFournisseurs: { ...filtresFournisseurs, page },
        isLoadingFournisseurs: false,
      });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingFournisseurs: false,
      });
    }
  },

  chargerFournisseursSuivants: async () => {
    const {
      pageFournisseurs,
      pagesFournisseurs,
      isLoadingFournisseurs,
      filtresFournisseurs,
    } = get();
    if (isLoadingFournisseurs || pageFournisseurs >= pagesFournisseurs) return;
    set({
      filtresFournisseurs: {
        ...filtresFournisseurs,
        page: pageFournisseurs + 1,
      },
    });
    await get().chargerFournisseurs(false);
  },

  setFiltresFournisseurs: (nouveauxFiltres) => {
    set((state) => ({
      filtresFournisseurs: {
        ...state.filtresFournisseurs,
        ...nouveauxFiltres,
        page: 1,
      },
    }));
    get().chargerFournisseurs(true);
  },

  resetFiltresFournisseurs: () => {
    set({ filtresFournisseurs: FILTRES_FOURNISSEURS_DEFAUT });
    get().chargerFournisseurs(true);
  },

  chargerDetailFournisseur: async (id) => {
    set({ isLoadingFournisseur: true, fournisseurSelectionne: null, error: null });
    try {
      const fournisseur = await semencesApi.getFournisseur(id);
      set({
        fournisseurSelectionne: fournisseur,
        isLoadingFournisseur: false,
      });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingFournisseur: false,
      });
    }
  },

  chargerMonFournisseur: async () => {
    set({ isLoadingFournisseur: true, error: null });
    try {
      const fournisseur = await semencesApi.getMonFournisseur();
      set({ monFournisseur: fournisseur, isLoadingFournisseur: false });
    } catch (error) {
      set({
        monFournisseur: null,
        error: getApiErrorMessage(error),
        isLoadingFournisseur: false,
      });
    }
  },

  chargerMesProduits: async () => {
    set({ isLoadingProduits: true, error: null });
    try {
      const response = await semencesApi.mesProduits();
      set({
        mesProduitsListe: response.items,
        isLoadingProduits: false,
      });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingProduits: false,
      });
    }
  },

  clearFournisseurSelectionne: () => set({ fournisseurSelectionne: null }),

  ajouterAuPanier: (produit, quantite = 1) => {
    if (produit.statut !== "ACTIF" || produit.stock_disponible <= 0) {
      set({ error: "Ce produit n'est pas disponible" });
      return;
    }

    const quantiteDemandee = Math.max(1, quantite);
    const panier = [...get().panier];
    const index = panier.findIndex((item) => item.produit.id === produit.id);

    if (index >= 0) {
      const prochaineQuantite = panier[index].quantite + quantiteDemandee;
      panier[index] = {
        ...panier[index],
        quantite: Math.min(prochaineQuantite, produit.stock_disponible),
      };
    } else {
      panier.push({
        produit,
        quantite: Math.min(quantiteDemandee, produit.stock_disponible),
      });
    }

    set({ panier, ...calculerPanier(panier), error: null });
  },

  modifierQuantite: (produitId, quantite) => {
    if (quantite <= 0) {
      get().retirerDuPanier(produitId);
      return;
    }

    const panier = get()
      .panier.map((item) => {
        if (item.produit.id !== produitId) return item;
        return {
          ...item,
          quantite: Math.min(Math.max(1, quantite), item.produit.stock_disponible),
        };
      })
      .filter((item) => item.produit.stock_disponible > 0);

    set({ panier, ...calculerPanier(panier) });
  },

  retirerDuPanier: (produitId) => {
    const panier = get().panier.filter((item) => item.produit.id !== produitId);
    set({ panier, ...calculerPanier(panier) });
  },

  viderPanier: () => set({ panier: [], nombreArticles: 0, totalPanier: 0 }),

  confirmerCommandeDepuisPanier: async (payload = {}) => {
    const { panier } = get();
    if (panier.length === 0) {
      set({ error: "Le panier est vide" });
      return null;
    }

    set({ isSubmittingCommande: true, error: null });
    try {
      await semencesApi.viderPanierServeur();
      for (const item of panier) {
        await semencesApi.ajouterPanierItem({
          produit_id: item.produit.id,
          quantite: item.quantite,
        });
      }
      const commande = await semencesApi.creerCommandeDepuisPanier(payload);
      set({
        panier: [],
        nombreArticles: 0,
        totalPanier: 0,
        commandeSelectionnee: commande,
        isSubmittingCommande: false,
      });
      await get().chargerCommandes();
      return commande;
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isSubmittingCommande: false,
      });
      return null;
    }
  },

  chargerCommandes: async () => {
    set({ isLoadingCommandes: true, error: null });
    try {
      const response = await semencesApi.listerCommandes();
      set({ commandes: response.items, isLoadingCommandes: false });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingCommandes: false,
      });
    }
  },

  chargerCommande: async (id) => {
    set({ isLoadingCommandes: true, commandeSelectionnee: null, error: null });
    try {
      const commande = await semencesApi.getCommande(id);
      set({
        commandeSelectionnee: commande as CommandeResponse,
        isLoadingCommandes: false,
      });
    } catch (error) {
      set({
        error: getApiErrorMessage(error),
        isLoadingCommandes: false,
      });
    }
  },

      clearError: () => set({ error: null }),
    }),
    {
      name: "agrilyo-semences-panier",
      storage: createJSONStorage(() => secureStoreStorage),
      partialize: (state) => ({
        panier: state.panier,
        ...calculerPanier(state.panier),
      }),
    }
  )
);

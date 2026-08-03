/**
 * API Semences - AGRILYO M2
 * Types et appels vers les endpoints /semences.
 */

import { apiClient } from "./client";

// =============================================================================
// Types
// =============================================================================

export type TypeProduit = "SEMENCE" | "PLANT" | "BOUTURE" | "TUBERCULE";
export type StatutFournisseur = "EN_ATTENTE" | "VERIFIE" | "SUSPENDU" | "REJETE";
export type NiveauLabel = "BRONZE" | "ARGENT" | "OR";
export type StatutProduit = "ACTIF" | "RUPTURE" | "INACTIF" | "EN_ATTENTE";
export type UniteStock = "KG" | "TONNE" | "UNITE" | "SACHET" | "BOTTE";
export type TypeCertification = "ANADER" | "FIRCA" | "MINAGRI" | "ISO" | "BIO" | "AUTRE";
export type StatutCommandeSemences =
  | "BROUILLON"
  | "CONFIRMEE"
  | "EN_ATTENTE_PAIEMENT"
  | "PAYEE"
  | "ANNULEE"
  | "ECHEC_PAIEMENT"
  | "EN_PREPARATION"
  | "LIVREE";
export type TriProduits = "created_at_desc" | "prix_asc" | "prix_desc" | "note_desc";
export type TriFournisseurs = "note_desc" | "created_at_desc" | "nombre_produits_desc";

export interface AuteurAvisResume {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  region: string | null;
}

export interface FournisseurResume {
  id: string;
  nom_commercial: string;
  region: string;
  ville: string | null;
  statut: StatutFournisseur;
  label_ivoire: NiveauLabel | null;
  note_moyenne: number;
  nombre_avis: number;
  nombre_produits_actifs: number;
  logo_url: string | null;
  created_at: string;
}

export interface FournisseurDetail extends FournisseurResume {
  description: string | null;
  adresse_complete: string | null;
  latitude: number | null;
  longitude: number | null;
  telephone_pro: string | null;
  email_pro: string | null;
  site_web: string | null;
  label_attribue_le: string | null;
  label_expire_le: string | null;
  verifie_le: string | null;
  updated_at: string;
}

export interface PhotoProduit {
  id: string;
  url_stockage: string;
  url_miniature: string | null;
  nom_fichier: string;
  taille_bytes: number | null;
  ordre: number;
  est_principale: boolean;
  created_at: string;
}

export interface CertificationProduit {
  id: string;
  type_certification: TypeCertification;
  numero_certificat: string | null;
  organisme_delivreur: string | null;
  date_delivrance: string | null;
  date_expiration: string | null;
  url_document: string | null;
  est_verifie: boolean;
}

export interface AvisProduit {
  id: string;
  note: number;
  commentaire: string | null;
  est_publie: boolean;
  est_verifie_achat: boolean;
  created_at: string;
  auteur: AuteurAvisResume;
}

export interface AvisProduitResume {
  id: string;
  note: number;
  commentaire: string | null;
  est_verifie_achat: boolean;
  created_at: string;
  auteur: AuteurAvisResume;
}

export interface ProduitResume {
  id: string;
  nom: string;
  type_produit: TypeProduit;
  variete: string | null;
  culture: string;
  prix_unitaire: number;
  unite_stock: UniteStock;
  stock_disponible: number;
  statut: StatutProduit;
  note_moyenne: number;
  nombre_avis: number;
  photo_principale_url: string | null;
  fournisseur: FournisseurResume;
  created_at: string;
}

export interface ProduitDetail extends ProduitResume {
  description: string | null;
  duree_germination_jours: number | null;
  rendement_potentiel: string | null;
  zones_adaptation: string | null;
  saison_semis: string | null;
  stock_minimum_commande: number;
  nombre_vues: number;
  updated_at: string;
  photos: PhotoProduit[];
  certifications: CertificationProduit[];
  avis: AvisProduitResume[];
}

export interface ProduitListResponse {
  items: ProduitResume[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface FournisseurListResponse {
  items: FournisseurResume[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AvisListResponse {
  items: AvisProduit[];
  total: number;
  note_moyenne: number;
  page: number;
  size: number;
  pages: number;
}

export interface ProduitFiltres {
  culture?: string | null;
  type_produit?: TypeProduit | null;
  region?: string | null;
  prix_min?: number | null;
  prix_max?: number | null;
  certifie?: boolean | null;
  label_ivoire?: NiveauLabel | null;
  en_stock?: boolean | null;
  page?: number;
  size?: number;
  tri?: TriProduits;
}

export interface FournisseurFiltres {
  region?: string | null;
  label_ivoire?: NiveauLabel | null;
  culture?: string | null;
  note_min?: number | null;
  page?: number;
  size?: number;
  tri?: TriFournisseurs;
}

export interface FournisseurCreate {
  nom_commercial: string;
  description?: string | null;
  region: string;
  ville?: string | null;
  adresse_complete?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  telephone_pro?: string | null;
  email_pro?: string | null;
  site_web?: string | null;
}

export type FournisseurUpdate = Partial<FournisseurCreate>;

export interface ProduitCreate {
  nom: string;
  type_produit: TypeProduit;
  variete?: string | null;
  culture: string;
  description?: string | null;
  duree_germination_jours?: number | null;
  rendement_potentiel?: string | null;
  zones_adaptation?: string | null;
  saison_semis?: string | null;
  prix_unitaire: number;
  unite_stock?: UniteStock;
  stock_disponible?: number;
  stock_minimum_commande?: number;
}

export interface ProduitUpdate {
  nom?: string | null;
  variete?: string | null;
  description?: string | null;
  duree_germination_jours?: number | null;
  rendement_potentiel?: string | null;
  zones_adaptation?: string | null;
  saison_semis?: string | null;
  prix_unitaire?: number | null;
  unite_stock?: UniteStock | null;
  stock_disponible?: number | null;
  stock_minimum_commande?: number | null;
  statut?: StatutProduit | null;
}

export interface CertificationCreate {
  type_certification: TypeCertification;
  numero_certificat?: string | null;
  organisme_delivreur?: string | null;
  date_delivrance?: string | null;
  date_expiration?: string | null;
}

export interface AvisCreate {
  note: number;
  commentaire?: string | null;
}

export interface PhotoUploadParams {
  nom_fichier: string;
  url_stockage: string;
  url_miniature?: string | null;
  taille_bytes?: number | null;
  ordre?: number;
  est_principale?: boolean;
}

export interface PhotoUploadResponse {
  id: string;
  url_stockage: string;
  url_miniature: string | null;
  ordre: number;
  est_principale: boolean;
  message: string;
}

export interface PanierItemCreate {
  produit_id: string;
  quantite: number;
}

export interface PanierItemResponse {
  id: string;
  produit_id: string;
  quantite: number;
  created_at: string;
  updated_at: string;
  produit: ProduitResume;
}

export interface PanierResponse {
  items: PanierItemResponse[];
  total_estime: number;
  devise: "XOF";
  nombre_items: number;
}

export interface LigneCommandeCreate {
  produit_id: string;
  quantite: number;
}

export interface CommandeCreate {
  lignes: LigneCommandeCreate[];
  nom_contact?: string | null;
  telephone_contact?: string | null;
  region_livraison?: string | null;
  ville_livraison?: string | null;
  adresse_livraison?: string | null;
  note_client?: string | null;
}

export type CommandeFromPanierCreate = Omit<CommandeCreate, "lignes">;

export interface LigneCommandeResponse {
  id: string;
  commande_id: string;
  produit_id: string;
  fournisseur_id: string;
  quantite: number;
  prix_unitaire_snapshot: number;
  montant_ligne: number;
  produit_nom_snapshot: string;
  produit_variete_snapshot: string | null;
  culture_snapshot: string;
  unite_stock_snapshot: UniteStock;
  fournisseur_nom_snapshot: string;
  created_at: string;
}

export interface CommandeResume {
  id: string;
  reference: string;
  statut: StatutCommandeSemences;
  devise: "XOF";
  montant_total: number;
  nombre_lignes: number;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommandeDetail extends CommandeResume {
  nom_contact: string | null;
  telephone_contact: string | null;
  region_livraison: string | null;
  ville_livraison: string | null;
  adresse_livraison: string | null;
  note_client: string | null;
  lignes: LigneCommandeResponse[];
  paiement_actif: null;
  checkout_url?: null;
}

export interface CommandeResponse extends CommandeDetail {
  acheteur_id: string;
  paiements: [];
}

export interface CommandeListResponse {
  items: CommandeResume[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const TYPE_PRODUIT_LABELS: Record<TypeProduit, string> = {
  SEMENCE: "Semence",
  PLANT: "Plant",
  BOUTURE: "Bouture",
  TUBERCULE: "Tubercule",
};

export const UNITE_STOCK_LABELS: Record<UniteStock, string> = {
  KG: "kg",
  TONNE: "tonne",
  UNITE: "unite",
  SACHET: "sachet",
  BOTTE: "botte",
};

export const LABEL_IVOIRE_LABELS: Record<NiveauLabel, string> = {
  BRONZE: "Label Bronze",
  ARGENT: "Label Argent",
  OR: "Label Or",
};

const cleanParams = <T extends Record<string, unknown>>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

// =============================================================================
// Appels API
// =============================================================================

export const semencesApi = {
  listerProduits: async (filtres: ProduitFiltres = {}): Promise<ProduitListResponse> => {
    const { data } = await apiClient.get<ProduitListResponse>("/semences/produits", {
      params: cleanParams(filtres as Record<string, unknown>),
    });
    return data;
  },

  getProduit: async (id: string): Promise<ProduitDetail> => {
    const { data } = await apiClient.get<ProduitDetail>(`/semences/produits/${id}`);
    return data;
  },

  creerProduit: async (payload: ProduitCreate): Promise<ProduitDetail> => {
    const { data } = await apiClient.post<ProduitDetail>("/semences/produits", payload);
    return data;
  },

  modifierProduit: async (id: string, payload: ProduitUpdate): Promise<ProduitDetail> => {
    const { data } = await apiClient.patch<ProduitDetail>(`/semences/produits/${id}`, payload);
    return data;
  },

  mesProduits: async (page = 1, size = 20): Promise<ProduitListResponse> => {
    const { data } = await apiClient.get<ProduitListResponse>("/semences/produits/mes-produits", {
      params: { page, size },
    });
    return data;
  },

  ajouterPhotoProduit: async (
    produitId: string,
    params: PhotoUploadParams
  ): Promise<PhotoUploadResponse> => {
    const { data } = await apiClient.post<PhotoUploadResponse>(
      `/semences/produits/${produitId}/photos`,
      null,
      { params: cleanParams(params as unknown as Record<string, unknown>) }
    );
    return data;
  },

  ajouterCertification: async (
    produitId: string,
    payload: CertificationCreate
  ): Promise<CertificationProduit> => {
    const { data } = await apiClient.post<CertificationProduit>(
      `/semences/produits/${produitId}/certifications`,
      payload
    );
    return data;
  },

  listerAvis: async (produitId: string, page = 1, size = 20): Promise<AvisListResponse> => {
    const { data } = await apiClient.get<AvisListResponse>(
      `/semences/produits/${produitId}/avis`,
      { params: { page, size } }
    );
    return data;
  },

  ajouterAvis: async (produitId: string, payload: AvisCreate): Promise<AvisProduit> => {
    const { data } = await apiClient.post<AvisProduit>(
      `/semences/produits/${produitId}/avis`,
      payload
    );
    return data;
  },

  listerFournisseurs: async (
    filtres: FournisseurFiltres = {}
  ): Promise<FournisseurListResponse> => {
    const { data } = await apiClient.get<FournisseurListResponse>("/semences/fournisseurs", {
      params: cleanParams(filtres as Record<string, unknown>),
    });
    return data;
  },

  getFournisseur: async (id: string): Promise<FournisseurDetail> => {
    const { data } = await apiClient.get<FournisseurDetail>(`/semences/fournisseurs/${id}`);
    return data;
  },

  creerFournisseur: async (payload: FournisseurCreate): Promise<FournisseurDetail> => {
    const { data } = await apiClient.post<FournisseurDetail>("/semences/fournisseurs", payload);
    return data;
  },

  getMonFournisseur: async (): Promise<FournisseurDetail> => {
    const { data } = await apiClient.get<FournisseurDetail>("/semences/fournisseurs/moi");
    return data;
  },

  modifierMonFournisseur: async (payload: FournisseurUpdate): Promise<FournisseurDetail> => {
    const { data } = await apiClient.patch<FournisseurDetail>(
      "/semences/fournisseurs/moi",
      payload
    );
    return data;
  },

  getPanier: async (): Promise<PanierResponse> => {
    const { data } = await apiClient.get<PanierResponse>("/semences/panier");
    return data;
  },

  ajouterPanierItem: async (payload: PanierItemCreate): Promise<PanierResponse> => {
    const { data } = await apiClient.post<PanierResponse>("/semences/panier/items", payload);
    return data;
  },

  modifierPanierItem: async (
    produitId: string,
    quantite: number
  ): Promise<PanierResponse> => {
    const { data } = await apiClient.patch<PanierResponse>(
      `/semences/panier/items/${produitId}`,
      { quantite }
    );
    return data;
  },

  retirerPanierItem: async (produitId: string): Promise<void> => {
    await apiClient.delete(`/semences/panier/items/${produitId}`);
  },

  viderPanierServeur: async (): Promise<void> => {
    await apiClient.delete("/semences/panier");
  },

  creerCommande: async (payload: CommandeCreate): Promise<CommandeResponse> => {
    const { data } = await apiClient.post<CommandeResponse>("/semences/commandes", payload);
    return data;
  },

  creerCommandeDepuisPanier: async (
    payload: CommandeFromPanierCreate
  ): Promise<CommandeResponse> => {
    const { data } = await apiClient.post<CommandeResponse>(
      "/semences/commandes/depuis-panier",
      payload
    );
    return data;
  },

  listerCommandes: async (page = 1, size = 20): Promise<CommandeListResponse> => {
    const { data } = await apiClient.get<CommandeListResponse>("/semences/commandes", {
      params: { page, size },
    });
    return data;
  },

  getCommande: async (id: string): Promise<CommandeDetail> => {
    const { data } = await apiClient.get<CommandeDetail>(`/semences/commandes/${id}`);
    return data;
  },
};

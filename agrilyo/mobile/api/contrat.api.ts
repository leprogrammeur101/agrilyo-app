/**
 * API Contrats & Messagerie — AGRILYO Sprint 3
 */

import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MessageItem {
  id: string;
  auteur_id: string;
  auteur_nom: string;
  contenu: string;
  lu: boolean;
  created_at: string;
  est_moi: boolean;
}

export interface ThreadDetail {
  id: string;
  annonce_id: string;
  est_actif: boolean;
  messages: MessageItem[];
}

export interface ThreadResume {
  id: string;
  annonce_id: string;
  est_actif: boolean;
  updated_at: string;
  dernier_message: string | null;
  messages_non_lus: number;
  annonce_region: string | null;
  annonce_superficie: number | null;
}

export interface ContratDetail {
  id: string;
  annonce_id: string;
  locataire_id: string;
  bailleur_id: string;
  type_contrat: string;
  date_debut: string | null;
  date_fin: string | null;
  montant_fcfa: number | null;
  statut: string;
  signe_bailleur: boolean;
  signe_locataire: boolean;
  hash_sha256: string | null;
  horodatage: string | null;
  url_pdf: string | null;
  created_at: string;
}

export interface SignatureResult {
  contrat: ContratDetail;
  hash_sha256: string | null;
  horodatage: string | null;
  est_completement_signe: boolean;
  message: string;
}

export const TYPE_CONTRAT_LABELS: Record<string, string> = {
  BAIL_RURAL:     "Bail rural",
  METAYAGE:       "Métayage",
  AMODIATION:     "Amodiation",
  PROMESSE_VENTE: "Promesse de vente",
};

// ── Appels API ────────────────────────────────────────────────────────────────

export const contratApi = {

  // ── Messagerie ──────────────────────────────────────────────────────────────

  mesThreads: async (): Promise<ThreadResume[]> => {
    const { data } = await apiClient.get<ThreadResume[]>("/foncier/threads");
    return data;
  },

  getThread: async (threadId: string): Promise<ThreadDetail> => {
    const { data } = await apiClient.get<ThreadDetail>(
      `/foncier/threads/${threadId}`
    );
    return data;
  },

  ouvrirThread: async (
    annonceId: string,
    messageInitial: string
  ): Promise<{ id: string; annonce_id: string }> => {
    const { data } = await apiClient.post("/foncier/threads", {
      annonce_id: annonceId,
      message_initial: messageInitial,
    });
    return data;
  },

  envoyerMessage: async (
    threadId: string,
    contenu: string
  ): Promise<{ id: string; contenu: string; created_at: string }> => {
    const { data } = await apiClient.post(
      `/foncier/threads/${threadId}/messages`,
      { contenu }
    );
    return data;
  },

  // ── Contrats ────────────────────────────────────────────────────────────────

  creerContrat: async (payload: {
    annonce_id: string;
    locataire_id: string;
    type_contrat: string;
    montant_fcfa?: number | null;
    date_debut?: string | null;
    date_fin?: string | null;
  }): Promise<ContratDetail> => {
    const { data } = await apiClient.post<ContratDetail>(
      "/foncier/contrats",
      payload
    );
    return data;
  },

  getContrat: async (contratId: string): Promise<ContratDetail> => {
    const { data } = await apiClient.get<ContratDetail>(
      `/foncier/contrats/${contratId}`
    );
    return data;
  },

  demanderOTP: async (
    contratId: string
  ): Promise<{ message: string; success: boolean; debug_code?: string }> => {
    const { data } = await apiClient.post(
      `/foncier/contrats/${contratId}/demander-otp`
    );
    return data;
  },

  signer: async (
    contratId: string,
    codeOtp: string
  ): Promise<SignatureResult> => {
    const { data } = await apiClient.post<SignatureResult>(
      `/foncier/contrats/${contratId}/signer`,
      { code_otp: codeOtp }
    );
    return data;
  },

  // ── Litiges ─────────────────────────────────────────────────────────────────

  declarerLitige: async (
    contratId: string,
    description: string
  ): Promise<{ id: string }> => {
    const { data } = await apiClient.post("/foncier/litiges", {
      contrat_id: contratId,
      description,
    });
    return data;
  },
};
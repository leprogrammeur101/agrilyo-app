/**
 * API Auth — AGRILYO
 * Appels vers les endpoints d'authentification du backend FastAPI.
 */

import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SendOTPPayload {
  phone_number: string;
}

export interface VerifyOTPPayload {
  phone_number: string;
  code: string;
  first_name?: string;
  last_name?: string;
  region?: string;
}

export interface UserProfile {
  id: string;
  phone_number: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  region: string | null;
  roles: string[];
  status: string;
  phone_verified: boolean;
  language: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  tokens: TokenPair;
  user: UserProfile;
  is_new_user: boolean;
}

// ── Appels API ────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Demande l'envoi d'un OTP par SMS.
   */
  sendOTP: async (payload: SendOTPPayload) => {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      debug_code?: string;
    }>("/auth/send-otp", payload);
    return data;
  },

  /**
   * Vérifie l'OTP et retourne les tokens JWT + profil utilisateur.
   */
  verifyOTP: async (payload: VerifyOTPPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/verify-otp", payload);
    return data;
  },

  /**
   * Renouvelle le access token via le refresh token.
   */
  refreshToken: async (refreshToken: string): Promise<TokenPair> => {
    const { data } = await apiClient.post<TokenPair>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },

  /**
   * Déconnexion — invalide le refresh token en base.
   */
  logout: async () => {
    await apiClient.post("/auth/logout");
  },

  /**
   * Récupère le profil de l'utilisateur connecté.
   */
  getMe: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>("/auth/me");
    return data;
  },
};
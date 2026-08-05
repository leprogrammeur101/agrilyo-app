/**
 * Zustand Auth Store — AGRILYO
 * État global d'authentification. Persiste les tokens dans SecureStore.
 */

import { create } from "zustand";
import { tokenStorage } from "../api/client";
import { authApi, UserProfile } from "../api/auth.api";

interface AuthState {
  // ── État ────────────────────────────────────────────────────────────────────
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;   // true après vérification du token au démarrage

  // ── Actions ──────────────────────────────────────────────────────────────────
  initialize: () => Promise<void>;
  setAuth: (user: UserProfile, tokens: { access_token: string; refresh_token: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  /**
   * Appelé au démarrage de l'app.
   * Vérifie si un token valide existe en SecureStore.
   */
  initialize: async () => {
    try {
      const accessToken = await tokenStorage.getAccess();
      if (!accessToken) {
        set({ isInitialized: true, isAuthenticated: false });
        return;
      }
      // Tente de récupérer le profil (si token expiré, l'intercepteur axios tente le refresh)
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isInitialized: true });
    } catch {
      // Token invalide ou refresh impossible → déconnexion propre
      try {
        if (tokenStorage?.clear){
          await tokenStorage.clear();}
      } catch {
        // ignore
      }
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  /**
   * Appelé après vérification OTP réussie.
   */
  setAuth: async (user, tokens) => {
    await tokenStorage.setAccess(tokens.access_token);
    await tokenStorage.setRefresh(tokens.refresh_token);
    set({ user, isAuthenticated: true });
  },

  /**
   * Déconnexion complète.
   */
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // On déconnecte quand même côté client si le backend est inaccessible
    } finally {
      await tokenStorage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },

  /**
   * Met à jour partiellement le profil utilisateur (ex : après onboarding).
   */
  updateUser: (updates) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...updates } });
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
/**
 * Client Axios AGRILYO — Gestion automatique du JWT refresh
 * Toutes les requêtes API passent par ce client.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

// ── Configuration de base ──────────────────────────────────────────────────────
const API_BASE_URL =
  (typeof process !== "undefined" ? process.env.EXPO_PUBLIC_API_URL : undefined) ||
  "http://10.166.180.154:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Clés SecureStore ──────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "agrilyo_access_token";
const REFRESH_TOKEN_KEY = "agrilyo_refresh_token";

export const tokenStorage = {
  getAccess: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefresh: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setAccess: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  setRefresh: (token: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// ── Intercepteur requêtes — injection du token ────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Intercepteur réponses — refresh automatique du token ──────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Si 401 et pas encore réessayé → tenter le refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Mettre la requête en file d'attente pendant le refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefresh();
        if (!refreshToken) throw new Error("Pas de refresh token");

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        await tokenStorage.setAccess(data.access_token);
        processQueue(null, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Déconnexion si le refresh échoue
        await tokenStorage.clear();
        // Le store Zustand sera notifié via l'event emitter (voir auth.store.ts)
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Helper pour les erreurs API ────────────────────────────────────────────────
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0]?.msg || "Erreur de validation";
    }
    if (error.response?.status === 422) return "Données invalides. Vérifiez le formulaire.";
    if (error.response?.status === 401) return "Session expirée. Reconnectez-vous.";
    if (error.response?.status === 403) return "Accès refusé.";
    if (error.response?.status === 404) return "Ressource introuvable.";
    if (!error.response) return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  }
  return "Une erreur inattendue est survenue. Veuillez réessayer.";
}
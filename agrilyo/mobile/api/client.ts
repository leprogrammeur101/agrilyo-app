/**
 * Client HTTP Axios — AGRILYO Mobile (corrigé)
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";

// ✅ Utilise EXPO_PUBLIC_API_URL au build, ou localhost en fallback
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://10.95.162.154:8000/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response interceptor (refresh token) ─────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data.tokens;

        await SecureStore.setItemAsync("access_token", access_token);
        await SecureStore.setItemAsync("refresh_token", refresh_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("refresh_token");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ── Extraction de message d'erreur ───────────────────────────────────────────
/**
 * Extrait un message lisible depuis une erreur Axios/FastAPI ou une Error JS.
 * Le backend FastAPI renvoie généralement { detail: string | { msg: string }[] }.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown })?.detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      // Erreurs de validation Pydantic : [{ msg: "...", loc: [...] }, ...]
      const messages = detail
        .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: unknown }).msg) : null))
        .filter(Boolean);
      if (messages.length) return messages.join("\n");
    }

    if (error.code === "ECONNABORTED") {
      return "La connexion a expiré. Vérifiez votre réseau et réessayez.";
    }

    if (!error.response) {
      return "Impossible de contacter le serveur. Vérifiez votre connexion.";
    }

    return `Erreur ${error.response.status}. Veuillez réessayer.`;
  }

  if (error instanceof Error) return error.message;

  return "Une erreur inattendue est survenue.";
}

// ── Stockage centralisé des tokens ──────────────────────────────────────────
export const tokenStorage = {
  getAccess: () => SecureStore.getItemAsync("access_token"),
  getRefresh: () => SecureStore.getItemAsync("refresh_token"),
  setAccess: (token: string) => SecureStore.setItemAsync("access_token", token),
  setRefresh: (token: string) => SecureStore.setItemAsync("refresh_token", token),
  clear: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
  },
};

export { apiClient };
export default apiClient;

// ── Flag "onboarding déjà vu" (écran d'accueil affiché une seule fois) ───────
const ONBOARDING_KEY = "has_seen_onboarding";

export const onboardingStorage = {
  hasSeen: async (): Promise<boolean> => {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return value === "true";
  },
  markSeen: () => SecureStore.setItemAsync(ONBOARDING_KEY, "true"),
};
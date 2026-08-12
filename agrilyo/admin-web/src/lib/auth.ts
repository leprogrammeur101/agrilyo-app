/**
 * Authentification admin — réutilise POST /auth/login-password (déjà en place
 * côté backend pour le mobile). Aucun endpoint dédié "admin login" : on se
 * contente de vérifier après connexion que le compte a bien le rôle ADMIN.
 */

import { api, ApiError, setStoredToken } from "./api";
import { AuthResponse, UserProfile } from "./types";

const USER_KEY = "agrilyo_admin_user";

export class NotAdminError extends Error {
  constructor() {
    super("Ce compte n'a pas les droits administrateur.");
  }
}

export async function loginAdmin(phoneNumber: string, password: string): Promise<UserProfile> {
  const response = await api.post<AuthResponse>("/auth/login-password", {
    phone_number: phoneNumber,
    password,
  });

  if (!response.user.roles.includes("ADMIN")) {
    throw new NotAdminError();
  }

  setStoredToken(response.tokens.access_token);
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }
  return response.user;
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function logoutAdmin() {
  setStoredToken(null);
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

export { ApiError };